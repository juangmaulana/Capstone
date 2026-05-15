"use client";

import { useState, useEffect } from "react";
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
import { Download, Play, Loader2, Map as MapIcon, AlertTriangle, ShieldAlert, ShieldCheck, Shield } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const SDMMap = dynamic(() => import("@/components/SDMMap").then(mod => mod.SDMMap), { ssr: false });

const SPECIES_OPTIONS = [
  { value: "vachellia-nilotica", label: "Vachellia nilotica (Babul)" },
  { value: "lantana-camara", label: "Lantana camara (Tembelekan)" },
  { value: "merremia-hederacea", label: "Merremia hederacea (Kangkung Pagar)" },
  { value: "clitoria-ternatea", label: "Clitoria ternatea (Telang)" },
  { value: "ageratum-conyzoides", label: "Ageratum conyzoides (Bandotan)" },
];

const YEAR_OPTIONS = ["2040", "2060", "2080", "2100", "2120", "2140", "2160", "2180", "2200"];

// IUCN Risk Assessment suitability categories
const IUCN_SUITABILITY = [
  {
    level: "Critical Risk",
    color: "#C62828",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-800",
    badgeColor: "bg-red-600",
    icon: AlertTriangle,
    description: "Zona inti invasi — habitat sangat sesuai, populasi telah mapan dan menyebar agresif.",
    suitability: "Sangat Tinggi (>80%)",
    iucnCategory: "Massive Concern (MC)",
  },
  {
    level: "High Risk",
    color: "#E65100",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-800",
    badgeColor: "bg-orange-600",
    icon: ShieldAlert,
    description: "Zona penyebaran aktif — habitat sesuai, spesies aktif berkoloni dan berdampak pada ekosistem lokal.",
    suitability: "Tinggi (60–80%)",
    iucnCategory: "Major Concern (MJ)",
  },
  {
    level: "Medium Risk",
    color: "#F9A825",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-800",
    badgeColor: "bg-yellow-600",
    icon: Shield,
    description: "Zona transisi — habitat cukup sesuai, spesies memiliki potensi koloni dalam kondisi tertentu.",
    suitability: "Sedang (40–60%)",
    iucnCategory: "Moderate Concern (MO)",
  },
  {
    level: "Low Risk",
    color: "#2E7D32",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-800",
    badgeColor: "bg-green-600",
    icon: ShieldCheck,
    description: "Zona periferal — habitat kurang sesuai, risiko invasi rendah namun perlu pemantauan.",
    suitability: "Rendah (<40%)",
    iucnCategory: "Minor Concern (MI)",
  },
];

export default function Modeling() {
  const searchParams = useSearchParams();
  const [species, setSpecies] = useState("lantana-camara");
  const [horizon, setHorizon] = useState("2040");

  // Read species from URL query parameter (e.g., /modeling?species=lantana-camara)
  useEffect(() => {
    const speciesParam = searchParams.get("species");
    if (speciesParam) {
      // Check if the species exists in options, if not try to find a match
      const match = SPECIES_OPTIONS.find(s => s.value === speciesParam);
      if (match) {
        setSpecies(match.value);
      }
    }
  }, [searchParams]);

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
                  {/* Legend overlay on map */}
                  <div className="absolute bottom-4 right-4 z-10 bg-background/90 backdrop-blur-md p-3 rounded-lg shadow-lg border">
                    <p className="text-xs font-bold mb-2 text-foreground">Tingkat Risiko IUCN</p>
                    <div className="flex flex-col gap-1.5">
                      {IUCN_SUITABILITY.map((s) => (
                        <div key={s.level} className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                          <span className="text-[10px] text-foreground">{s.level}</span>
                        </div>
                      ))}
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

      {/* IUCN Risk Assessment Suitability Panel */}
      {predictionResult && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Penilaian Risiko IUCN — Habitat Suitability
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Klasifikasi kesesuaian habitat berdasarkan penilaian IUCN untuk spesies invasif{" "}
              <span className="font-medium text-foreground">
                {SPECIES_OPTIONS.find(s => s.value === predictionResult.species)?.label}
              </span>{" "}
              pada tahun <span className="font-medium text-foreground">{predictionResult.year}</span>.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {IUCN_SUITABILITY.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.level}
                    className={`rounded-lg border ${s.borderColor} ${s.bgColor} p-4 transition-all hover:shadow-md`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="rounded-md p-1.5" style={{ backgroundColor: s.color }}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className={`text-sm font-bold ${s.textColor}`}>{s.level}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Suitability</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{s.suitability}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">IUCN</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{s.iucnCategory}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{s.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
