"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Upload, X, ScanSearch, CheckCircle2, AlertCircle, Video, CircleDot, SwitchCamera, ArrowLeft, Map as MapIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface DetectionResult {
  name: string;
  confidence: number;
  box?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
  } | null;
  link: string;
}

interface CameraSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DialogView = "menu" | "camera" | "result";

export function CameraSearchDialog({ open, onOpenChange }: CameraSearchDialogProps) {
  const [view, setView] = useState<DialogView>("menu");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionResults, setDetectionResults] = useState<DetectionResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const router = useRouter();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (facing: "user" | "environment" = facingMode) => {
    setCameraError(null);
    setIsCameraReady(false);

    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraReady(true);
        };
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError") {
        setCameraError("Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.");
      } else if (err.name === "NotFoundError") {
        setCameraError("Kamera tidak ditemukan. Pastikan perangkat Anda memiliki kamera.");
      } else {
        setCameraError("Gagal mengakses kamera. Silakan coba lagi.");
      }
    }
  }, [facingMode]);

  // Handle switching camera facing mode
  const switchCamera = useCallback(async () => {
    const newFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacing);
    await startCamera(newFacing);
  }, [facingMode, startCamera]);

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror the image if using front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to data URL and File
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setImageSrc(dataUrl);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          setImageFile(file);
          stopCamera();
          setView("result");
          startAnalysis(file);
        }
      },
      "image/jpeg",
      0.9
    );
  }, [facingMode, stopCamera]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setView("result");
      startAnalysis(file);
    }
  };

  const startAnalysis = async (file: File) => {
    setIsAnalyzing(true);
    setDetectionResults(null);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/v1/plants/detect", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (json.success && json.data?.plants?.length > 0) {
        setDetectionResults(json.data.plants);
      } else {
        setDetectionResults([]);
      }
    } catch (err) {
      console.error("Detection failed:", err);
      setError("Gagal menganalisis gambar. Silakan coba lagi.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetDialog = () => {
    stopCamera();
    setView("menu");
    setImageSrc(null);
    setImageFile(null);
    setIsAnalyzing(false);
    setDetectionResults(null);
    setError(null);
    setCameraError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetDialog();
    }
    onOpenChange(newOpen);
  };

  const handleViewDetails = (plantName: string) => {
    handleOpenChange(false);
    const id = plantName.toLowerCase().replace(/\s+/g, '-');
    router.push(`/species/${id}`);
  };

  const handleViewSDM = (plantName: string) => {
    handleOpenChange(false);
    const speciesSlug = plantName.toLowerCase().replace(/\s+/g, '-');
    router.push(`/modeling?species=${speciesSlug}`);
  };

  const handleTakePhotoClick = () => {
    setView("camera");
    // Small delay to ensure the video element is rendered before starting camera
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  // Cleanup camera on unmount or dialog close
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Stop camera when dialog closes
  useEffect(() => {
    if (!open) {
      stopCamera();
    }
  }, [open, stopCamera]);

  // Get the top detection result
  const topResult = detectionResults && detectionResults.length > 0 ? detectionResults[0] : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {view === "menu" && "Search by Image"}
            {view === "camera" && "Take Photo"}
            {view === "result" && "Detection Result"}
          </DialogTitle>
          <DialogDescription>
            {view === "menu" && "Identify invasive alien species by analyzing a photo."}
            {view === "camera" && "Point the camera at a plant and capture a photo."}
            {view === "result" && "Analyzing your image for invasive alien species."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          {/* ========== MENU VIEW ========== */}
          {view === "menu" && (
            <div className="grid w-full grid-cols-2 gap-4">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                className="flex h-24 flex-col gap-2 bg-muted/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 text-primary" />
                <span>Upload Image</span>
              </Button>

              <Button
                variant="outline"
                className="flex h-24 flex-col gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20"
                onClick={handleTakePhotoClick}
              >
                <Camera className="h-6 w-6 text-primary" />
                <span>Take Photo</span>
              </Button>
            </div>
          )}

          {/* ========== CAMERA VIEW ========== */}
          {view === "camera" && (
            <div className="flex w-full flex-col items-center space-y-4">
              {cameraError ? (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="w-full flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                    <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-destructive">Kamera Error</span>
                      <span className="text-xs text-destructive/80">{cameraError}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { resetDialog(); }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative w-full overflow-hidden rounded-lg border-2 border-primary/20 bg-black" style={{ aspectRatio: "4/3" }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full object-cover"
                      style={facingMode === "user" ? { transform: "scaleX(-1)" } : undefined}
                    />
                    {/* Hidden canvas for capturing */}
                    <canvas ref={canvasRef} className="hidden" />

                    {!isCameraReady && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                        <Video className="h-8 w-8 animate-pulse text-primary mb-2" />
                        <span className="text-sm text-white animate-pulse">Memuat kamera...</span>
                      </div>
                    )}

                    {/* Camera viewfinder corners */}
                    {isCameraReady && (
                      <div className="absolute inset-4 pointer-events-none">
                        {/* Top-left corner */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/70 rounded-tl-sm" />
                        {/* Top-right corner */}
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/70 rounded-tr-sm" />
                        {/* Bottom-left corner */}
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/70 rounded-bl-sm" />
                        {/* Bottom-right corner */}
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/70 rounded-br-sm" />
                      </div>
                    )}
                  </div>

                  <div className="flex w-full items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => { resetDialog(); }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <Button
                      size="lg"
                      className="flex-1 bg-primary hover:bg-primary/90 gap-2"
                      onClick={capturePhoto}
                      disabled={!isCameraReady}
                    >
                      <CircleDot className="h-5 w-5" />
                      Ambil Foto
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={switchCamera}
                      disabled={!isCameraReady}
                    >
                      <SwitchCamera className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ========== RESULT VIEW ========== */}
          {view === "result" && imageSrc && (
            <div className="flex w-full flex-col items-center space-y-4">
              <div className="relative h-48 w-full overflow-hidden rounded-md border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt="Captured"
                  className="h-full w-full object-cover"
                />
                
                {isAnalyzing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                    <ScanSearch className="h-8 w-8 animate-pulse text-primary mb-2" />
                    <span className="text-sm font-medium animate-pulse">Menganalisis gambar...</span>
                    <span className="text-xs text-muted-foreground mt-1">Menghubungi AI detection service</span>
                  </div>
                )}
              </div>

              {/* Error state */}
              {error && (
                <div className="w-full flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-destructive">Error</span>
                    <span className="text-xs text-destructive/80">{error}</span>
                  </div>
                </div>
              )}

              {/* No results */}
              {detectionResults && detectionResults.length === 0 && !error && (
                <div className="w-full flex items-start gap-3 rounded-lg border bg-muted p-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Tidak Terdeteksi</span>
                    <span className="text-xs text-muted-foreground">Tidak ada tanaman invasif yang terdeteksi pada gambar ini.</span>
                  </div>
                </div>
              )}

              {/* Detection results */}
              {topResult && (
                <div className="w-full flex items-start gap-3 rounded-lg border bg-success/10 p-3 text-success-foreground">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Teridentifikasi</span>
                    <span className="text-lg font-bold">{topResult.name}</span>
                    <span className="text-xs opacity-80">{Math.round(topResult.confidence * 100)}% confidence score</span>
                  </div>
                </div>
              )}

              {/* Multiple detections */}
              {detectionResults && detectionResults.length > 1 && (
                <div className="w-full space-y-1">
                  <span className="text-xs text-muted-foreground">Deteksi lainnya:</span>
                  {detectionResults.slice(1, 4).map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleViewDetails(result.name)}
                      className="w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <span className="font-medium">{result.name}</span>
                      <span className="text-xs text-muted-foreground">{Math.round(result.confidence * 100)}%</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex w-full flex-col gap-2">
                <div className="flex w-full gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={resetDialog}
                    disabled={isAnalyzing}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                  {topResult && (
                    <Button className="w-full bg-primary" onClick={() => handleViewDetails(topResult.name)}>
                      View Details
                    </Button>
                  )}
                </div>
                {topResult && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => handleViewSDM(topResult.name)}
                  >
                    <MapIcon className="h-4 w-4" />
                    View SDM Map
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
