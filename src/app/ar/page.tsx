"use client";

import { useEffect, useRef, useState } from "react";

/**
 * TokyoQuest AR Camera — Multi‑Face Stable Loader (improved association)
 * - Supports multiple faces with robust association & replacement policy
 * - Hysteresis + grace + smoothing to avoid flicker
 * - Uses CDN ESM with webpackIgnore to avoid Turbopack HMR issues
 * - Dummy overlay image for now
 */

// ----- Config --------------------------------------------------------------
const VISION_CDN_VERSION = "0.10.14";
const VISION_WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_CDN_VERSION}/wasm`;
const VISION_BUNDLE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_CDN_VERSION}/vision_bundle.mjs`;
const MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const RIGHT_EYE_OUTER = 33;
const LEFT_EYE_OUTER = 263;

// Multi‑face support
const MAX_FACES = 5;             // how many faces to track simultaneously
const ASSIGN_DIST_BASE = 0.12;   // dynamic threshold as % of min(width,height)
const MIN_SPRITE_PX = 40;        // skip very small faces (reduces false positives) – lower so遠めの顔も拾える

// Smoothing & stability
const SMOOTH_ALPHA_POS = 0.18;   // position smoothing
const SMOOTH_ALPHA_SIZE = 0.18;  // scale smoothing
const SMOOTH_ALPHA_ANGLE = 0.2;  // angle smoothing
const TARGET_DETECT_FPS = 24;    // throttle detection a bit for stability
const COAST_MS = 350;            // keep drawing last pose this long without detections
const SHOW_HITS = 1;             // show after N hits (snappier UX)
const HIDE_MISSES = 8;           // hide after N misses (stickier)

export default function ARCamera() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const overlayRef = useRef<HTMLCanvasElement | null>(null);
    const captureRef = useRef<HTMLCanvasElement | null>(null);

    const faceLandmarkerRef = useRef<any>(null);
    const lastDetTimestampRef = useRef<number>(0);
    const rafRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [ready, setReady] = useState(false);
    const [photoData, setPhotoData] = useState<string | null>(null);
    const [errMsg, setErrMsg] = useState<string | null>(null);

    const spriteImgRef = useRef<HTMLImageElement | null>(null);

    // --- Multi‑face trackers --------------------------------------------------
    type Pose = { id: number; cx: number; cy: number; angle: number; width: number; height: number; visible: boolean; lastSeen: number; hits: number; misses: number; };
    const trackersRef = useRef<Pose[]>([]);
    const nextIdRef = useRef(1);

    // Load a dummy overlay image
    useEffect(() => {
        const img = new Image();
        img.src = "https://dummyimage.com/600x125/000/fff.png&text=TokyoQuest";
        img.crossOrigin = "anonymous";
        img.onload = () => (spriteImgRef.current = img);
        img.onerror = () => setErrMsg("Failed to load dummy overlay image");
    }, []);

    useEffect(() => {
        let stopped = false;

        const init = async () => {
            try {
                // 1) Start camera (HTTPS/localhost required)
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
                await videoRef.current.play();

                // 2) Load MediaPipe via CDN with native import() (bypass bundler)
                const vision: any = await loadVisionBundle();
                const { FilesetResolver, FaceLandmarker } = vision;

                // 3) Init Landmarker (multi‑face)
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

            // --- Build detections from face landmarks ---------------------------
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
                if (desiredWidth < MIN_SPRITE_PX) continue; // skip too small
                const cx = (lx + rx) / 2;
                const cy = (ly + ry) / 2 + eyeDist * 0.15;
                dets.push({ cx, cy, angle, width: desiredWidth, height: desiredHeight });
            }
            // Prioritize larger faces for assignment stability
            dets.sort((a, b) => b.width - a.width);

            // --- Associate detections to existing trackers (greedy nearest) -----
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

            // --- Spawn or replace trackers for unmatched detections -------------
            for (let i = 0; i < dets.length; i++) {
                if (usedDet.has(i)) continue;
                const d = dets[i];
                if (trackers.length < MAX_FACES) {
                    trackers.push({ id: nextIdRef.current++, cx: d.cx, cy: d.cy, angle: d.angle, width: d.width, height: d.height, visible: false, lastSeen: now, hits: 1, misses: 0 });
                } else {
                    // Replace the stalest non-visible tracker
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

            // --- Cull long-gone trackers ---------------------------------------
            for (let i = trackers.length - 1; i >= 0; i--) {
                if (!trackers[i].visible && now - trackers[i].lastSeen > COAST_MS * 4) trackers.splice(i, 1);
            }

            // --- Draw all visible (or within grace) trackers --------------------
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
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            try { faceLandmarkerRef.current?.close?.(); } catch { }
            if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
        };
    }, []);

    const onCapture = () => {
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

        setPhotoData(cap.toDataURL("image/png"));
    };

    return (
        <div className="font-sans bg-gray-50 min-h-screen flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-lg w-[92%] max-w-[460px] p-5">
                <h1 className="my-2 text-xl font-bold text-gray-700 text-center">TokyoQuest AR Camera</h1>
                <div className="relative w-full pt-[100%] bg-black rounded-2xl overflow-hidden">
                    <video
                        ref={videoRef}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full object-cover"
                        autoPlay
                        playsInline
                        muted
                    />
                    <canvas
                        ref={overlayRef}
                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    />
                </div>
                <div className="flex justify-center mt-4">
                    <button
                        onClick={onCapture}
                        className="bg-orange-400 border-4 border-white w-18 h-18 rounded-full cursor-pointer shadow-lg shadow-orange-400/40"
                        aria-label="Capture"
                    />
                </div>
                {photoData && (
                    <div className="mt-4 text-center">
                        <img
                            src={photoData}
                            alt="Captured with AR"
                            className="max-w-full rounded-xl shadow-lg"
                        />
                    </div>
                )}
                {!ready && <p className="text-center text-gray-600 mt-2">Initializing camera & model…</p>}
                {errMsg && <p className="text-center text-red-600 mt-2">⚠️ {errMsg}</p>}
            </div>
        </div>
    );
}

// ---- Loader that survives HMR --------------------------------------------
async function loadVisionBundle(): Promise<any> {
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


