"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Camera, Loader2, CalendarClock, Database, MapPinned, ScanSearch, Sprout } from "lucide-react";
import { CameraSearchDialog } from "@/components/CameraSearchDialog";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchMapObservations, type MapObservation } from "@/lib/map-observations";
import { createScientificNameSlug, getScientificNameWithAuthor } from "@/lib/plant/scientific-name-author";

interface PlantSearchRecord {
  scientificName?: string;
  scientific_name?: string;
}

const COPY = {
  en: {
    eyebrow: "Bio-Inspector | Invasive Alien Species Monitoring",
    headline: <>Free and open access to<br />biodiversity data</>,
    searchPlaceholder: "Search species...",
    cameraTitle: "Search by image (like Google Lens)",
    loadingSpecies: "Loading species data...",
    noSpecies: "No species found",
    stats: {
      records: "IAS records",
      species: "Detected species",
      hotspots: "Monitored locations",
      latest: "Latest observation",
      confidence: "AI detection confidence",
    },
    mapSectionTitle: "Baluran National Park Maps",
    mapItems: [
      {
        title: "Fire Hotspot Map",
        subtitle: "2019 – 2025",
        description: "Distribution of fire hotspots in Baluran National Park",
      },
      {
        title: "LST Map",
        subtitle: "2025",
        description: "Land Surface Temperature — surface temperature distribution",
      },
      {
        title: "Vegetation Index Map",
        subtitle: "2025",
        description: "NDVI — vegetation density level in the Baluran area",
      },
    ],
  },
  id: {
    eyebrow: "Bio-Inspector | Pemantauan Spesies Asing Invasif",
    headline: <>Akses bebas dan terbuka untuk<br />data biodiversitas</>,
    searchPlaceholder: "Cari spesies...",
    cameraTitle: "Cari dengan gambar (seperti Google Lens)",
    loadingSpecies: "Memuat data spesies...",
    noSpecies: "Spesies tidak ditemukan",
    stats: {
      records: "Record IAS",
      species: "Spesies terdeteksi",
      hotspots: "Lokasi terpantau",
      latest: "Observasi terbaru",
      confidence: "Confidence deteksi AI",
    },
    mapSectionTitle: "Peta Taman Nasional Baluran",
    mapItems: [
      {
        title: "Peta Titik Api",
        subtitle: "2019 – 2025",
        description: "Sebaran titik api (hotspot) di kawasan Taman Nasional Baluran",
      },
      {
        title: "Peta LST",
        subtitle: "2025",
        description: "Land Surface Temperature — distribusi suhu permukaan tanah",
      },
      {
        title: "Peta Indeks Vegetasi",
        subtitle: "2025",
        description: "NDVI — tingkat kerapatan vegetasi di kawasan Baluran",
      },
    ],
  },
} as const;

export default function Dashboard() {
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [speciesList, setSpeciesList] = useState<string[]>([]);
  const [observations, setObservations] = useState<MapObservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const copy = COPY[language];
  const getObservationTimestamp = (observation: MapObservation) => {
    const timestamp = new Date(observation.date).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };
  const formatObservationDate = (dateValue: string) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue === "-" ? "-" : dateValue;

    return new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };
  const detectedSpeciesCount = useMemo(
    () => new Set(observations.map((observation) => observation.species)).size,
    [observations],
  );
  const monitoredLocationCount = useMemo(
    () => new Set(observations.map((observation) => `${observation.lat.toFixed(5)},${observation.lng.toFixed(5)}`)).size,
    [observations],
  );
  const latestObservation = observations.length > 0
    ? observations.reduce((latest, observation) => getObservationTimestamp(observation) > getObservationTimestamp(latest) ? observation : latest)
    : null;
  const averageConfidence = observations.length > 0
    ? Math.round(observations.reduce((total, observation) => total + observation.confidence, 0) / observations.length)
    : 0;
  const quickStats = [
    { label: copy.stats.records, value: observations.length.toLocaleString("id-ID"), icon: Database },
    { label: copy.stats.species, value: detectedSpeciesCount.toLocaleString("id-ID"), icon: Sprout },
    { label: copy.stats.hotspots, value: monitoredLocationCount.toLocaleString("id-ID"), icon: MapPinned },
    {
      label: copy.stats.latest,
      value: latestObservation ? formatObservationDate(latestObservation.date) : "-",
      icon: CalendarClock,
    },
    { label: copy.stats.confidence, value: `${averageConfidence}%`, icon: ScanSearch },
  ];

  useEffect(() => {
    const fallbackSpecies = [
      "Vachellia nilotica (L.) P.J.H.Hurter & Mabb.",
      "Ageratum conyzoides L.",
      "Lantana camara L.",
      "Clitoria ternatea L.",
      "Merremia hederacea (Burm.f.) Hallier f.",
    ];

    async function fetchSpeciesList() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/v1/plants?limit=100");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const names = json.data
            .map((plant: PlantSearchRecord) => getScientificNameWithAuthor(plant.scientificName || plant.scientific_name || ""))
            .filter(Boolean);
          setSpeciesList(names.length > 0 ? names : fallbackSpecies);
        } else {
          setSpeciesList(fallbackSpecies);
        }
      } catch (error) {
        console.error("Failed to fetch species list:", error);
        setSpeciesList(fallbackSpecies);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSpeciesList();
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetchMapObservations()
      .then((nextObservations) => {
        if (isMounted) setObservations(nextObservations);
      })
      .catch((error) => {
        console.error("Failed to fetch map distribution stats:", error);
        if (isMounted) setObservations([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = (e?: React.FormEvent, queryOverride?: string) => {
    if (e) e.preventDefault();
    const query = queryOverride || searchQuery;
    if (query.trim()) {
      const id = createScientificNameSlug(query);
      router.push(`/species/${id}`);
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSpecies = speciesList.filter(species =>
    species.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full flex flex-col bg-gray-900">
      {/* Hero section — fills the full viewport minus navbar */}
      <div
        className="relative flex h-[calc(100vh-64px)] w-full flex-col justify-center overflow-hidden"
        style={{
          backgroundImage: 'url("/fb15b7a4-566e-4937-a66a-b4ea0e746ab0.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/10" />

        <div className="relative z-10 w-full px-8 md:px-16 lg:px-24 xl:px-32">
          <div className="max-w-4xl">
            <p className="mb-4 text-sm font-semibold tracking-wide text-white drop-shadow-md">
              {copy.eyebrow}
            </p>
            <h1 className="mb-8 text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-md sm:text-4xl lg:text-5xl">
              {copy.headline}
            </h1>

            <div className="w-full max-w-2xl relative" ref={dropdownRef}>
              {/* Search Bar */}
              <form onSubmit={handleSearch} className={`flex w-full items-center bg-white shadow-lg ${isDropdownOpen ? 'rounded-t-2xl' : 'rounded-full'}`}>
                <div className="pl-5 flex items-center justify-center text-gray-400">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  placeholder={copy.searchPlaceholder}
                  value={searchQuery}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  className="h-14 w-full bg-transparent px-3 text-gray-900 outline-none placeholder:text-gray-500"
                />
                <button
                  type="button"
                  className="flex h-14 w-12 shrink-0 items-center justify-center text-gray-600 hover:text-black transition-colors"
                  aria-label="Upload photo"
                  onClick={() => setIsCameraDialogOpen(true)}
                  title={copy.cameraTitle}
                >
                  <Camera className="h-5 w-5" />
                </button>
              </form>

              {/* Dropdown */}
              {isDropdownOpen && (
                <div className="absolute left-0 top-full z-50 max-h-[min(28dvh,18rem)] w-full overflow-y-auto overscroll-contain rounded-b-2xl border-t border-gray-100 bg-white py-1.5 shadow-xl sm:max-h-[min(32dvh,18rem)]">
                  {isLoading ? (
                    <div className="flex items-center justify-center px-5 py-2.5 text-gray-500">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {copy.loadingSpecies}
                    </div>
                  ) : filteredSpecies.length > 0 ? (
                    filteredSpecies.map(sp => (
                      <div
                        key={sp}
                        className="flex min-h-11 cursor-pointer items-center px-5 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:min-h-12 sm:text-base"
                        onClick={() => {
                          setSearchQuery(sp);
                          handleSearch(undefined, sp);
                        }}
                      >
                        <Search className="mr-3 h-4 w-4 shrink-0 text-gray-400" />
                        <span className="min-w-0 truncate">{sp}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-2.5 text-gray-500">{copy.noSpecies}</div>
                  )}
                </div>
              )}

              <CameraSearchDialog
                open={isCameraDialogOpen}
                onOpenChange={setIsCameraDialogOpen}
              />
            </div>
          </div>
        </div>

      </div>

      <section className="w-full bg-white px-6 py-12 text-gray-700 md:px-12 md:py-16 lg:px-20">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-5">
          {quickStats.map((stat) => (
            <div key={stat.label} className="flex min-w-0 flex-col items-center text-center">
              <div className="mb-5 grid h-20 w-20 place-items-center rounded-full bg-green-50">
                <stat.icon className="h-10 w-10 text-green-700" strokeWidth={1.6} />
              </div>
              <p className="text-2xl font-semibold leading-none text-gray-700 md:text-3xl">{stat.value}</p>
              <p className="mt-3 max-w-44 text-sm font-medium leading-snug text-gray-500 md:text-base">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Map Assets Section — below the hero, visible on scroll */}
      <div className="relative z-10 w-full bg-gray-950">
        <div className="px-8 md:px-16 lg:px-24 xl:px-32 pt-12 pb-6">
          <h2 className="text-2xl font-bold text-white mb-2">{copy.mapSectionTitle}</h2>
        </div>

        <div className="space-y-8 pb-12">
          {[
            {
              title: copy.mapItems[0].title,
              subtitle: copy.mapItems[0].subtitle,
              src: "/peta-titik-api-baluran-2019-2025.jpg",
              description: copy.mapItems[0].description,
            },
            {
              title: copy.mapItems[1].title,
              subtitle: copy.mapItems[1].subtitle,
              src: "/peta-lst-baluran-2025.jpg",
              description: copy.mapItems[1].description,
            },
            {
              title: copy.mapItems[2].title,
              subtitle: copy.mapItems[2].subtitle,
              src: "/peta-indeks-vegetasi-baluran-2025.jpg",
              description: copy.mapItems[2].description,
            },
          ].map((map) => (
            <div key={map.title} className="group relative">
              {/* Title bar */}
              <div className="flex items-center justify-between px-8 md:px-16 lg:px-24 xl:px-32 py-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">{map.title}</h3>
                  <span className="text-xs font-medium text-green-400 bg-green-400/10 rounded-full px-2.5 py-0.5">{map.subtitle}</span>
                </div>
                <p className="text-xs text-gray-500 hidden sm:block">{map.description}</p>
              </div>
              {/* Full-width map image */}
              <div className="w-full overflow-hidden bg-gray-900 border-y border-white/5">
                <Image
                  src={map.src}
                  alt={map.title}
                  width={1920}
                  height={1080}
                  sizes="100vw"
                  className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
