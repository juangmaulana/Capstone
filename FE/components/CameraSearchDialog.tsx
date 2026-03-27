"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X, ScanSearch, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface CameraSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CameraSearchDialog({ open, onOpenChange }: CameraSearchDialogProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mockResult, setMockResult] = useState<string | null>(null);
  const router = useRouter();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
        startMockAnalysis();
      };
      reader.readAsDataURL(file);
    }
  };

  const startMockAnalysis = () => {
    setIsAnalyzing(true);
    setMockResult(null);
    
    // Simulate API delay for plant identification
    setTimeout(() => {
      setIsAnalyzing(false);
      setMockResult("Lantana camara");
    }, 2500);
  };

  const resetDialog = () => {
    setImageSrc(null);
    setIsAnalyzing(false);
    setMockResult(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetDialog();
    }
    onOpenChange(newOpen);
  };

  const handleViewDetails = () => {
    if (mockResult) {
      handleOpenChange(false);
      const id = mockResult.toLowerCase().replace(/\s+/g, '-');
      router.push(`/species/${id}`);
    }
  };

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
                    <span className="text-sm font-medium animate-pulse">Scanning attributes...</span>
                  </div>
                )}
              </div>

              {mockResult && (
                <div className="w-full flex items-start gap-3 rounded-lg border bg-success/10 p-3 text-success-foreground">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Match Identified</span>
                    <span className="text-lg font-bold">{mockResult}</span>
                    <span className="text-xs opacity-80">98% confidence score</span>
                  </div>
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
                {mockResult && (
                  <Button className="w-full bg-primary" onClick={handleViewDetails}>
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
