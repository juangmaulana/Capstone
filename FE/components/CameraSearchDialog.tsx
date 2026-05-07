"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X, ScanSearch, CheckCircle2, AlertCircle } from "lucide-react";
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

export function CameraSearchDialog({ open, onOpenChange }: CameraSearchDialogProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionResults, setDetectionResults] = useState<DetectionResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
      };
      reader.readAsDataURL(file);
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
    setImageSrc(null);
    setImageFile(null);
    setIsAnalyzing(false);
    setDetectionResults(null);
    setError(null);
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

  // Get the top detection result
  const topResult = detectionResults && detectionResults.length > 0 ? detectionResults[0] : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search by Image</DialogTitle>
          <DialogDescription>
            Identify invasive alien species by analyzing a photo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          {!imageSrc ? (
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

              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                capture="environment"
                className="hidden"
                ref={cameraInputRef}
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                className="flex h-24 flex-col gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-6 w-6 text-primary" />
                <span>Take Photo</span>
              </Button>
            </div>
          ) : (
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
