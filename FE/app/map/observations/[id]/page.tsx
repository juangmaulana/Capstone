"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Image as ImageIcon, MapPin, Sprout } from "lucide-react";
import { ExternalSourceText } from "@/components/ExternalSourceText";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";
import {
  fetchPlantById,
  getMapObservationByIdFromApi,
  getMapObservationSpeciesHref,
  MAP_SPECIES_COLOR,
  type MapObservation,
  type PlantDetail,
} from "@/lib/map-observations";

const OBSERVATION_COPY = {
  en: {
    back: "Back",
    missing: "Observation not found",
    detectionResult: "Detection Result",
    detectedSpecies: "Detected Species",
    confidence: "Confidence",
    identifiedAt: "Identified At",
    location: "Location",
    latitude: "Latitude",
    longitude: "Longitude",
    elevation: "Elevation",
    source: "Source",
    family: "Family",
    imageSource: "Image Source",
    imageInfo: "Image Info",
    file: "File",
    size: "Size",
    capturedLocation: "Captured Location",
    loading: "Loading observation...",
  },
  id: {
    back: "Kembali",
    missing: "Observasi tidak ditemukan",
    detectionResult: "Hasil Deteksi",
    detectedSpecies: "Spesies Terdeteksi",
    confidence: "Kepercayaan",
    identifiedAt: "Diidentifikasi Pada",
    location: "Lokasi",
    latitude: "Latitude",
    longitude: "Longitude",
    elevation: "Elevasi",
    source: "Sumber",
    family: "Famili",
    imageSource: "Sumber Gambar",
    imageInfo: "Info Gambar",
    file: "File",
    size: "Ukuran",
    capturedLocation: "Lokasi Pengambilan",
    loading: "Memuat observasi...",
  },
} as const;

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="border-b border-border/70 py-2.5 last:border-0 lg:py-3">
    <p className="mb-1 text-[10px] font-medium text-muted-foreground lg:text-[11px]">{label}</p>
    <div className="break-words text-xs font-semibold text-foreground lg:text-sm">{children}</div>
  </div>
);

export default function MapObservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const copy = OBSERVATION_COPY[language];
  const id = typeof params?.id === "string" ? params.id : "";
  const [observation, setObservation] = useState<MapObservation | null>(null);
  const [plantDetail, setPlantDetail] = useState<PlantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(id.length > 0);

  useEffect(() => {
    let isMounted = true;

    async function fetchObservation() {
      setIsLoading(true);
      const nextObservation = await getMapObservationByIdFromApi(id);
      if (!isMounted) return;
      setObservation(nextObservation);
      setIsLoading(false);
    }

    fetchObservation();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    async function fetchContext() {
      if (!observation) return;
      const nextPlantDetail = observation.plantId ? await fetchPlantById(observation.plantId) : null;

      if (!isMounted) return;
      setPlantDetail(nextPlantDetail);
    }

    fetchContext();

    return () => {
      isMounted = false;
    };
  }, [observation]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-4 bg-muted/30 p-6 text-center">
        <p className="text-lg font-semibold text-muted-foreground">{copy.loading}</p>
      </div>
    );
  }

  if (!observation) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-4 bg-muted/30 p-6 text-center">
        <p className="text-lg font-semibold text-muted-foreground">{copy.missing}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {copy.back}
        </button>
      </div>
    );
  }

  const speciesColor = MAP_SPECIES_COLOR[observation.species] || "#2E7D32";
  const speciesHref = getMapObservationSpeciesHref(observation);
  const detectedSpecies = plantDetail?.scientificName || observation.species;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-muted/40">
      <div className="mx-auto grid w-full max-w-7xl gap-3 lg:my-6 lg:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.35fr)] lg:gap-6 lg:bg-transparent lg:px-6 xl:grid-cols-[minmax(430px,0.9fr)_minmax(0,1.4fr)]">
        <section className="relative h-60 overflow-hidden bg-white shadow-sm lg:sticky lg:top-6 lg:h-[calc(100vh-112px)] lg:min-h-[620px] lg:rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={observation.imagePath}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={observation.imagePath}
            alt={observation.species}
            className="relative h-full w-full object-contain"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/75" />
          <button
            type="button"
            onClick={() => router.back()}
            aria-label={copy.back}
            className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white transition-colors hover:bg-black/50 lg:left-4 lg:top-4 lg:h-10 lg:w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="absolute inset-x-4 bottom-3 lg:bottom-4">
            <span
              className="inline-flex rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: speciesColor }}
            >
              {observation.confidence.toFixed(1)}% confidence
            </span>
            <h1 className="mt-1.5 text-xl font-semibold text-white lg:mt-2 lg:text-2xl">{detectedSpecies}</h1>
            <p className="mt-1 hidden text-sm font-medium text-white/80 lg:block">{observation.location}</p>
          </div>
        </section>

        <main className="grid gap-3 px-4 py-1 pb-4 lg:grid-cols-2 lg:content-start lg:gap-4 lg:p-0">
          <section className="rounded-lg border bg-card p-3 shadow-sm lg:p-5">
            <div className="mb-2 flex items-center gap-2.5 lg:mb-4 lg:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary lg:h-9 lg:w-9">
                <Sprout className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold lg:text-base">{copy.detectionResult}</h2>
            </div>
            <DetailRow label={copy.detectedSpecies}>
              <Link
                href={speciesHref}
                className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
              >
                {detectedSpecies}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </DetailRow>
            {plantDetail?.family && <DetailRow label={copy.family}>{plantDetail.family}</DetailRow>}
            <DetailRow label={copy.confidence}>{observation.confidence.toFixed(1)}%</DetailRow>
            <DetailRow label={copy.identifiedAt}>{observation.identifiedAt}</DetailRow>
          </section>

          <section className="rounded-lg border bg-card p-3 shadow-sm lg:p-5">
            <div className="mb-2 flex items-center gap-2.5 lg:mb-4 lg:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary lg:h-9 lg:w-9">
                <MapPin className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold lg:text-base">{copy.location}</h2>
            </div>
            <DetailRow label={copy.latitude}>{observation.lat.toFixed(8)}</DetailRow>
            <DetailRow label={copy.longitude}>{observation.lng.toFixed(8)}</DetailRow>
            <div className="hidden lg:block">
              <DetailRow label={copy.elevation}>{observation.elevation} m dpl</DetailRow>
              <DetailRow label={copy.capturedLocation}>{observation.location}</DetailRow>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-3 shadow-sm lg:col-span-2 lg:p-5">
            <div className="mb-2 flex items-center gap-2.5 lg:mb-4 lg:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary lg:h-9 lg:w-9">
                <ImageIcon className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold lg:text-base">{copy.imageInfo}</h2>
            </div>
            <DetailRow label={copy.file}>{observation.imageFile}</DetailRow>
            <DetailRow label={copy.size}>{observation.imageSize}</DetailRow>
            <DetailRow label={copy.source}>
              <ExternalSourceText value={observation.source} />
            </DetailRow>
            {plantDetail?.source && (
              <DetailRow label={copy.source}>
                <ExternalSourceText value={plantDetail.source} />
              </DetailRow>
            )}
            {plantDetail?.imageSource && (
              <DetailRow label={copy.imageSource}>
                <ExternalSourceText value={plantDetail.imageSource} />
              </DetailRow>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
