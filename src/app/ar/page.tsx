'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

// === TokyoQuest AR Sunglasses (MediaPipe) — with Camera Switch ===
// New feature: allow user to choose camera (front/back) when multiple are available.

export default function ARSunglasses() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const faceLandmarkerVideoRef = useRef<any>(null);
    const faceLandmarkerImageRef = useRef<any>(null);
    const rafRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);
    const [running, setRunning] = useState(false);
    const [message, setMessage] = useState<string>('');
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    // Diagnostics state
    const [isSecure, setIsSecure] = useState<boolean>(true);
    const [inIframe, setInIframe] = useState<boolean>(false);
    const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
    const [hasMediaDevices, setHasMediaDevices] = useState<boolean>(true);
    const [hasVideoInput, setHasVideoInput] = useState<boolean | null>(null);
    const [lastError, setLastError] = useState<string>('');

    // Camera selection
    const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

    // Self-test state
    const [tests, setTests] = useState<{ name: string; pass: boolean; details?: string }[]>([]);

    // Smoothing refs (camera mode)
    const smoothRef = useRef({ cx: 0, cy: 0, angle: 0, eyeDist: 0, initialized: false });

    const CDN_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
    const REMOTE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task';
    const LOCAL_MODEL = '/models/face_landmarker.task';

    // ===== Utilities =====
    const explainCameraSettings = () => {
        return [
            'If you denied permission:',
            '• Chrome (Desktop/Android): Click the lock icon → Site settings → Allow Camera.',
            '• iOS Safari: Settings → Safari → Camera → Allow.',
            '• macOS Safari: Safari → Settings → Websites → Camera → Allow for this site.',
            'Make sure the site is HTTPS or running on localhost.'
        ].join('');
    };

    const recordError = (e: unknown) => {
        let msg = 'Unknown error';
        if (e && typeof e === 'object' && 'name' in e) {
            const name = (e as any).name as string;
            const message = (e as any).message as string | undefined;
            switch (name) {
                case 'NotAllowedError':
                    msg = 'Camera permission was denied. ' + explainCameraSettings();
                    break;
                case 'NotFoundError':
                    msg = 'No camera device was found on this device.';
                    break;
                case 'NotReadableError':
                    msg = 'Camera is in use by another app. Close other apps and retry.';
                    break;
                case 'OverconstrainedError':
                    msg = 'Requested camera constraints are not available on this device.';
                    break;
                case 'SecurityError':
                    msg = 'Browser blocked camera access. Ensure HTTPS or localhost.';
                    break;
                default:
                    msg = `${name}${message ? ': ' + message : ''}`;
            }
        }
        setLastError(msg);
        setMessage(msg);
    };

    const refreshDevices = useCallback(async () => {
        try {
            const devs = await navigator.mediaDevices?.enumerateDevices?.();
            const vids = (devs || []).filter((d) => d.kind === 'videoinput');
            setVideoInputs(vids);
            setHasVideoInput(vids.length > 0);
            // Auto-pick front/back if we can infer from label
            if (!selectedDeviceId && vids.length) {
                const front = vids.find((d) => /front|user/i.test(d.label));
                const back = vids.find((d) => /back|environment|rear/i.test(d.label));
                if (front && facingMode === 'user') setSelectedDeviceId(front.deviceId);
                else if (back && facingMode === 'environment') setSelectedDeviceId(back.deviceId);
            }
        } catch (e) {
            // ignore
        }
    }, [selectedDeviceId, facingMode]);

    const checkEnvironment = useCallback(async () => {
        setIsSecure(window.isSecureContext || location.hostname === 'localhost');
        try { setInIframe(window.self !== window.top); } catch { setInIframe(true); }
        setHasMediaDevices(!!navigator.mediaDevices);

        try {
            // @ts-ignore
            const camPerm = await navigator.permissions?.query({ name: 'camera' });
            if (camPerm && 'state' in camPerm) {
                setPermissionState(camPerm.state as any);
                camPerm.onchange = () => setPermissionState((camPerm.state as any) ?? 'unknown');
            } else {
                setPermissionState('unknown');
            }
        } catch {
            setPermissionState('unknown');
        }

        await refreshDevices();
    }, [refreshDevices]);

    // Initialize models: one for VIDEO mode, one for IMAGE mode (for Demo Mode uploads)
    const initFaceLandmarkers = useCallback(async () => {
        setLoading(true);
        setMessage('Loading model...');
        try {
            const tasksVision = await import('@mediapipe/tasks-vision');
            const vision = await tasksVision.FilesetResolver.forVisionTasks(CDN_WASM);
            const { FaceLandmarker } = tasksVision;

            async function createModel(modelUrl: string, runningMode: 'VIDEO' | 'IMAGE') {
                return await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: { modelAssetPath: modelUrl, delegate: 'GPU' as const },
                    runningMode,
                    numFaces: 1,
                    outputFaceBlendshapes: false,
                });
            }

            try {
                faceLandmarkerVideoRef.current = await createModel(REMOTE_MODEL, 'VIDEO');
                faceLandmarkerImageRef.current = await createModel(REMOTE_MODEL, 'IMAGE');
            } catch (e) {
                console.warn('Remote model failed, falling back to local /models path.', e);
                faceLandmarkerVideoRef.current = await createModel(LOCAL_MODEL, 'VIDEO');
                faceLandmarkerImageRef.current = await createModel(LOCAL_MODEL, 'IMAGE');
            }

            setReady(true);
            setMessage('Model ready. Select camera and click “Start Camera” or use Demo Mode.');
        } catch (e: any) {
            console.error(e);
            setMessage('Failed to load MediaPipe. Please refresh or check network.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkEnvironment();
        initFaceLandmarkers();
        return () => {
            stop();
            if (downloadUrl) URL.revokeObjectURL(downloadUrl);
        };
    }, [checkEnvironment, initFaceLandmarkers]);

    // Minimal warmup: request camera once to prompt permission (stops immediately)
    const warmupPermission = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setMessage('Camera API not available in this browser.');
            return;
        }
        try {
            const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            tmp.getTracks().forEach((t) => t.stop());
            await checkEnvironment(); // refresh permission state and labels
            setMessage('Permission granted. You can start the camera.');
        } catch (e) {
            recordError(e);
            await checkEnvironment();
        }
    };

    const buildConstraints = (): MediaStreamConstraints => {
        // Prefer explicit deviceId if selected
        if (selectedDeviceId) {
            return { video: { deviceId: { exact: selectedDeviceId } }, audio: false };
        }
        // Fallback by facingMode (works on mobile)
        return { video: { facingMode }, audio: false };
    };

    const start = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        if (!faceLandmarkerVideoRef.current) {
            setMessage('Model not ready yet.');
            return;
        }
        if (!isSecure && location.hostname !== 'localhost') {
            setMessage('This page is not secure. Use HTTPS (or localhost) to access the camera.');
            return;
        }
        if (inIframe) {
            setMessage('This page appears to be inside an embedded preview/iframe. Some browsers block camera in iframes. Open this route in a new tab/domain.');
        }
        if (!navigator.mediaDevices?.getUserMedia) {
            setMessage('Camera API not available in this browser.');
            return;
        }

        try {
            setMessage('Requesting camera...');
            const stream = await navigator.mediaDevices.getUserMedia(buildConstraints());
            streamRef.current = stream;

            const video = videoRef.current;
            video.srcObject = stream;
            video.setAttribute('playsinline', '');
            video.setAttribute('autoplay', '');
            (video as any).muted = true;

            // Wait for metadata to ensure dimensions are available (iOS Safari especially)
            await new Promise<void>((resolve) => {
                if (video.readyState >= 1) return resolve();
                const onMeta = () => { video.removeEventListener('loadedmetadata', onMeta); resolve(); };
                video.addEventListener('loadedmetadata', onMeta, { once: true });
            });

            // iOS sometimes needs an explicit play AFTER metadata
            try { await video.play(); } catch { }

            // If dimensions are still zero, poll a few times
            let tries = 0;
            while ((video.videoWidth === 0 || video.videoHeight === 0) && tries < 10) {
                await new Promise((r) => setTimeout(r, 100));
                tries++;
            }
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                setMessage('Camera started but no frames yet (0x0). Try switching device or Flip.');
            }

            // Update selectedDeviceId from actual track
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings?.();
            if (settings?.deviceId) setSelectedDeviceId(settings.deviceId);

            // Set canvas size to video frame
            const vw = video.videoWidth || 1280;
            const vh = video.videoHeight || 720;
            const dpr = window.devicePixelRatio || 1;
            const cvs = canvasRef.current;
            cvs.width = Math.round(vw * dpr);
            cvs.height = Math.round(vh * dpr);
            cvs.style.width = vw + 'px';
            cvs.style.height = vh + 'px';

            setRunning(true);
            setMessage('Camera on. Detecting...');
            loop();
        } catch (e: any) {
            console.error(e);
            recordError(e);
        }
    };

    const restartWith = async (opts: { deviceId?: string | null; facing?: 'user' | 'environment' }) => {
        if (opts.facing) setFacingMode(opts.facing);
        if (typeof opts.deviceId !== 'undefined') setSelectedDeviceId(opts.deviceId);
        stop();
        await new Promise((r) => setTimeout(r, 50));
        start();
    };

    const flipCamera = async () => {
        const next = facingMode === 'user' ? 'environment' : 'user';
        // Try to pick a device that matches the opposite label if we have labels
        const candidate = videoInputs.find((d) => new RegExp(next === 'user' ? 'front|user' : 'back|environment|rear', 'i').test(d.label));
        await restartWith({ deviceId: candidate?.deviceId ?? null, facing: next });
    };

    const stop = () => {
        setRunning(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.srcObject = null;
        }
    };

    function mid(a: any, b: any) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
    function toPx(pt: any, W: number, H: number) { return { x: pt.x * W, y: pt.y * H }; }

    // Draw rounded rectangle
    function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
    }

    function drawSunglasses(ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number, eyeDist: number) {
        const totalW = eyeDist * 2.6;
        const lensW = totalW * 0.42;
        const bridgeW = totalW * 0.16;
        const lensH = lensW * 0.55;
        const strokeW = Math.max(2, eyeDist * 0.03);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        const yOff = -lensH * 0.15;

        const leftX = -totalW / 2;
        const rightX = leftX + lensW + bridgeW;

        ctx.lineWidth = strokeW;
        ctx.strokeStyle = '#111';

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        roundRectPath(ctx, leftX, yOff, lensW, lensH, lensH * 0.25);
        ctx.fill();
        ctx.stroke();

        roundRectPath(ctx, rightX, yOff, lensW, lensH, lensH * 0.25);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#111';
        const bridgeY = yOff + lensH * 0.35;
        roundRectPath(ctx, leftX + lensW, bridgeY, bridgeW, lensH * 0.15, strokeW);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(leftX, yOff);
        ctx.lineTo(rightX + lensW, yOff);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(leftX, yOff + lensH * 0.1);
        ctx.lineTo(leftX - lensW * 0.55, yOff);
        ctx.moveTo(rightX + lensW, yOff + lensH * 0.1);
        ctx.lineTo(rightX + lensW + lensW * 0.55, yOff);
        ctx.stroke();

        const brand = 'TokyoQuest';
        ctx.fillStyle = '#ff5757';
        const fontSize = Math.max(12, lensH * 0.35);
        ctx.font = `bold ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.save();
        ctx.translate(0, yOff - strokeW * 0.5);
        ctx.fillText(brand, 0, 0);
        ctx.restore();

        ctx.restore();
    }

    // ===== CAMERA LOOP =====
    const loop = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const cvs = canvasRef.current;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const W = cvs.width;
        const H = cvs.height;

        const drawFrame = () => {
            if (!running) return;

            ctx.save();
            ctx.scale(dpr, dpr);
            ctx.drawImage(video, 0, 0, W / dpr, H / dpr);
            ctx.restore();

            try {
                const lm = faceLandmarkerVideoRef.current?.detectForVideo(video, performance.now());
                const face = lm?.faceLandmarks?.[0];
                if (face) {
                    const R_OUT = 33, R_IN = 133;
                    const L_OUT = 263, L_IN = 362;

                    const vw = video.videoWidth || W;
                    const vh = video.videoHeight || H;

                    const rightCenterN = mid(face[R_OUT], face[R_IN]);
                    const leftCenterN = mid(face[L_OUT], face[L_IN]);

                    const r = toPx(rightCenterN, vw, vh);
                    const l = toPx(leftCenterN, vw, vh);

                    const scaleX = W / vw;
                    const scaleY = H / vh;
                    const rx = r.x * scaleX;
                    const ry = r.y * scaleY;
                    const lx = l.x * scaleX;
                    const ly = l.y * scaleY;

                    const cx = (rx + lx) / 2;
                    const cy = (ry + ly) / 2;
                    const eyeDist = Math.hypot(lx - rx, ly - ry);
                    const angle = Math.atan2(ly - ry, lx - rx);

                    const s = smoothRef.current;
                    const alpha = s.initialized ? 0.18 : 1.0;
                    s.cx = s.cx + alpha * (cx - s.cx);
                    s.cy = s.cy + alpha * (cy - s.cy);
                    let dAng = angle - s.angle;
                    while (dAng > Math.PI) dAng -= 2 * Math.PI;
                    while (dAng < -Math.PI) dAng += 2 * Math.PI;
                    s.angle = s.angle + alpha * dAng;
                    s.eyeDist = s.eyeDist + alpha * (eyeDist - s.eyeDist);
                    s.initialized = true;

                    drawSunglasses(ctx, s.cx, s.cy, s.angle, s.eyeDist);
                }
            } catch (e) { }

            rafRef.current = requestAnimationFrame(drawFrame);
        };

        rafRef.current = requestAnimationFrame(drawFrame);
    };

    // ===== DEMO MODE (PHOTO UPLOAD) =====
    const onPhotoUpload: React.ChangeEventHandler<HTMLInputElement> = async (ev) => {
        const file = ev.target.files?.[0];
        if (!file || !canvasRef.current || !faceLandmarkerImageRef.current) return;

        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const dpr = window.devicePixelRatio || 1;
            const cvs = canvasRef.current!;
            const ctx = cvs.getContext('2d');
            if (!ctx) return;

            const maxW = 1280;
            const scale = Math.min(1, maxW / img.naturalWidth);
            const W = Math.round(img.naturalWidth * scale * dpr);
            const H = Math.round(img.naturalHeight * scale * dpr);
            cvs.width = W;
            cvs.height = H;
            cvs.style.width = Math.round(W / dpr) + 'px';
            cvs.style.height = Math.round(H / dpr) + 'px';

            ctx.save();
            ctx.scale(dpr, dpr);
            ctx.drawImage(img, 0, 0, W / dpr, H / dpr);
            ctx.restore();

            try {
                const res = faceLandmarkerImageRef.current.detect(img);
                const face = res?.faceLandmarks?.[0];
                if (face) {
                    const rightCenterN = mid(face[33], face[133]);
                    const leftCenterN = mid(face[263], face[362]);
                    const rx = rightCenterN.x * (W / dpr);
                    const ry = rightCenterN.y * (H / dpr);
                    const lx = leftCenterN.x * (W / dpr);
                    const ly = leftCenterN.y * (H / dpr);
                    const cx = (rx + lx) / 2;
                    const cy = (ry + ly) / 2;
                    const eyeDist = Math.hypot(lx - rx, ly - ry);
                    const angle = Math.atan2(ly - ry, lx - rx);

                    const ctx2 = cvs.getContext('2d');
                    if (!ctx2) return;
                    drawSunglasses(ctx2, cx * dpr, cy * dpr, angle, eyeDist * dpr);
                    setMessage('Overlay applied (Demo Mode).');
                } else {
                    setMessage('No face detected in the photo. Try another image.');
                }
            } catch (e) {
                recordError(e);
            } finally {
                URL.revokeObjectURL(url);
            }
        };
        img.onerror = () => {
            setMessage('Failed to load the selected image.');
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    const capture = () => {
        if (!canvasRef.current) return;
        canvasRef.current.toBlob((blob) => {
            if (!blob) return;
            if (downloadUrl) URL.revokeObjectURL(downloadUrl);
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);
        }, 'image/jpeg', 0.92);
    };

    // ===== Self Tests =====
    const runSelfTests = () => {
        const list: { name: string; pass: boolean; details?: string }[] = [];

        try {
            const text = explainCameraSettings();
            const lines = text.split('');
            list.push({ name: 'explainCameraSettings returns string', pass: typeof text === 'string' });
            list.push({ name: 'explainCameraSettings has >= 5 lines', pass: lines.length >= 5, details: `lines=${lines.length}` });
            list.push({ name: 'explainCameraSettings contains Chrome & HTTPS hints', pass: /Chrome/.test(text) && /HTTPS|localhost/.test(text) });
        } catch (e: any) {
            list.push({ name: 'explainCameraSettings executable', pass: false, details: e?.message });
        }

        list.push({ name: 'Secure context flag is boolean', pass: typeof isSecure === 'boolean' });
        list.push({ name: 'mediaDevices availability is boolean', pass: typeof hasMediaDevices === 'boolean' });

        setTests(list);
    };

    return (
        <div className="min-h-[100dvh] w-full flex flex-col items-center justify-start gap-4 p-4 bg-neutral-950 text-neutral-100">
            <h1 className="text-2xl font-bold">TokyoQuest AR Sunglasses</h1>
            <p className="opacity-80 text-sm text-center max-w-prose">{message || 'Ready.'}</p>

            {/* Diagnostics / Test Cases */}
            <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-white/10 p-3">
                    <div className="font-semibold mb-1">Environment Checks</div>
                    <ul className="space-y-1">
                        <li>• Secure context (HTTPS or localhost): <b className={isSecure ? 'text-green-400' : 'text-red-400'}>{String(isSecure)}</b></li>
                        <li>• Embedded preview / iframe: <b className={!inIframe ? 'text-green-400' : 'text-yellow-300'}>{String(inIframe)}</b></li>
                        <li>• mediaDevices available: <b className={hasMediaDevices ? 'text-green-400' : 'text-red-400'}>{String(hasMediaDevices)}</b></li>
                        <li>• Permission state: <b className={permissionState === 'granted' ? 'text-green-400' : permissionState === 'denied' ? 'text-red-400' : 'text-yellow-300'}>{permissionState}</b></li>
                        <li>• Video input present: <b className={hasVideoInput ? 'text-green-400' : hasVideoInput === false ? 'text-red-400' : 'text-yellow-300'}>{hasVideoInput === null ? 'unknown' : String(hasVideoInput)}</b></li>
                    </ul>
                    <div className="mt-2 flex gap-2 flex-wrap">
                        <button onClick={checkEnvironment} className="px-3 py-1.5 rounded bg-neutral-800">Run Diagnostics</button>
                        <button onClick={warmupPermission} className="px-3 py-1.5 rounded bg-white text-black">Request Permission Only</button>
                        <button onClick={runSelfTests} className="px-3 py-1.5 rounded bg-[#ff5757] text-white">Run Self Tests</button>
                    </div>
                    {lastError && (
                        <div className="mt-2 text-red-400 whitespace-pre-wrap">{lastError}</div>
                    )}
                    {inIframe && (
                        <div className="mt-2 text-yellow-300">
                            This looks like an embedded preview. Some browsers block camera in iframes. Open this route directly on your domain or localhost.
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-white/10 p-3">
                    <div className="font-semibold mb-1">Tips</div>
                    <p className="opacity-80">
                        If you see <b>NotAllowedError: Permission denied</b>, allow camera access for this site and reload. On iOS Safari, you must tap a button (user gesture) to start the camera.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <a href="chrome://settings/content/camera" className="underline text-[#ff5757]" target="_blank">Open Chrome Camera Settings</a>
                        <a href="about:preferences#privacy" className="underline text-[#ff5757]" target="_blank">Open Firefox Privacy Settings</a>
                    </div>
                    {tests.length > 0 && (
                        <div className="mt-3">
                            <div className="font-semibold">Self Tests</div>
                            <ul className="mt-1 space-y-1">
                                {tests.map((t, i) => (
                                    <li key={i} className={t.pass ? 'text-green-400' : 'text-red-400'}>
                                        {t.pass ? '✓' : '✗'} {t.name}{t.details ? ` — ${t.details}` : ''}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Camera chooser */}
            <div className="w-full max-w-3xl -mt-2 mb-1 text-xs flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <label className="opacity-70">Facing:</label>
                    <select
                        value={facingMode}
                        onChange={(e) => restartWith({ deviceId: null, facing: e.target.value as 'user' | 'environment' })}
                        className="bg-neutral-900 border border-white/10 rounded px-2 py-1"
                    >
                        <option value="user">Front (selfie)</option>
                        <option value="environment">Back (world)</option>
                    </select>
                    <button onClick={flipCamera} className="px-2 py-1 rounded bg-neutral-800">Flip</button>
                </div>
                <div className="flex items-center gap-2">
                    <label className="opacity-70">Device:</label>
                    <select
                        value={selectedDeviceId ?? ''}
                        onChange={(e) => restartWith({ deviceId: e.target.value || null, facing: facingMode })}
                        className="bg-neutral-900 border border-white/10 rounded px-2 py-1 min-w-[260px]"
                    >
                        <option value="">Auto ({facingMode})</option>
                        {videoInputs.map((d) => (
                            <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 6)}...`}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex flex-col items-center gap-3">
                <div className="relative rounded-2xl overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
                    <video ref={videoRef} className="hidden" playsInline muted />
                    <canvas ref={canvasRef} className="rounded-2xl bg-black" />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        disabled={loading || running || !ready}
                        onClick={start}
                        className="px-4 py-2 rounded-xl bg-white text-black font-medium disabled:opacity-40"
                    >
                        Start Camera
                    </button>
                    <button
                        disabled={!running}
                        onClick={capture}
                        className="px-4 py-2 rounded-xl bg-[#ff5757] text-white font-medium disabled:opacity-40"
                    >
                        Capture Photo
                    </button>
                    <button
                        disabled={!running}
                        onClick={stop}
                        className="px-4 py-2 rounded-xl bg-neutral-800 text-white font-medium disabled:opacity-40"
                    >
                        Stop
                    </button>
                </div>

                {/* Demo Mode (no camera) */}
                <div className="w-full max-w-3xl mt-4 rounded-xl border border-white/10 p-3 text-xs">
                    <div className="font-semibold mb-2">Demo Mode (No Camera)</div>
                    <p className="opacity-80 mb-2">Upload a selfie photo to test the overlay when camera access is blocked (e.g., in embedded previews).</p>
                    <input type="file" accept="image/*" onChange={onPhotoUpload} className="block text-sm" />
                    <div className="mt-2 opacity-70">After upload, click <b>Capture Photo</b> to download the composited image.</div>
                </div>

                {downloadUrl && (
                    <div className="flex items-center gap-3">
                        <a
                            href={downloadUrl}
                            download={`tokyoquest_ar_${Date.now()}.jpg`}
                            className="underline text-[#ff5757]"
                        >
                            Download Photo
                        </a>
                        <span className="text-xs opacity-70">Saved locally. You can also POST the blob to your API.</span>
                    </div>
                )}
            </div>

            <div className="mt-6 w-full max-w-prose text-xs opacity-70 leading-relaxed">
                <p>
                    Tips: On iOS Safari, camera starts only after a user gesture. If the model fails to load from the public bucket,
                    download <code>face_landmarker.task</code> from MediaPipe and place it at <code>public/models/face_landmarker.task</code>.
                </p>
            </div>
        </div>
    );
}
