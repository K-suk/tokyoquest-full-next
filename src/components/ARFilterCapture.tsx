'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

interface ARFilterCaptureProps {
    onCapture: (imageData: string) => void;
    onCancel: () => void;
}

export default function ARFilterCapture({ onCapture, onCancel }: ARFilterCaptureProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const overlayRef = useRef<HTMLCanvasElement | null>(null);
    const captureRef = useRef<HTMLCanvasElement | null>(null);
    const faceLandmarkerRef = useRef<any>(null);
    const lastDetTimestampRef = useRef<number>(0);
    const rafRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [ready, setReady] = useState(false);
    const [errMsg, setErrMsg] = useState<string | null>(null);
    const spriteImgRef = useRef<HTMLImageElement | null>(null);

    // Multi-face support
    const MAX_FACES = 5;
    const ASSIGN_DIST_BASE = 0.12;
    const MIN_SPRITE_PX = 40;

    // Smoothing & stability
    const SMOOTH_ALPHA_POS = 0.18;
    const SMOOTH_ALPHA_SIZE = 0.18;
    const SMOOTH_ALPHA_ANGLE = 0.2;
    const TARGET_DETECT_FPS = 24;
    const COAST_MS = 350;
    const SHOW_HITS = 1;
    const HIDE_MISSES = 8;

    const RIGHT_EYE_OUTER = 33;
    const LEFT_EYE_OUTER = 263;

    // Multi-face trackers
    type Pose = { id: number; cx: number; cy: number; angle: number; width: number; height: number; visible: boolean; lastSeen: number; hits: number; misses: number; };
    const trackersRef = useRef<Pose[]>([]);
    const nextIdRef = useRef(1);

    // Constants
    const VISION_CDN_VERSION = "0.10.14";
    const VISION_WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_CDN_VERSION}/wasm`;
    const VISION_BUNDLE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_CDN_VERSION}/vision_bundle.mjs`;
    const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

    // Load TokyoQuest sunglasses overlay
    useEffect(() => {
        const img = new Image();
        img.src = "https://dummyimage.com/600x125/000/fff.png&text=TokyoQuest";
        img.crossOrigin = "anonymous";
        img.onload = () => (spriteImgRef.current = img);
        img.onerror = () => setErrMsg("Failed to load TokyoQuest sunglasses overlay");
    }, []);

    useEffect(() => {
        let stopped = false;

        const init = async () => {
            try {
                // 1) Start camera
                const isHttps = location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
                if (!isHttps) throw new Error("Camera requires HTTPS or localhost.");

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false,
                });
                streamRef.current = stream;
                if (!videoRef.current) return;
                videoRef.current.srcObject = stream;
                (videoRef.current as any).muted = true;
                (videoRef.current as any).playsInline = true;

                // ビデオの読み込みを待つ
                await new Promise<void>((resolve) => {
                    if (videoRef.current && videoRef.current.readyState >= 2) {
                        resolve();
                    } else if (videoRef.current) {
                        videoRef.current.addEventListener('loadedmetadata', () => resolve(), { once: true });
                    } else {
                        resolve(); // fallback
                    }
                });

                try {
                    await videoRef.current.play();
                } catch (playError) {
                    console.warn('Video play interrupted:', playError);
                    // プレイが中断された場合は無視して続行
                }

                // 2) Load MediaPipe via CDN
                const vision: any = await loadVisionBundle();
                const { FilesetResolver, FaceLandmarker } = vision;

                // 3) Init Landmarker
                const filesetResolver = await FilesetResolver.forVisionTasks(VISION_WASM_BASE);
                faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
                    runningMode: "VIDEO",
                    numFaces: MAX_FACES,
                });

                // 4) Canvases & loop
                setupCanvases();
                setReady(true);
                startRenderLoop();
            } catch (e: any) {
                console.error(e);
                setErrMsg(e?.message ?? String(e));
            }
        };

        const setupCanvases = () => {
            if (!videoRef.current || !overlayRef.current) return;
            const v = videoRef.current;
            const c = overlayRef.current;
            const cap = (captureRef.current = document.createElement("canvas"));

            const resize = () => {
                const vw = v.videoWidth || 1280;
                const vh = v.videoHeight || 720;
                c.width = vw;
                c.height = vh;
                cap.width = vw;
                cap.height = vh;
            };

            if (v.readyState >= 2) resize();
            else v.addEventListener("loadedmetadata", resize, { once: true });
        };

        const startRenderLoop = () => {
            const tick = () => {
                if (stopped) return;
                renderFrame();
                rafRef.current = requestAnimationFrame(tick);
            };
            rafRef.current = requestAnimationFrame(tick);
        };

        const renderFrame = () => {
            const v = videoRef.current;
            const c = overlayRef.current;
            const faceLandmarker = faceLandmarkerRef.current;
            const img = spriteImgRef.current;
            if (!v || !c || !faceLandmarker || !img) return;

            const now = performance.now();
            const minDelta = 1000 / TARGET_DETECT_FPS;
            let faces: any[] = [];
            if (now - lastDetTimestampRef.current >= minDelta) {
                lastDetTimestampRef.current = now;
                const res = faceLandmarker.detectForVideo(v, now);
                faces = res?.faceLandmarks ? res.faceLandmarks : [];
            }

            const ctx = c.getContext("2d");
            if (!ctx) return;
            ctx.clearRect(0, 0, c.width, c.height);

            // Build detections from face landmarks
            type Det = { cx: number; cy: number; angle: number; width: number; height: number };
            const dets: Det[] = [];
            for (const lm of faces) {
                if (!lm || !lm[RIGHT_EYE_OUTER] || !lm[LEFT_EYE_OUTER]) continue;
                const l = lm[RIGHT_EYE_OUTER];
                const r = lm[LEFT_EYE_OUTER];
                const lx = l.x * c.width; const ly = l.y * c.height;
                const rx = r.x * c.width; const ry = r.y * c.height;
                const dx = rx - lx; const dy = ry - ly;
                const angle = Math.atan2(dy, dx);
                const eyeDist = Math.hypot(dx, dy);
                const desiredWidth = eyeDist * 2.4;
                const desiredHeight = desiredWidth * ((img.height || 200) / (img.width || 600));
                if (desiredWidth < MIN_SPRITE_PX) continue;
                const cx = (lx + rx) / 2;
                const cy = (ly + ry) / 2 + eyeDist * 0.15;
                dets.push({ cx, cy, angle, width: desiredWidth, height: desiredHeight });
            }
            dets.sort((a, b) => b.width - a.width);

            // Associate detections to existing trackers
            const trackers = trackersRef.current;
            const usedDet = new Set<number>();
            const assignDistPx = Math.min(c.width, c.height) * ASSIGN_DIST_BASE;

            for (const t of trackers) {
                let bestI = -1, bestD = Infinity;
                for (let i = 0; i < dets.length; i++) {
                    if (usedDet.has(i)) continue;
                    const d = Math.hypot(dets[i].cx - t.cx, dets[i].cy - t.cy);
                    if (d < bestD) { bestD = d; bestI = i; }
                }
                if (bestI >= 0 && bestD <= assignDistPx) {
                    const d = dets[bestI];
                    t.cx = lerp(t.cx || d.cx, d.cx, SMOOTH_ALPHA_POS);
                    t.cy = lerp(t.cy || d.cy, d.cy, SMOOTH_ALPHA_POS);
                    t.angle = slerpAngle(t.angle || d.angle, d.angle, SMOOTH_ALPHA_ANGLE);
                    t.width = lerp(t.width || d.width, d.width, SMOOTH_ALPHA_SIZE);
                    t.height = lerp(t.height || d.height, d.height, SMOOTH_ALPHA_SIZE);
                    t.lastSeen = now;
                    t.hits += 1; t.misses = 0;
                    if (!t.visible && t.hits >= SHOW_HITS) t.visible = true;
                    usedDet.add(bestI);
                } else {
                    t.misses += 1; t.hits = 0;
                    if (now - t.lastSeen > COAST_MS && t.misses >= HIDE_MISSES) t.visible = false;
                }
            }

            // Spawn or replace trackers for unmatched detections
            for (let i = 0; i < dets.length; i++) {
                if (usedDet.has(i)) continue;
                const d = dets[i];
                if (trackers.length < MAX_FACES) {
                    trackers.push({ id: nextIdRef.current++, cx: d.cx, cy: d.cy, angle: d.angle, width: d.width, height: d.height, visible: false, lastSeen: now, hits: 1, misses: 0 });
                } else {
                    let worst = -1, worstScore = -Infinity;
                    for (let k = 0; k < trackers.length; k++) {
                        const t = trackers[k];
                        const score = (now - t.lastSeen) + (t.visible ? 100000 : 0);
                        if (score > worstScore) { worstScore = score; worst = k; }
                    }
                    if (worst >= 0 && !trackers[worst].visible) {
                        trackers[worst] = { id: nextIdRef.current++, cx: d.cx, cy: d.cy, angle: d.angle, width: d.width, height: d.height, visible: false, lastSeen: now, hits: 1, misses: 0 };
                    }
                }
            }

            // Cull long-gone trackers
            for (let i = trackers.length - 1; i >= 0; i--) {
                if (!trackers[i].visible && now - trackers[i].lastSeen > COAST_MS * 4) trackers.splice(i, 1);
            }

            // Draw all visible trackers
            for (const t of trackers) {
                const within = now - t.lastSeen <= COAST_MS;
                if (!(t.visible || within)) continue;
                ctx.save();
                ctx.translate(t.cx, t.cy);
                ctx.rotate(t.angle);
                ctx.drawImage(img, -t.width / 2, -t.height * 0.5, t.width, t.height);
                ctx.restore();
            }
        };

        init();

        return () => {
            stopped = true;
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            try {
                faceLandmarkerRef.current?.close?.();
                faceLandmarkerRef.current = null;
            } catch { }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => {
                    t.stop();
                    t.enabled = false;
                });
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.srcObject = null;
            }
        };
    }, []);

    const handleCapture = () => {
        const v = videoRef.current;
        const cap = captureRef.current;
        const overlay = overlayRef.current;
        if (!v || !cap || !overlay) return;

        cap.width = v.videoWidth || cap.width;
        cap.height = v.videoHeight || cap.height;
        const ctx = cap.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(v, 0, 0, cap.width, cap.height);
        ctx.drawImage(overlay, 0, 0, cap.width, cap.height);

        const imageData = cap.toDataURL("image/png");
        onCapture(imageData);
    };

    return (
        <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200 bg-black">
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline muted />
                <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white bg-black bg-opacity-50 px-4 py-2 rounded-full text-sm">
                        Position your face in the center
                    </div>
                </div>
            </div>

            <div className="flex gap-4 justify-center">
                <button
                    onClick={handleCapture}
                    disabled={!ready}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    📸 Capture with Filter
                </button>
                <button
                    onClick={onCancel}
                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium"
                >
                    Cancel
                </button>
            </div>

            {!ready && <p className="text-center text-gray-600">🔄 Initializing camera & AI model…</p>}
            {errMsg && <p className="text-center text-red-600">⚠️ {errMsg}</p>}
        </div>
    );
}

// Loader that survives HMR
async function loadVisionBundle(): Promise<any> {
    const VISION_CDN_VERSION = "0.10.14";
    const VISION_BUNDLE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_CDN_VERSION}/vision_bundle.mjs`;

    const w = window as any;
    if (w.__mp_vision) return w.__mp_vision;
    if (w.__mp_vision_promise) return w.__mp_vision_promise;

    const p = import(/* webpackIgnore: true */ VISION_BUNDLE_URL)
        .then((m) => { (window as any).__mp_vision = m; return m; })
        .catch((e) => { delete (window as any).__mp_vision_promise; throw e; });
    w.__mp_vision_promise = p;
    return p;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function slerpAngle(a: number, b: number, t: number) {
    let diff = ((b - a + Math.PI) % (2 * Math.PI)) - Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;
    return a + diff * t;
}
