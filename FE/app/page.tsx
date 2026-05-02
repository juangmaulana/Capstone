"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Camera } from "lucide-react";
import { CameraSearchDialog } from "@/components/CameraSearchDialog";
import { useRouter } from "next/navigation";

const SPECIES_LIST = [
  "Acacia nilotica",
  "Ageratum conyzoides",
  "Chromolaena odorata",
  "Lantana camara",
  "Mikania micrantha",
];

export default function Dashboard() {
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e?: React.FormEvent, queryOverride?: string) => {
    if (e) e.preventDefault();
    const query = queryOverride || searchQuery;
    if (query.trim()) {
      const id = query.trim().toLowerCase().replace(/\s+/g, '-');
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

  const filteredSpecies = SPECIES_LIST.filter(species =>
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
              BioWatch | Invasive Alien Species Monitoring
            </p>
            <h1 className="mb-8 text-4xl font-bold leading-tight tracking-tight text-white drop-shadow-md sm:text-5xl lg:text-6xl">
              Free and open access to<br />biodiversity data
            </h1>

            <div className="w-full max-w-2xl relative" ref={dropdownRef}>
              {/* Search Bar */}
              <form onSubmit={handleSearch} className={`flex w-full items-center bg-white shadow-lg ${isDropdownOpen ? 'rounded-t-2xl' : 'rounded-full'}`}>
                <div className="pl-5 flex items-center justify-center text-gray-400">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search species..."
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
                  title="Search by image (like Google Lens)"
                >
                  <Camera className="h-5 w-5" />
                </button>
              </form>

              {/* Dropdown */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-full bg-white rounded-b-2xl shadow-xl border-t border-gray-100 py-2 z-50">
                  {filteredSpecies.length > 0 ? (
                    filteredSpecies.map(sp => (
                      <div
                        key={sp}
                        className="flex items-center px-5 py-3 hover:bg-gray-100 cursor-pointer text-gray-700 hover:text-gray-900 transition-colors"
                        onClick={() => {
                          setSearchQuery(sp);
                          handleSearch(undefined, sp);
                        }}
                      >
                        <Search className="h-4 w-4 mr-3 text-gray-400" />
                        {sp}
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-3 text-gray-500">No species found</div>
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
          <h2 className="text-2xl font-bold text-white mb-2">Peta Taman Nasional Baluran</h2>
        </div>

        <div className="space-y-8 pb-12">
          {[
            {
              title: "Peta Titik Api",
              subtitle: "2019 – 2025",
              src: "/peta-titik-api-baluran-2019-2025.jpg",
              description: "Sebaran titik api (hotspot) di kawasan Taman Nasional Baluran",
            },
            {
              title: "Peta LST",
              subtitle: "2025",
              src: "/peta-lst-baluran-2025.jpg",
              description: "Land Surface Temperature — distribusi suhu permukaan tanah",
            },
            {
              title: "Peta Indeks Vegetasi",
              subtitle: "2025",
              src: "/peta-indeks-vegetasi-baluran-2025.jpg",
              description: "NDVI — tingkat kerapatan vegetasi di kawasan Baluran",
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
