"use client";

import { useState, Suspense } from "react";
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
import { useLanguage } from "@/contexts/LanguageContext";

const SDMMap = dynamic(() => import("@/components/SDMMap").then(mod => mod.SDMMap), { ssr: false });

const SPECIES_OPTIONS = [
  { value: "vachellia-nilotica", label: "Vachellia nilotica (Babul)" },
  { value: "lantana-camara", label: "Lantana camara (Tembelekan)" },
  { value: "merremia-hederacea", label: "Merremia hederacea (Kangkung Pagar)" },
  { value: "clitoria-ternatea", label: "Clitoria ternatea (Telang)" },
  { value: "ageratum-conyzoides", label: "Ageratum conyzoides (Bandotan)" },
];

const YEAR_OPTIONS = ["2040", "2060", "2080", "2100", "2120", "2140", "2160", "2180", "2200"];

const MODEL_COPY = {
  en: {
    title: "Plant Distribution Prediction (SDM)",
    modelParameters: "Model Parameters",
    plantSpecies: "Plant Species",
    timeHorizon: "Year / Time Horizon",
    calculating: "Calculating Prediction...",
    runPrediction: "Predict Distribution",
    predictionMap: "Distribution Prediction Map",
    year: "Year",
    simulatingNote: "Depending on data resolution and parameters, this process may take a few moments.",
    emptyMap: "Choose a species and year, then run a prediction to view the result map.",
    riskLevel: "IUCN Risk Level",
    riskAssessment: "IUCN Risk Assessment — Habitat Suitability",
    riskIntro: "Habitat suitability classification based on IUCN assessment for invasive species",
    inYear: "in",
    modelMetrics: "AI Model Metrics (Validation)",
    suitability: "Suitability",
    reportCsv: "CSV Report",
    reportPdf: "PDF Report",
    statuses: {
      excellent: "Excellent",
      good: "Good",
      fair: "Fair",
    },
    metrics: {
      auc: "AUC-ROC",
      accuracy: "Prediction Accuracy",
      precision: "Precision",
      samples: "Sample Data",
      points: "points",
    },
    risks: {
      critical: {
        level: "Critical Risk",
        description: "Core invasion zone — habitat is highly suitable, populations are established and spreading aggressively.",
        suitability: "Very High (>80%)",
      },
      high: {
        level: "High Risk",
        description: "Active spread zone — habitat is suitable, species actively colonize and affect local ecosystems.",
        suitability: "High (60-80%)",
      },
      medium: {
        level: "Medium Risk",
        description: "Transition zone — habitat is moderately suitable, with colonization potential under certain conditions.",
        suitability: "Medium (40-60%)",
      },
      low: {
        level: "Low Risk",
        description: "Peripheral zone — habitat is less suitable, invasion risk is low but monitoring is still needed.",
        suitability: "Low (<40%)",
      },
    },
  },
  id: {
    title: "Prediksi Persebaran Tumbuhan (SDM)",
    modelParameters: "Parameter Model",
    plantSpecies: "Spesies Tumbuhan",
    timeHorizon: "Tahun / Time Horizon",
    calculating: "Menghitung Prediksi...",
    runPrediction: "Prediksi Persebaran",
    predictionMap: "Peta Hasil Prediksi Persebaran",
    year: "Tahun",
    simulatingNote: "Bergantung pada resolusi data dan parameter, proses ini membutuhkan beberapa waktu.",
    emptyMap: "Pilih spesies dan tahun, lalu jalankan prediksi untuk melihat peta hasil.",
    riskLevel: "Tingkat Risiko IUCN",
    riskAssessment: "Penilaian Risiko IUCN — Habitat Suitability",
    riskIntro: "Klasifikasi kesesuaian habitat berdasarkan penilaian IUCN untuk spesies invasif",
    inYear: "pada tahun",
    modelMetrics: "Metrik AI Model (Validation)",
    suitability: "Suitability",
    reportCsv: "Laporan CSV",
    reportPdf: "Laporan PDF",
    statuses: {
      excellent: "Sangat Baik",
      good: "Baik",
      fair: "Cukup",
    },
    metrics: {
      auc: "AUC-ROC",
      accuracy: "Akurasi Prediksi",
      precision: "Precision",
      samples: "Data Sampel",
      points: "titik",
    },
    risks: {
      critical: {
        level: "Critical Risk",
        description: "Zona inti invasi — habitat sangat sesuai, populasi telah mapan dan menyebar agresif.",
        suitability: "Sangat Tinggi (>80%)",
      },
      high: {
        level: "High Risk",
        description: "Zona penyebaran aktif — habitat sesuai, spesies aktif berkoloni dan berdampak pada ekosistem lokal.",
        suitability: "Tinggi (60-80%)",
      },
      medium: {
        level: "Medium Risk",
        description: "Zona transisi — habitat cukup sesuai, spesies memiliki potensi koloni dalam kondisi tertentu.",
        suitability: "Sedang (40-60%)",
      },
      low: {
        level: "Low Risk",
        description: "Zona periferal — habitat kurang sesuai, risiko invasi rendah namun perlu pemantauan.",
        suitability: "Rendah (<40%)",
      },
    },
  },
} as const;

const IUCN_STYLE = {
  critical: {
    color: "#C62828",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-800",
    badgeColor: "bg-red-600",
    icon: AlertTriangle,
    iucnCategory: "Massive Concern (MC)",
  },
  high: {
    color: "#E65100",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-800",
    badgeColor: "bg-orange-600",
    icon: ShieldAlert,
    iucnCategory: "Major Concern (MJ)",
  },
  medium: {
    color: "#F9A825",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-800",
    badgeColor: "bg-yellow-600",
    icon: Shield,
    iucnCategory: "Moderate Concern (MO)",
  },
  low: {
    color: "#2E7D32",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-800",
    badgeColor: "bg-green-600",
    icon: ShieldCheck,
    iucnCategory: "Minor Concern (MI)",
  },
} as const;

const RISK_KEYS = ["critical", "high", "medium", "low"] as const;

function ModelingContent() {
  const searchParams = useSearchParams();
  const [species, setSpecies] = useState(() => {
    const speciesParam = searchParams.get("species");
    return SPECIES_OPTIONS.find(s => s.value === speciesParam)?.value ?? "lantana-camara";
  });
  const [horizon, setHorizon] = useState("2040");
  const { language } = useLanguage();
  const copy = MODEL_COPY[language];

  const [isSimulating, setIsSimulating] = useState(false);
  const [predictionResult, setPredictionResult] = useState<{ species: string, year: string, mapUrl: string } | null>(null);

  const handlePredict = () => {
    setIsSimulating(true);
    setPredictionResult(null);

    setTimeout(() => {
      setIsSimulating(false);
      setPredictionResult({
        species,
        year: horizon,
        mapUrl: `https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop&sepia=1&hue-rotate=${Math.floor(Math.random() * 90)}deg`
      });
    }, 2500);
  };

  const baseAcc = 89;
  const accMod = parseInt(horizon) === 2025 ? 2 : parseInt(horizon) > 2050 ? -4 : 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{copy.title}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{copy.modelParameters}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{copy.plantSpecies}</label>
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
              <label className="mb-1.5 block text-sm font-medium text-foreground">{copy.timeHorizon}</label>
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
                <><Loader2 className="h-4 w-4 animate-spin" /> {copy.calculating}</>
              ) : (
                <><Play className="h-4 w-4" /> {copy.runPrediction}</>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>{copy.predictionMap}</span>
              {predictionResult && <Badge variant="outline" className="text-xs">{copy.year}: {predictionResult.year}</Badge>}
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
                  <p className="text-xs text-muted-foreground w-64 text-center">{copy.simulatingNote}</p>
                </div>
              ) : predictionResult ? (
                <>
                  <div className="absolute inset-0 z-0">
                    <SDMMap species={predictionResult.species} year={predictionResult.year} />
                  </div>
                  <div className="absolute bottom-4 right-4 z-10 bg-background/90 backdrop-blur-md p-3 rounded-lg shadow-lg border">
                    <p className="text-xs font-bold mb-2 text-foreground">{copy.riskLevel}</p>
                    <div className="flex flex-col gap-1.5">
                      {RISK_KEYS.map((riskKey) => (
                        <div key={riskKey} className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: IUCN_STYLE[riskKey].color }} />
                          <span className="text-[10px] text-foreground">{copy.risks[riskKey].level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <MapIcon className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm">{copy.emptyMap}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {predictionResult && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              {copy.riskAssessment}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {copy.riskIntro}{" "}
              <span className="font-medium text-foreground">
                {SPECIES_OPTIONS.find(s => s.value === predictionResult.species)?.label}
              </span>{" "}
              {copy.inYear} <span className="font-medium text-foreground">{predictionResult.year}</span>.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {RISK_KEYS.map((riskKey) => {
                const s = IUCN_STYLE[riskKey];
                const riskCopy = copy.risks[riskKey];
                const Icon = s.icon;
                return (
                  <div
                    key={riskKey}
                    className={`rounded-lg border ${s.borderColor} ${s.bgColor} p-4 transition-all hover:shadow-md`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="rounded-md p-1.5" style={{ backgroundColor: s.color }}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className={`text-sm font-bold ${s.textColor}`}>{riskCopy.level}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{copy.suitability}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{riskCopy.suitability}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">IUCN</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{s.iucnCategory}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{riskCopy.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {predictionResult && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle className="text-base">{copy.modelMetrics}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-8">
              {[
                { label: copy.metrics.auc, value: `0.${baseAcc + accMod + 2}`, status: copy.statuses.excellent },
                { label: copy.metrics.accuracy, value: `${baseAcc + accMod - 1}.4%`, status: copy.statuses.good },
                { label: copy.metrics.precision, value: `${baseAcc + accMod - 3}.1%`, status: copy.statuses.fair },
                { label: copy.metrics.samples, value: `24,500 ${copy.metrics.points}`, status: "Colab" },
              ].map((m) => (
                <div key={m.label} className="flex flex-col items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                  <span className="text-2xl font-bold text-foreground">{m.value}</span>
                  <Badge variant={m.status === copy.statuses.excellent ? "default" : "secondary"} className="text-[10px]">
                    {m.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 mt-2">
        <Button variant="outline" className="gap-2" disabled={!predictionResult}><Download className="h-4 w-4" /> GeoTIFF</Button>
        <Button variant="outline" className="gap-2" disabled={!predictionResult}><Download className="h-4 w-4" /> {copy.reportCsv}</Button>
        <Button variant="outline" className="gap-2" disabled={!predictionResult}><Download className="h-4 w-4" /> {copy.reportPdf}</Button>
      </div>
    </div>
  );
}

export default function Modeling() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ModelingContent />
    </Suspense>
  );
}