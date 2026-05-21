"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Camera, Loader2 } from "lucide-react";
import { CameraSearchDialog } from "@/components/CameraSearchDialog";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { createScientificNameSlug, getScientificNameWithAuthor } from "@/lib/plant/scientific-name-author";

interface PlantSearchRecord {
  scientificName?: string;
  scientific_name?: string;
}

const COPY = {
  en: {
    eyebrow: "Bio-Inspector | Invasive Alien Species Monitoring",
    headline: <>Free and open access to<br />biodiversity data in Baluran</>,
    searchPlaceholder: "Search species...",
    cameraTitle: "Search by image (like Google Lens)",
    loadingSpecies: "Loading species data...",
    noSpecies: "No species found",
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
    headline: <>Akses bebas dan terbuka untuk<br />data biodiversitas di Baluran</>,
    searchPlaceholder: "Cari spesies...",
    cameraTitle: "Cari dengan gambar (seperti Google Lens)",
    loadingSpecies: "Memuat data spesies...",
    noSpecies: "Spesies tidak ditemukan",
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
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const copy = COPY[language];

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
            <h1 className="mb-8 text-4xl font-bold leading-tight tracking-tight text-white drop-shadow-md sm:text-5xl lg:text-6xl">
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
                <div className="absolute left-0 top-full z-50 max-h-[min(36dvh,22rem)] w-full overflow-y-auto overscroll-contain rounded-b-2xl border-t border-gray-100 bg-white py-1.5 shadow-xl sm:max-h-[min(42dvh,22rem)]">
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
                <img
                  src={map.src}
                  alt={map.title}
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
