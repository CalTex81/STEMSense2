import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Camera,
  RotateCcw,
  Play,
  Loader2,
  ArrowLeft,
  Beaker,
  Trash2,
  Plus,
  Globe,
  Download,
  Clock,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Github,
} from "lucide-react";
import { StemSenseLogo, beltItems } from "./components/ScienceIcons";

// Types
interface BoundingBox {
  label: string;
  conf: number;
  bbox: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

interface Experiment {
  name: string;
  learningGoal: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedTimeMinutes: number;
  materials: string[];
  safetyNotes: string[];
  steps: string[];
}

interface ExperimentPlan {
  title: string;
  experiments: Experiment[];
}

export default function App() {
  const [view, setView] = useState<"home" | "scan" | "results">("home");
  
  // Camera & Scanning states
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [detectorStatus, setDetectorStatus] = useState<string>("Disconnected");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanCountdown, setScanCountdown] = useState<number>(10);
  const [detectedItems, setDetectedItems] = useState<string[]>([]);
  const [boxes, setBoxes] = useState<BoundingBox[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);

  // Configuration Modal state
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [provider, setProvider] = useState<"gemini" | "deepseek">("gemini");
  const [apiKey, setApiKey] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>(
    "You are an elite, creative STEM tutor designed to help users learn by building physical experiments using only items around them. Propose fun, hands-on, educational activities with simple but detailed procedures."
  );
  const [audience, setAudience] = useState<"kids" | "teens" | "adults">("teens");
  const [timeLimit, setTimeLimit] = useState<string>("30");
  const [extraMaterials, setExtraMaterials] = useState<string>("");
  const [learningFocus, setLearningFocus] = useState<string>("");
  const [newItemName, setNewItemName] = useState<string>("");

  // Plan generation states
  const [loadingResults, setLoadingResults] = useState<boolean>(false);
  const [experimentPlan, setExperimentPlan] = useState<ExperimentPlan | null>(null);
  const [rawPlanText, setRawPlanText] = useState<string>("");
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // HTML elements refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const triggerTimeoutRef = useRef<any>(null);
  const detectIntervalRef = useRef<any>(null);

  // Doubled belt array for infinite clean scroll loop
  const doubleBeltItems = useMemo(() => {
    return [...beltItems, ...beltItems];
  }, []);

  // Check for device list & camera permissions on mount
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoIn = devices.filter(d => d.kind === "videoinput");
      setVideoDevices(videoIn);
      if (videoIn.length > 0) {
        setSelectedDevice(videoIn[0].deviceId);
      }
    }).catch(err => {
      console.warn("Failed to list camera devices", err);
    });
  }, []);

  // Stop camera stream whenever view changes or on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [view]);

  // Activate camera stream for Scan view
  const startCamera = async (deviceId?: string) => {
    try {
      stopCamera();
      setDetectorStatus("Connecting Camera...");
      
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } } 
          : { facingMode: "environment" }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setDetectorStatus("Camera Connected & Waiting");
        };
      }
      setHasCameraPermission(true);
    } catch (err: any) {
      console.error("Camera Access Error:", err);
      setHasCameraPermission(false);
      setDetectorStatus("Camera Disconnected (Error)");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setDetectorStatus("Disconnected");
    setBoxes([]);
  };

  // Start the 10-second high stakes scan sequence!
  const beginScanHandler = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanCountdown(10);
    setDetectedItems([]);
    setBoxes([]);
    setDetectorStatus("Scanning & Detecting Objects...");

    // Fire detection snaps immediately
    takeSnapshotAndDetect();

    // Setup periodic snapshot scanner every 2.5 seconds to query server model
    detectIntervalRef.current = setInterval(() => {
      takeSnapshotAndDetect();
    }, 2500);

    // Setup ticking clock countdown
    let startTime = Date.now();
    triggerTimeoutRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / 10000) * 100);
      const secondsLeft = Math.max(0, 10 - Math.floor(elapsed / 1000));

      setScanProgress(progress);
      setScanCountdown(secondsLeft);

      if (progress >= 100) {
        clearInterval(triggerTimeoutRef.current);
        clearInterval(detectIntervalRef.current);
        setIsScanning(false);
        setDetectorStatus("Scan Complete!");
        stopCamera();
        setShowReviewModal(true);
      }
    }, 100);
  };

  // Convert active web camera frame to jpeg and ask Gemini backend to extract item bounding boxes
  const takeSnapshotAndDetect = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    try {
      const W = video.videoWidth || 640;
      const H = video.videoHeight || 480;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw active viewfinder to offscreen canvas
      ctx.drawImage(video, 0, 0, W, H);

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append("file", blob, "canvas_frame.jpg");

        try {
          const response = await fetch("/detect", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            console.warn("Detection response was not successful", response.status);
            return;
          }

          const resData = await response.json();
          if (resData && resData.detections) {
            setBoxes(resData.detections);
            
            // Push detections inside state items
            resData.detections.forEach((item: BoundingBox) => {
              if (item.label && item.conf > 0.35) {
                const formatted = item.label.trim().replace(/^\w/, (c) => c.toUpperCase());
                setDetectedItems((prev) => {
                  if (prev.includes(formatted)) return prev;
                  return [...prev, formatted];
                });
              }
            });
          }
        } catch (postErr) {
          console.error("Detect POST call error:", postErr);
        }
      }, "image/jpeg", 0.7);

    } catch (snapErr) {
      console.error("Snapshot extraction error:", snapErr);
    }
  };

  // Manual items management
  const addCustomItem = () => {
    if (!newItemName.trim()) return;
    const formatted = newItemName.trim().replace(/^\w/, (c) => c.toUpperCase());
    if (!detectedItems.includes(formatted)) {
      setDetectedItems([...detectedItems, formatted]);
    }
    setNewItemName("");
  };

  const deleteItem = (idx: number) => {
    setDetectedItems(detectedItems.filter((_, i) => i !== idx));
  };

  // Trigger Backend Analysis for experiment plans
  const handleGenerateExperiments = async () => {
    setShowReviewModal(false);
    setView("results");
    setLoadingResults(true);
    setExperimentPlan(null);
    setError(null);

    const payload = {
      provider,
      customPrompt,
      apiKey: provider === "deepseek" ? apiKey : undefined,
      items: detectedItems,
      userData: {
        audience,
        timeLimitMinutes: parseInt(timeLimit) || 30,
        materialsAvailable: extraMaterials,
        learningFocus,
      },
    };

    try {
      const response = await fetch("/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || `Generation failed with code ${response.status}`);
      }

      const resData = await response.json();
      if (resData.experimentPlan) {
        setExperimentPlan(resData.experimentPlan);
        setRawPlanText(JSON.stringify(resData.experimentPlan, null, 2));
      } else {
        throw new Error("Empty plan was returned. Please try again.");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "An unexpected network error occurred while compiling experiments.");
    } finally {
      setLoadingResults(false);
    }
  };

  // Manual fallback download of Raw JSON
  const handleDownloadJson = () => {
    if (!experimentPlan) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(experimentPlan, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `stem_experiments_${Date.now()}.json`);
    dlAnchorElem.click();
  };

  return (
    <div id="root" className="min-h-screen bg-bg-primary text-white flex flex-col selection:bg-accent-teal selection:text-white">
      {/* Offscreen canvas used to take video snapshots */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── HEADER ── */}
      <header className="flex justify-between items-center px-6 py-4 md:px-12 border-b border-border-dark bg-bg-primary z-10 sticky top-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView("home")}>
          <StemSenseLogo />
          <span className="font-space font-bold text-xl tracking-tight hidden sm:inline text-white">
            STEM<span className="text-accent-teal font-medium">Sense</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {view !== "home" && (
            <button
              onClick={() => {
                setView("home");
                stopCamera();
              }}
              className="text-xs tracking-wider uppercase font-space text-text-dim border border-border-dark px-3.5 py-1.5 rounded-full hover:bg-[#0d1620] hover:text-white transition duration-200"
            >
              <i className="fa-solid fa-home mr-1.5"></i> Home
            </button>
          )}

          {view === "results" && (
            <button
              onClick={() => {
                setView("scan");
                setTimeout(() => startCamera(selectedDevice), 100);
              }}
              className="text-xs bg-accent-teal border border-accent-teal hover:bg-accent-hover tracking-wider uppercase font-space text-white px-4 py-1.5 rounded-full transition duration-200"
            >
              <i className="fa-solid fa-camera mr-1.5"></i> Scan Grid
            </button>
          )}
        </div>
      </header>

      {/* ── DYNAMIC SCREEN ROUTER ── */}
      <main className="flex-1 flex flex-col">
        {/* VIEW 1: HOME LANDING SCREEN */}
        {view === "home" && (
          <div className="flex-1 flex flex-col justify-center items-center py-10 px-4 md:px-8 text-center relative overflow-hidden max-w-5xl mx-auto w-full">
            <div className="animate-fade-in">
              <h1 className="font-space font-bold text-5xl md:text-7xl leading-tight tracking-tight mb-4 max-w-4xl uppercase select-none">
                FIND THE STEM BEHIND EVERY ITEM
              </h1>
              <p className="text-sm md:text-lg text-text-dim max-w-2xl mx-auto mb-10 leading-relaxed">
                Scan physical objects present in your house, classroom, or outdoors. STEMSense uses multimodal AI to instantly reveal their potential and auto-generate hands-on science experiments!
              </p>
            </div>

            {/* Infinite Horizontal Rolling Science Belt */}
            <div className="w-full max-w-4xl mx-auto py-8 mb-10 select-none">
              <div className="belt-wrapper">
                <div className="belt-track">
                  {doubleBeltItems.map((item, idx) => {
                    const Comp = item.Comp;
                    return (
                      <div key={`${item.id}-${idx}`} className="belt-item px-3" title={item.id}>
                        <div className="belt-svg-wrap text-accent-teal hover:text-white transition-colors duration-300">
                          <Comp />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SCAN ACTION CTA BUTTON */}
            <div className="mb-12 flex justify-center">
              <button
                onClick={() => {
                  setView("scan");
                  setTimeout(() => startCamera(), 150);
                }}
                className="group relative px-8 py-4 bg-accent-teal text-white font-space font-bold text-sm uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(44,139,139,0.3)] hover:shadow-[0_0_30px_rgba(44,139,139,0.5)] bg-gradient-to-r from-accent-teal to-[#1c5d5d] hover:from-[#329a9a] hover:to-[#217373] active:scale-[0.98] transition-all duration-300 flex items-center gap-3 border border-accent-teal/40 cursor-pointer overflow-hidden select-none"
              >
                <Camera className="w-5 h-5 group-hover:scale-110 transition-transform duration-300 text-cyan-300" />
                <span>Launch Live Scanner</span>
              </button>
            </div>

            {/* Quick Informational Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left max-w-4xl border-t border-border-dark pt-10">
              <div className="p-5 rounded-2xl bg-bg-surface border border-border-dark hover:border-accent-teal/30 transition duration-300">
                <div className="w-9 h-9 rounded-full bg-accent-teal/10 border border-accent-teal/30 flex items-center justify-center text-accent-teal mb-4">
                  <Camera className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-space font-semibold text-sm uppercase tracking-wider text-white mb-2">1. Real-Time Scan</h4>
                <p className="text-xs text-text-dim leading-relaxed">Point your hardware camera at pencils, plants, tools or mugs and watch active AI bounding boxes identify physical item constraints instantly.</p>
              </div>

              <div className="p-5 rounded-2xl bg-bg-surface border border-border-dark hover:border-accent-teal/30 transition duration-300">
                <div className="w-9 h-9 rounded-full bg-accent-teal/10 border border-accent-teal/30 flex items-center justify-center text-accent-teal mb-4">
                  <Sliders className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-space font-semibold text-sm uppercase tracking-wider text-white mb-2">2. Refine Variables</h4>
                <p className="text-xs text-text-dim leading-relaxed">Edit detected lists, inject auxiliary materials, choose audience difficulty targets, and configure AI prompt preferences freely.</p>
              </div>

              <div className="p-5 rounded-2xl bg-bg-surface border border-border-dark hover:border-accent-teal/30 transition duration-300">
                <div className="w-9 h-9 rounded-full bg-accent-teal/10 border border-accent-teal/30 flex items-center justify-center text-accent-teal mb-4">
                  <Beaker className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-space font-semibold text-sm uppercase tracking-wider text-white mb-2">3. Run Experiments</h4>
                <p className="text-xs text-text-dim leading-relaxed">Enjoy detailed instructional guides containing step-by-step procedures, learning objectives, estimated speeds and complete security safety notes.</p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: HARDWARE CAMERA VIEWPORT SCREEN */}
        {view === "scan" && (
          <div className="flex-1 flex flex-col md:flex-row items-stretch border-t border-border-dark">
            {/* Viewfinder panel */}
            <div className="flex-1 bg-black flex flex-col justify-center items-center p-4 relative min-h-[400px] md:min-h-0">
              
              {detectorStatus && !isScanning && (
                <div className="absolute top-4 left-4 z-20 bg-bg-primary/90 border border-border-dark px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs">
                  <span className={`w-2.5 h-2.5 rounded-full inline-block ${hasCameraPermission ? "bg-green-500 status-dot-live" : "bg-red-500"}`} />
                  <span className="text-text-dim font-mono">{detectorStatus}</span>
                </div>
              )}

              {/* Viewfinder frame */}
              <div className="relative aspect-video w-full max-w-3xl rounded-2xl border-2 border-border-dark bg-[#03060a] overflow-hidden shadow-2xl flex items-center justify-center">
                {hasCameraPermission === null && (
                  <div className="text-center p-6 text-text-dim">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent-teal mb-3" />
                    <p className="text-sm">Initiating connection to camera sensor...</p>
                  </div>
                )}

                {hasCameraPermission === false && (
                  <div className="text-center p-8 max-w-sm">
                    <AlertTriangle className="w-10 h-10 mx-auto text-yellow-500 mb-4" />
                    <h3 className="font-space font-bold uppercase tracking-wider text-white mb-2">Camera Access Blocked</h3>
                    <p className="text-xs text-text-dim mb-4 leading-relaxed">
                      STEMSense requires hardware camera feeds. Please allow browser camera permissions, plug-in a camera, or select a device below to scan physical STEM items.
                    </p>
                    <button
                      onClick={() => startCamera(selectedDevice)}
                      className="px-5 py-2.5 bg-accent-teal border border-accent-teal hover:bg-accent-hover text-xs uppercase tracking-wider font-space text-white rounded-lg transition duration-200"
                    >
                      Retry Connection
                    </button>
                  </div>
                )}

                {hasCameraPermission === true && (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Sweep Line Animation during scanning */}
                    {isScanning && <div className="scan-line" />}

                    {/* Draw Absolute Bounding Box Div overlays generated by local state */}
                    {boxes.map((box, bIdx) => {
                      const { x, y, w, h } = box.bbox;
                      return (
                        <div
                          key={bIdx}
                          className="absolute border-2 border-accent-teal rounded bg-accent-teal/5 flex flex-col justify-start pt-1 pl-1 text-[10px] select-none text-white font-mono shadow-md"
                          style={{
                            left: `${x * 100}%`,
                            top: `${y * 100}%`,
                            width: `${w * 100}%`,
                            height: `${h * 100}%`,
                          }}
                        >
                          <span className="bg-accent-teal/80 text-white font-bold px-1 py-0.5 rounded-sm self-start max-w-full truncate">
                            {box.label} ({Math.round(box.conf * 100)}%)
                          </span>
                        </div>
                      );
                    })}

                    {/* Countdown Overlay banner */}
                    {isScanning && (
                      <div className="absolute top-4 right-4 bg-red-600/90 border border-red-500 backdrop-blur px-4 py-2 rounded-xl flex items-center gap-2 select-none shadow-lg">
                        <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                        <span className="font-space text-sm font-bold text-white uppercase tracking-wider">
                          LIVE CAPTURING: {scanCountdown}s
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Device Selector drop-down (if multiple video inputs exist) */}
              {videoDevices.length > 1 && (
                <div className="mt-4 flex items-center gap-2 select-none z-10 bg-bg-surface/80 border border-border-dark px-3 py-1.5 rounded-xl">
                  <span className="text-xs text-text-dim text-mono uppercase tracking-widest mr-1">Camera:</span>
                  <select
                    value={selectedDevice}
                    onChange={(e) => {
                      setSelectedDevice(e.target.value);
                      startCamera(e.target.value);
                    }}
                    className="bg-black text-xs text-white border border-border-dark rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-accent-teal"
                  >
                    {videoDevices.map((device, devIdx) => (
                      <option key={device.deviceId || devIdx} value={device.deviceId}>
                        {device.label || `Camera ${devIdx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Controlling & Item list panel */}
            <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-border-dark bg-bg-surface p-6 flex flex-col">
              <div className="mb-6 select-none flex items-center justify-between">
                <div>
                  <h3 className="font-space font-bold text-lg uppercase tracking-tight text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-accent-teal rounded-full animate-pulse" />
                    Target Scanner
                  </h3>
                  <p className="text-xs text-text-dim mt-1 text-left">Initiate a 10s capturing session to record elements.</p>
                </div>
                
                {detectedItems.length > 0 && (
                  <button
                    onClick={() => {
                      setDetectedItems([]);
                      setBoxes([]);
                    }}
                    className="text-[10px] uppercase font-semibold text-red-400 border border-red-900/30 bg-red-500/10 px-2.5 py-1 rounded-sm hover:bg-red-500/20"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Big central scanning action trigger */}
              <div className="mb-8 select-none">
                {isScanning ? (
                  <div className="bg-bg-primary/50 border border-border-dark rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
                    <div className="absolute left-0 bottom-0 top-0 bg-accent-teal/10 transition-all duration-100 ease-out" style={{ width: `${scanProgress}%` }} />
                    <p className="font-space font-bold text-3xl text-accent-teal animate-pulse mb-2">{Math.floor(scanProgress)}%</p>
                    <p className="text-xs text-text-dim uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-teal" /> Do not close your camera
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={beginScanHandler}
                    disabled={hasCameraPermission === false || hasCameraPermission === null}
                    className="w-full group py-5.5 rounded-2xl bg-gradient-to-r from-accent-teal/20 via-accent-teal/5 to-bg-primary border-2 border-accent-teal hover:border-accent-hover text-white flex flex-col justify-center items-center gap-1 text-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:border-border-dark transition-all duration-300"
                  >
                    <Play className="w-8 h-8 text-accent-teal group-hover:scale-110 group-hover:text-accent-hover transition-transform duration-300 mb-1 animate-pulse" />
                    <span className="font-space font-bold uppercase tracking-wider text-xs">Start 10s STEM SCAN</span>
                    <span className="text-[10px] text-text-dim px-4">Move camera over surrounding items to queue detector</span>
                  </button>
                )}
              </div>

              {/* Detected Items list tracker */}
              <div className="flex-1 flex flex-col min-h-[180px] select-none">
                <span className="text-xs font-mono text-text-dim uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Detected Elements:</span>
                  <span className="bg-[#16222f] px-2 py-0.5 rounded text-white font-semibold text-[10px]">{detectedItems.length} found</span>
                </span>

                <div className="flex-1 bg-bg-primary/40 border border-border-dark rounded-xl p-3.5 overflow-y-auto max-h-[220px] md:max-h-[340px] text-left">
                  {detectedItems.length === 0 ? (
                    <div className="h-full flex flex-col justify-center items-center text-center p-4">
                      <Beaker className="w-7 h-7 text-border-dark mb-2" />
                      <p className="text-xs text-text-dim leading-relaxed">No items detected yet. Push "Start 10s STEM Scan" or write custom physical elements below to populate constraints.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {detectedItems.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 text-xs bg-[#121c27] text-white pl-2.5 pr-1.5 py-1 rounded-full border border-border-dark"
                        >
                          {item}
                          <button
                            onClick={() => deleteItem(idx)}
                            className="w-4 h-4 rounded-full bg-red-950/40 hover:bg-red-900 text-red-400 flex items-center justify-center text-[9px] font-semibold cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input block to manually inject auxiliary factors */}
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add manual item (e.g. Ruler)"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addCustomItem();
                    }}
                    className="flex-1 text-xs bg-bg-primary border border-border-dark rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-teal placeholder:text-text-dim/60"
                  />
                  <button
                    onClick={addCustomItem}
                    className="px-3 bg-[#121c27] border border-border-dark hover:bg-accent-teal/20 text-accent-teal rounded-lg transition duration-200 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Review Modal Trigger */}
              <button
                onClick={() => setShowReviewModal(true)}
                disabled={detectedItems.length === 0}
                className="mt-6 w-full py-3 bg-accent-teal hover:bg-accent-hover text-white text-xs uppercase tracking-widest font-space font-semibold rounded-xl transition duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                Proceed to Variables Options <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: EXPERIMENT GENERATION / RESULTS DETAIL PANEL */}
        {view === "results" && (
          <div className="flex-1 flex flex-col items-center bg-bg-primary relative px-4 py-8 md:p-12">
            
            {/* Generating progress state loading card */}
            {loadingResults && (
              <div className="my-auto text-center p-8 max-w-md bg-bg-surface border border-border-dark rounded-3xl shadow-2xl relative overflow-hidden select-none animate-pulse">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-teal via-white to-accent-teal animate-pulse" />
                <Loader2 className="w-12 h-12 animate-spin text-accent-teal mx-auto mb-4" />
                <h3 className="font-space font-bold uppercase tracking-wider text-white text-lg mb-2">Analyzing STEM Potential</h3>
                <p className="text-xs text-text-dim mb-4 leading-relaxed">
                  Synthesizing experiments, safety steps, educational guides, and custom constraints using <span className="text-accent-teal font-semibold">{provider === "gemini" ? "Gemini 3.5" : "DeepSeek Code"}</span>. This might take up to 8 seconds...
                </p>
                <div className="inline-flex px-3.5 py-1.5 rounded-full border border-border-dark bg-[#03060a] text-[10px] text-text-dim font-mono gap-2">
                  <i className="fa-solid fa-flask text-accent-teal animate-bounce" /> Focus: {learningFocus || "General STEM"}
                </div>
              </div>
            )}

            {/* Error fallback card */}
            {error && (
              <div className="my-auto text-center p-8 max-w-sm bg-bg-surface border border-red-950 rounded-3xl shadow-2xl select-none">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
                <h3 className="font-space font-bold uppercase tracking-wider text-white text-lg mb-2">Synthesis Failed</h3>
                <p className="text-xs text-red-200/80 mb-6 leading-relaxed">
                  {error}
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setView("scan")}
                    className="px-4.5 py-2 border border-border-dark hover:bg-[#03060a] text-xs uppercase tracking-wider text-text-dim font-space rounded-full transition"
                  >
                    Back to Scan
                  </button>
                  <button
                    onClick={handleGenerateExperiments}
                    className="px-5 py-2 bg-red-900/30 border border-red-800 hover:bg-red-800/40 text-xs uppercase tracking-wider text-white font-space rounded-full transition"
                  >
                    Retry Call
                  </button>
                </div>
              </div>
            )}

            {/* Pristine STEM experiment output presentation board */}
            {experimentPlan && !loadingResults && !error && (
              <div className="w-full max-w-4xl text-left">
                {/* Visual header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-dark pb-8 mb-8">
                  <div>
                    <span className="text-[11px] font-mono text-accent-teal uppercase tracking-widest font-semibold block mb-2 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-accent-teal" /> Generated STEM Experiment Syllabus
                    </span>
                    <h2 className="font-space font-bold text-3xl md:text-4xl text-white uppercase tracking-tight">
                      {experimentPlan.title || "The Physics of Detected Items"}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadJson}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-bg-surface border border-border-dark hover:border-accent-teal/50 rounded-full text-xs text-text-dim hover:text-white transition cursor-pointer font-space"
                    >
                      <Download className="w-3.5 h-3.5" /> Download JSON
                    </button>
                    
                    <button
                      onClick={() => setShowRawJson(!showRawJson)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#121c27] border border-border-dark hover:border-accent-teal/50 rounded-full text-xs text-accent-teal transition cursor-pointer font-space"
                    >
                      <Sliders className="w-3.5 h-3.5" /> {showRawJson ? "Hide JSON" : "Show JSON"}
                    </button>
                  </div>
                </div>

                {/* Subtitle / items constraints cards */}
                <div className="bg-bg-surface border border-border-dark rounded-2xl p-4.5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-text-dim uppercase tracking-wider font-mono mr-1">Basis Elements:</span>
                    {detectedItems.map((elem, eIdx) => (
                      <span key={eIdx} className="bg-bg-primary border border-border-dark px-2.5 py-1 rounded text-white font-mono">{elem}</span>
                    ))}
                  </div>

                  <div className="flex gap-4 border-t md:border-t-0 md:border-l border-border-dark pt-3 md:pt-0 md:pl-4 text-text-dim">
                    <div>
                      <span className="block uppercase tracking-wider font-mono text-[9px] mb-0.5">Audience Target</span>
                      <strong className="text-white text-xs uppercase">{audience}</strong>
                    </div>
                    <div>
                      <span className="block uppercase tracking-wider font-mono text-[9px] mb-0.5">Allocated Cap</span>
                      <strong className="text-white text-xs">{timeLimit} min max</strong>
                    </div>
                    <div>
                      <span className="block uppercase tracking-wider font-mono text-[9px] mb-0.5">Focus Module</span>
                      <strong className="text-white text-xs capitalize">{learningFocus || "General STEM"}</strong>
                    </div>
                  </div>
                </div>

                {/* Raw JSON View block panel */}
                {showRawJson && (
                  <div className="mb-8 rounded-2xl border border-border-dark bg-[#020508] p-4 font-mono text-xs overflow-x-auto max-h-96 text-left">
                    <div className="flex justify-between items-center pb-2 border-b border-border-dark mb-3">
                      <span className="text-accent-teal text-mono text-[10px] uppercase">Experiment Syllabus Raw JSON Format</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(rawPlanText);
                        }}
                        className="text-[10px] bg-bg-surface px-2.5 py-1 rounded border border-border-dark text-white cursor-pointer hover:bg-[#121c27]"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                    <pre className="text-gray-300 leading-normal whitespace-pre-wrap">{rawPlanText}</pre>
                  </div>
                )}

                {/* Dynamic Science Experiments Cards list */}
                <div className="space-y-8 text-left">
                  {experimentPlan.experiments?.map((exp, valIdx) => (
                    <div
                      key={valIdx}
                      className="bg-bg-surface border border-border-dark rounded-3xl p-6 hover:shadow-2xl hover:border-accent-teal/40 transition duration-300 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-teal to-transparent opacity-60" />

                      {/* Header block */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-accent-teal/10 border border-accent-teal/30 text-accent-teal flex items-center justify-center font-space font-bold text-sm">
                            {(valIdx + 1).toString().padStart(2, "0")}
                          </span>
                          <h3 className="font-space font-bold text-lg md:text-xl text-white uppercase tracking-tight">
                            {exp.name}
                          </h3>
                        </div>

                        {/* Badges block */}
                        <div className="flex gap-2 items-center text-xs">
                          <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase font-bold border ${
                            exp.difficulty === "easy" 
                              ? "bg-green-500/10 text-green-400 border-green-500/20" 
                              : exp.difficulty === "medium" 
                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" 
                                : "bg-red-500/10 text-red-00 border-red-500/20"
                          }`}>
                            {exp.difficulty}
                          </span>
                          
                          <span className="bg-bg-primary text-text-dim px-2.5 py-1 rounded inline-flex items-center gap-1 text-[10px] border border-border-dark font-mono">
                            <Clock className="w-3.5 h-3.5 text-accent-teal" /> {exp.estimatedTimeMinutes} Min
                          </span>
                        </div>
                      </div>

                      {/* Goal statement */}
                      <p className="text-sm text-text-dim border-l-2 border-accent-teal pl-4 mb-6 leading-relaxed italic">
                        "{exp.learningGoal}"
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Left grid: prerequisites & warning items */}
                        <div className="md:col-span-5 space-y-5">
                          {/* Materials requirement */}
                          <div className="bg-[#03060a]/50 rounded-2xl p-4.5 border border-border-dark text-xs">
                            <span className="block font-mono uppercase text-[9px] text-[#2c8b8b] tracking-wider mb-2 font-bold">Required Materials</span>
                            <ul className="space-y-1 text-gray-300">
                              {exp.materials?.map((mat, mIdx) => (
                                <li key={mIdx} className="flex items-start gap-1.5 leading-normal">
                                  <span className="text-accent-teal mt-0.5">•</span>
                                  <span>{mat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Safety warning checklist */}
                          {exp.safetyNotes && exp.safetyNotes.length > 0 && (
                            <div className="bg-red-950/10 rounded-2xl p-4.5 border border-red-950/30 text-xs">
                              <span className="block font-mono uppercase text-[9px] text-red-400 tracking-wider mb-2 font-bold flex items-center gap-1">
                                <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Security Caution Notes:
                              </span>
                              <ol className="space-y-1.5 text-red-200/80 leading-normal">
                                {exp.safetyNotes.map((saf, sId) => (
                                  <li key={sId} className="flex items-start gap-1.5">
                                    <span className="text-red-500 mt-0.5">⚠️</span>
                                    <span>{saf}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>

                        {/* Right grid: instructions steps procedure */}
                        <div className="md:col-span-7 bg-[#03060a]/20 p-5 rounded-2xl border border-border-dark text-xs">
                          <span className="block font-mono uppercase text-[9px] text-accent-teal tracking-wider mb-3.5 font-bold">Experiment Procedure Instructions</span>
                          <ol className="space-y-3 leading-relaxed">
                            {exp.steps?.map((step, stIdx) => (
                              <li key={stIdx} className="flex gap-3 text-gray-300 text-xs">
                                <span className="font-mono text-accent-teal font-bold">{stIdx + 1}.</span>
                                <span className="text-gray-200 leading-normal">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Final controls panel */}
                <div className="flex justify-center items-center gap-4 mt-12 border-t border-border-dark pt-8 select-none">
                  <button
                    onClick={() => {
                      setView("scan");
                      setTimeout(() => startCamera(selectedDevice), 150);
                    }}
                    className="px-6 py-3.5 bg-accent-teal hover:bg-accent-hover text-white text-xs uppercase tracking-widest font-space font-semibold rounded-xl transition duration-200 cursor-pointer shadow-lg"
                  >
                    <i className="fa-solid fa-rotate mr-1.5"></i> Scan Grid Again
                  </button>

                  <button
                    onClick={() => {
                      setView("home");
                    }}
                    className="px-6 py-3.5 border border-border-dark hover:bg-bg-surface text-xs uppercase tracking-widest font-space font-semibold rounded-xl text-text-dim hover:text-white transition cursor-pointer"
                  >
                    Home Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── VARIABLES CONFIGURATION & REVIEW MODAL ── */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-[#000000]/85 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-bg-surface border border-border-dark rounded-3xl w-full max-w-xl p-6 md:p-8 animate-fade-in text-left my-8 select-none shadow-2xl relative">
            
            {/* Top close cross button */}
            <button
              onClick={() => {
                setShowReviewModal(false);
                if (view === "scan") startCamera(selectedDevice); // Resume camera feeds!
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-bg-primary/80 border border-border-dark hover:border-accent-teal/50 text-text-dim hover:text-white flex items-center justify-center transition cursor-pointer text-sm"
            >
              ×
            </button>

            {/* Header info */}
            <div className="mb-6 border-b border-border-dark pb-4">
              <span className="text-[10px] font-mono text-accent-teal uppercase tracking-widest font-semibold block mb-1">Step 2 of 2</span>
              <h3 className="font-space font-bold uppercase tracking-tight text-white text-xl flex items-center gap-1.5">
                <Sliders className="w-5 h-5 text-accent-teal" /> Configure STEM Variables
              </h3>
              <p className="text-xs text-text-dim mt-1.5 leading-relaxed">
                Confirm your physical objects list, establish learning filters, difficulty constraints and provider priorities.
              </p>
            </div>

            {/* Items list review field */}
            <div className="mb-5">
              <label className="block text-[10px] font-mono text-text-dim uppercase tracking-wider mb-2 font-semibold">1. Confirm Physical Objects List</label>
              <div className="border border-border-dark bg-bg-primary/60 p-3.5 rounded-xl flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
                {detectedItems.length === 0 ? (
                  <span className="text-xs text-red-300">Wait! No items are targeted. Add manual items below.</span>
                ) : (
                  detectedItems.map((item, idx) => (
                    <span key={idx} className="bg-[#121c27] text-white text-xs border border-border-dark pl-2 rounded-full flex items-center gap-1 py-0.5">
                      {item}
                      <button
                        onClick={() => deleteItem(idx)}
                        className="w-4.5 h-4.5 rounded-full bg-red-950/40 hover:bg-red-900 text-red-400 flex items-center justify-center text-[10px] font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Sub-addition field within popup */}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Need to add something else?"
                  className="flex-1 bg-bg-primary border border-border-dark text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-accent-teal placeholder:text-text-dim/60"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value;
                      if (!val.trim()) return;
                      const formatted = val.trim().replace(/^\w/, (c) => c.toUpperCase());
                      if (!detectedItems.includes(formatted)) setDetectedItems([...detectedItems, formatted]);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
                <span className="text-[9px] text-text-dim flex align-middle self-center font-mono">Press Enter to Add</span>
              </div>
            </div>

            {/* LLM Engine setup */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-[10px] font-mono text-text-dim uppercase tracking-wider mb-1.5 font-semibold">2. AI Tutor Engine</label>
                <div className="flex border border-border-dark bg-bg-primary p-1 rounded-xl">
                  <button
                    onClick={() => setProvider("gemini")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg text-center cursor-pointer ${provider === "gemini" ? "bg-accent-teal text-white" : "text-text-dim hover:text-white"}`}
                  >
                    Gemini 3.5
                  </button>
                  <button
                    onClick={() => setProvider("deepseek")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg text-center cursor-pointer ${provider === "deepseek" ? "bg-[#183955] text-white" : "text-text-dim hover:text-white"}`}
                  >
                    DeepSeek C.
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-text-dim uppercase tracking-wider mb-1.5 font-semibold">3. Audience Target</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as any)}
                  className="w-full text-xs bg-bg-primary border border-border-dark rounded-xl px-2.5 py-2 focus:outline-none focus:border-accent-teal cursor-pointer"
                >
                  <option value="kids">For Kids (Pre-K to Elementary)</option>
                  <option value="teens">For Teens (Middle & High School)</option>
                  <option value="adults">For Adults (College & Beyond)</option>
                </select>
              </div>
            </div>

            {/* Custom Deepseek Key configuration if Deepseek is selected */}
            {provider === "deepseek" && (
              <div className="mb-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-3.5">
                <label className="block text-[10px] font-mono text-yellow-400 uppercase tracking-wider mb-1 font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Inject DeepSeek API Token
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Insert sk_deepseek_..."
                  className="w-full text-xs bg-bg-primary border border-yellow-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500/50"
                />
                <span className="text-[10px] text-text-dim block mt-1">If empty, server env DEEPSEEK_API_KEY is used.</span>
              </div>
            )}

            {/* Fine granular academic filter settings */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-[10px] font-mono text-text-dim uppercase tracking-wider mb-1.5 font-semibold">4. Time Limit cap</label>
                <select
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  className="w-full text-xs bg-bg-primary border border-border-dark rounded-xl px-2.5 py-2 focus:outline-none focus:border-accent-teal cursor-pointer"
                >
                  <option value="15">Max 15 Minutes</option>
                  <option value="30">Max 30 Minutes</option>
                  <option value="60">Max 60 Minutes</option>
                  <option value="120">Unlimited Time</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-text-dim uppercase tracking-wider mb-1.5 font-semibold">5. Learning Focus Filter</label>
                <input
                  type="text"
                  placeholder="e.g. Physics, Chemistry..."
                  value={learningFocus}
                  onChange={(e) => setLearningFocus(e.target.value)}
                  className="w-full text-xs bg-bg-primary border border-border-dark rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-accent-teal placeholder:text-text-dim/50"
                />
              </div>
            </div>

            {/* Injected other factors / materials available */}
            <div className="mb-5">
              <label className="block text-[10px] font-mono text-text-dim uppercase tracking-wider mb-1.5 font-semibold">6. Auxiliary Ingredients / Materials</label>
              <input
                type="text"
                placeholder="e.g., Vinegar, Baking Soda, Salt, Tape, Water"
                value={extraMaterials}
                onChange={(e) => setExtraMaterials(e.target.value)}
                className="w-full text-xs bg-bg-primary border border-border-dark rounded-xl px-3 py-2 focus:outline-none focus:border-accent-teal placeholder:text-text-dim/50"
              />
            </div>

            {/* Deep instruction prompt tuning */}
            <div className="mb-6">
              <label className="block text-[10px] font-mono text-text-dim uppercase tracking-wider mb-1.5 font-semibold">7. Prompt Directives (Fine-tuning)</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                className="w-full text-xs bg-bg-primary border border-border-dark rounded-xl p-3 focus:outline-none focus:border-accent-teal text-white leading-relaxed placeholder:text-text-dim/50"
              />
            </div>

            {/* Action footer controls */}
            <div className="flex gap-3 justify-end pt-3 border-t border-border-dark">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  if (view === "scan") startCamera(selectedDevice); // Resume camera feeds!
                }}
                className="px-5 py-2.5 border border-border-dark hover:bg-bg-primary/80 rounded-xl text-xs uppercase tracking-wider font-space font-medium text-text-dim hover:text-white transition cursor-pointer"
              >
                Back To Scan
              </button>

              <button
                onClick={handleGenerateExperiments}
                disabled={detectedItems.length === 0}
                className="px-5 py-2.5 bg-accent-teal hover:bg-accent-hover text-white text-xs uppercase tracking-widest font-space font-bold rounded-xl shadow-lg transition duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                 Accept & Generate <Sparkles className="w-3.5 h-3.5 inline ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="py-6 px-12 border-t border-border-dark bg-bg-primary flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-dim select-none mt-auto z-10 w-full">
        <div>
          <span>© {new Date().getFullYear()} STEMSense Engine. Remade with elite React state machine.</span>
        </div>
        
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/CalTex81/STEMSense"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-accent-teal transition-colors"
          >
            <Github className="w-4 h-4" /> Original Repository
          </a>
        </div>
      </footer>
    </div>
  );
}
