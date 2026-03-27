"use client";

import { useState } from "react";
import { Search, Camera } from "lucide-react";
import { CameraSearchDialog } from "@/components/CameraSearchDialog";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      const id = searchQuery.trim().toLowerCase().replace(/\s+/g, '-');
      router.push(`/species/${id}`);
    }
  };

  return (
    <div
      className="relative flex h-[calc(100vh-64px)] w-full flex-col justify-center overflow-hidden bg-gray-900"
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

          <div className="w-full max-w-2xl">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex w-full items-center bg-white shadow-lg">
              <input
                type="text"
                placeholder="Search species..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 w-full bg-transparent px-5 text-gray-900 outline-none placeholder:text-gray-500"
              />
              <button
                type="button"
                className="flex h-14 w-14 shrink-0 items-center justify-center text-gray-600 hover:text-black transition-colors"
                aria-label="Upload photo"
                onClick={() => setIsCameraDialogOpen(true)}
                title="Search by image (like Google Lens)"
              >
                <Camera className="h-5 w-5" />
              </button>
              <button
                type="submit"
                className="flex h-14 w-14 shrink-0 items-center justify-center text-gray-600 hover:text-black transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>

            <CameraSearchDialog
              open={isCameraDialogOpen}
              onOpenChange={setIsCameraDialogOpen}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
