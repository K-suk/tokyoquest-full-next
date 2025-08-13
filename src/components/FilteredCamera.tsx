'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface FilteredCameraProps {
    onCapture: (imageData: string) => void;
    onClose: () => void;
}

export default function FilteredCamera({ onCapture, onClose }: FilteredCameraProps) {
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [showFilter, setShowFilter] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // カメラを開始
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // 背面カメラを使用
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
        } catch (error) {
            console.error('カメラの起動に失敗しました:', error);
            alert('カメラへのアクセスが許可されていません。');
        }
    }, []);

    // カメラを停止
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    // 写真を撮影
    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        setIsCapturing(true);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // キャンバスサイズをビデオサイズに設定
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // ビデオフレームをキャンバスに描画
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // フィルターを適用
        if (showFilter) {
            // フィルター画像を読み込んでオーバーレイ
            const filterImg = new window.Image();
            filterImg.onload = () => {
                // フィルターを画面サイズに合わせて描画
                const filterWidth = canvas.width;
                const filterHeight = canvas.height;
                ctx.drawImage(filterImg, 0, 0, filterWidth, filterHeight);

                // 最終的な画像データを取得
                const imageData = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedImage(imageData);
                setIsCapturing(false);
            };
            filterImg.src = '/images/filter.PNG';
        } else {
            // フィルターなしで画像データを取得
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            setCapturedImage(imageData);
            setIsCapturing(false);
        }
    }, [showFilter]);

    // 写真を確定
    const confirmPhoto = useCallback(() => {
        if (capturedImage) {
            onCapture(capturedImage);
            stopCamera();
        }
    }, [capturedImage, onCapture, stopCamera]);

    // 写真を再撮影
    const retakePhoto = useCallback(() => {
        setCapturedImage(null);
        setIsCapturing(false);
    }, []);

    // コンポーネントマウント時にカメラを開始
    React.useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    return (
        <div className="fixed inset-0 z-50 bg-black">
            {/* ヘッダー */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 text-white p-4">
                <div className="flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="text-2xl hover:opacity-80"
                    >
                        ✕
                    </button>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            className={`px-3 py-1 rounded-full text-sm ${showFilter
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white text-black'
                                }`}
                        >
                            {showFilter ? 'フィルターON' : 'フィルターOFF'}
                        </button>
                    </div>
                </div>
            </div>

            {/* カメラビュー */}
            {!capturedImage && (
                <div className="relative w-full h-full">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />

                    {/* フィルターオーバーレイ */}
                    {showFilter && (
                        <div className="absolute inset-0 pointer-events-none">
                            <Image
                                src="/images/filter.PNG"
                                alt="Filter overlay"
                                fill
                                className="object-cover opacity-80"
                            />
                        </div>
                    )}

                    {/* 撮影ボタン */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                        <button
                            onClick={capturePhoto}
                            disabled={isCapturing}
                            className={`w-16 h-16 rounded-full border-4 border-white ${isCapturing ? 'bg-gray-500' : 'bg-white'
                                } flex items-center justify-center`}
                        >
                            {isCapturing ? (
                                <div className="w-8 h-8 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <div className="w-8 h-8 bg-gray-800 rounded-full" />
                            )}
                        </button>
                    </div>

                    {/* 撮影ガイド */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center pointer-events-none">
                        <div className="bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                            <p className="text-sm">カメラを構えて撮影してください</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 撮影結果 */}
            {capturedImage && (
                <div className="relative w-full h-full">
                    <Image
                        src={capturedImage}
                        alt="Captured photo"
                        fill
                        className="object-cover"
                    />

                    {/* 操作ボタン */}
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
                        <button
                            onClick={retakePhoto}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                            再撮影
                        </button>
                        <button
                            onClick={confirmPhoto}
                            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                            使用する
                        </button>
                    </div>
                </div>
            )}

            {/* 隠しキャンバス */}
            <canvas
                ref={canvasRef}
                className="hidden"
            />
        </div>
    );
}
