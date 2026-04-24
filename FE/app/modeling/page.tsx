"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Play, Loader2, Map as MapIcon } from "lucide-react";
import dynamic from "next/dynamic";

const SDMMap = dynamic(() => import("@/components/SDMMap").then(mod => mod.SDMMap), { ssr: false });

const SPECIES_OPTIONS = [
  { value: "acacia-nilotica", label: "Acacia nilotica (Babul)" },
  { value: "lantana-camara", label: "Lantana camara (Tembelekan)" },
  { value: "mikania-micrantha", label: "Mikania micrantha (Sembung Rambat)" },
  { value: "chromolaena-odorata", label: "Chromolaena odorata (Kirinyuh)" },
  { value: "ageratum-conyzoides", label: "Ageratum conyzoides (Bandotan)" },
];

const YEAR_OPTIONS = Array.from({ length: 74 }, (_, i) => (2027 + i).toString());

export default function Modeling() {
  const [species, setSpecies] = useState("lantana-camara");
  const [horizon, setHorizon] = useState("2027");

  const [isSimulating, setIsSimulating] = useState(false);
  const [predictionResult, setPredictionResult] = useState<{ species: string, year: string, mapUrl: string } | null>(null);

  const handlePredict = () => {
    setIsSimulating(true);
    setPredictionResult(null);

    // Simulate API call to Google Colab trained model
    setTimeout(() => {
      setIsSimulating(false);
      // Using placeholder heatmap/prediction image
      setPredictionResult({
        species,
        year: horizon,
        mapUrl: `https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop&sepia=1&hue-rotate=${Math.floor(Math.random() * 90)
          }deg` // just rotating hue slightly based on "prediction"
      });
    }, 2500);
  };

  // Fake slight variation in metrics based on year
  const baseAcc = 89;
  const accMod = parseInt(horizon) === 2025 ? 2 : parseInt(horizon) > 2050 ? -4 : 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Prediksi Persebaran Tumbuhan (SDM)</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parameter Model</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Spesies Tumbuhan</label>
              <Select value={species} onValueChange={setSpecies}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPECIES_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Tahun / Time Horizon</label>
              <Select value={horizon} onValueChange={setHorizon}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="mt-4 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handlePredict}
              disabled={isSimulating}
            >
              {isSimulating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Menghitung Prediksi...</>
              ) : (
                <><Play className="h-4 w-4" /> Prediksi Persebaran</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Map placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Peta Hasil Prediksi Persebaran</span>
              {predictionResult && <Badge variant="outline" className="text-xs">Tahun: {predictionResult.year}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative flex h-[400px] w-full items-center justify-center overflow-hidden rounded-lg border bg-muted text-muted-foreground shadow-inner">
              {isSimulating ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative h-16 w-16">
                    <div className="absolute inset-0 animate-ping rounded-full border-2 border-primary opacity-20"></div>
                    <div className="absolute inset-2 animate-pulse rounded-full border-4 border-primary/50"></div>
                    <MapIcon className="absolute inset-4 h-8 w-8 text-primary animate-bounce shadow-sm" />
                  </div>
                  <p className="text-xs text-muted-foreground w-64 text-center">Bergantung pada resolusi data dan parameter, proses ini membutuhkan beberapa waktu.</p>
                </div>
              ) : predictionResult ? (
                <>
                  <div className="absolute inset-0 z-0">
                    <SDMMap species={predictionResult.species} year={predictionResult.year} />
                  </div>
                  <div className="absolute bottom-4 right-4 z-10 bg-background/90 backdrop-blur-md p-3 rounded-lg shadow-lg border">
                    <p className="text-xs font-bold mb-2 text-foreground">Indeks Kesesuaian Habitat</p>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-24 bg-gradient-to-r from-blue-500 via-green-400 to-red-500 rounded-full"></div>
                      <span className="text-[10px] text-muted-foreground">Tinggi</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <MapIcon className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm">Pilih spesies dan tahun, lalu jalankan prediksi untuk melihat peta hasil.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Metrics */}
      {predictionResult && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle className="text-base">Metrik AI Model (Validation)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-8">
              {[
                { label: "AUC-ROC", value: `0.${baseAcc + accMod + 2}`, status: "Sangat Baik" },
                { label: "Akurasi Prediksi", value: `${baseAcc + accMod - 1}.4%`, status: "Baik" },
                { label: "Precision", value: `${baseAcc + accMod - 3}.1%`, status: "Cukup" },
                { label: "Data Sampel", value: "24,500 titik", status: "Colab" },
              ].map((m) => (
                <div key={m.label} className="flex flex-col items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                  <span className="text-2xl font-bold text-foreground">{m.value}</span>
                  <Badge variant={m.status === "Sangat Baik" ? "default" : "secondary"} className="text-[10px]">
                    {m.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export */}
      <div className="flex gap-3 mt-2">
        <Button variant="outline" className="gap-2" disabled={!predictionResult}><Download className="h-4 w-4" /> GeoTIFF</Button>
        <Button variant="outline" className="gap-2" disabled={!predictionResult}><Download className="h-4 w-4" /> CSV Report</Button>
        <Button variant="outline" className="gap-2" disabled={!predictionResult}><Download className="h-4 w-4" /> PDF Report</Button>
      </div>
    </div>
  );
}
