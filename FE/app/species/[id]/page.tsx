"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Leaf, Network, Map as MapIcon, ThermometerSun, FileText, Image as ImageIcon, Loader2 } from "lucide-react";

// Taxonomy data for the 5 invasive species
const TAXONOMY_DB: Record<string, { rank: string; value: string }[]> = {
  "vachellia nilotica": [
    { rank: "Kerajaan", value: "Plantae" },
    { rank: "Filum", value: "Tracheophyta" },
    { rank: "Kelas", value: "Magnoliopsida" },
    { rank: "Ordo", value: "Fabales" },
    { rank: "Famili", value: "Fabaceae" },
    { rank: "Genus", value: "Vachellia" },
    { rank: "Spesies", value: "V. nilotica" },
  ],
  "lantana camara": [
    { rank: "Kerajaan", value: "Plantae" },
    { rank: "Filum", value: "Tracheophyta" },
    { rank: "Kelas", value: "Magnoliopsida" },
    { rank: "Ordo", value: "Lamiales" },
    { rank: "Famili", value: "Verbenaceae" },
    { rank: "Genus", value: "Lantana" },
    { rank: "Spesies", value: "L. camara" },
  ],
  "merremia hederacea": [
    { rank: "Kerajaan", value: "Plantae" },
    { rank: "Filum", value: "Tracheophyta" },
    { rank: "Kelas", value: "Magnoliopsida" },
    { rank: "Ordo", value: "Solanales" },
    { rank: "Famili", value: "Convolvulaceae" },
    { rank: "Genus", value: "Merremia" },
    { rank: "Spesies", value: "M. hederacea" },
  ],
  "clitoria ternatea": [
    { rank: "Kerajaan", value: "Plantae" },
    { rank: "Filum", value: "Tracheophyta" },
    { rank: "Kelas", value: "Magnoliopsida" },
    { rank: "Ordo", value: "Fabales" },
    { rank: "Famili", value: "Fabaceae" },
    { rank: "Genus", value: "Clitoria" },
    { rank: "Spesies", value: "C. ternatea" },
  ],
  "ageratum conyzoides": [
    { rank: "Kerajaan", value: "Plantae" },
    { rank: "Filum", value: "Tracheophyta" },
    { rank: "Kelas", value: "Magnoliopsida" },
    { rank: "Ordo", value: "Asterales" },
    { rank: "Famili", value: "Asteraceae" },
    { rank: "Genus", value: "Ageratum" },
    { rank: "Spesies", value: "A. conyzoides" },
  ],
};

interface PlantData {
  id: number;
  commonName: string;
  scientificName: string;
  family: string;
  genus: string;
  botanicalDescription: string;
  ecologicalInformation: string;
  environmentalImpact: string;
  imagePath: string;
}

const HERBARIUM_IMAGE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "/sketsa-herbarium-acacia-nilotica.gif": { width: 376, height: 563 },
  "/sketsa-herbarium-lantana-camara.jpg": { width: 1985, height: 2810 },
  "/sketsa-herbarium-merremia-hederacea.jpg": { width: 1985, height: 2810 },
  "/sketsa-herbarium-clitoria-ternatea.jpg": { width: 2474, height: 2029 },
  "/sketsa-herbarium-Ageratum-conyzoides.webp": { width: 850, height: 1109 },
};

// Fallback data for species not yet in the database
const FALLBACK_PLANTS: Record<string, PlantData> = {
  "merremia hederacea": {
    id: 901,
    commonName: "Kangkung Pagar",
    scientificName: "Merremia hederacea",
    family: "Convolvulaceae",
    genus: "Merremia",
    botanicalDescription: "Tanaman merambat herba tahunan dari keluarga Convolvulaceae. Daun berbentuk jantung hingga berlekuk 3-5 jari, tipis, dan berwarna hijau cerah. Bunga berbentuk corong berwarna kuning pucat hingga putih. Buah kapsul membulat berisi biji kecil.",
    ecologicalInformation: "Tumbuh agresif di tepi hutan, lahan terbuka, dan area terganggu di kawasan tropis. Merremia hederacea merambat cepat menutupi vegetasi bawah dan mampu memanjat pohon hingga menaungi tajuknya.",
    environmentalImpact: "Menutupi tanaman asli sehingga menghambat fotosintesis, menekan regenerasi alami hutan, dan mengubah struktur vegetasi di sabana dan tepi hutan Taman Nasional Baluran.",
    imagePath: "/sketsa-herbarium-merremia-hederacea.jpg",
  },
  "clitoria ternatea": {
    id: 902,
    commonName: "Telang",
    scientificName: "Clitoria ternatea",
    family: "Fabaceae",
    genus: "Clitoria",
    botanicalDescription: "Tanaman merambat herba perennial dari keluarga Fabaceae. Daun majemuk menyirip ganjil dengan 5-7 anak daun. Bunga berbentuk kupu-kupu berwarna biru tua hingga ungu, kadang putih. Polong pipih berisi biji berbentuk ginjal.",
    ecologicalInformation: "Tumbuh di daerah tropis dan subtropis, toleran terhadap berbagai jenis tanah. Di Taman Nasional Baluran, tanaman ini menyebar di area sabana dan pinggiran hutan, bersaing dengan vegetasi asli untuk mendapatkan sinar matahari dan nutrisi.",
    environmentalImpact: "Mampu menekan pertumbuhan rumput asli melalui naungan yang padat, mengubah komposisi vegetasi sabana, dan mengganggu ketersediaan pakan bagi herbivora asli seperti Banteng Jawa.",
    imagePath: "/sketsa-herbarium-clitoria-ternatea.jpg",
  },
};

export default function SpeciesPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "lantana-camara";

  const [plant, setPlant] = useState<PlantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlant() {
      setIsLoading(true);
      setError(null);
      try {
        // Convert slug to search query (e.g. "acacia-nilotica" -> "Acacia nilotica")
        const searchTerm = id.replace(/-/g, " ").trim();
        let res = await fetch(`/api/v1/plants?search=${encodeURIComponent(searchTerm)}&limit=1`);
        let json = await res.json();

        // If no exact match, try a broader search with just the first word (usually the Genus)
        if (!(json.success && json.data && json.data.length > 0)) {
          const firstWord = searchTerm.split(" ")[0];
          if (firstWord && firstWord.length > 2) {
            res = await fetch(`/api/v1/plants?search=${encodeURIComponent(firstWord)}&limit=1`);
            json = await res.json();
          }
        }

        if (json.success && json.data && json.data.length > 0) {
          const p = json.data[0];
          setPlant({
            id: p.id,
            commonName: p.commonName || p.common_name || "",
            scientificName: p.scientificName || p.scientific_name || "",
            family: p.family || "",
            genus: p.genus || "",
            botanicalDescription: p.botanicalDescription || p.botanical_description || p.description || "",
            ecologicalInformation: p.ecologicalInformation || p.ecological_information || p.ecology || "",
            environmentalImpact: p.environmentalImpact || p.environmental_impact || "",
            imagePath: p.imagePath || p.image_path || "",
          });
        } else {
          // Try fallback data for species not yet in the database
          const fallback = FALLBACK_PLANTS[searchTerm.toLowerCase()];
          if (fallback) {
            setPlant(fallback);
          } else {
            setError("Spesies tidak ditemukan dalam database.");
          }
        }
      } catch (err) {
        console.error("Failed to fetch plant:", err);
        // Try fallback on network error too
        const searchTerm = id.replace(/-/g, " ").trim();
        const fallback = FALLBACK_PLANTS[searchTerm.toLowerCase()];
        if (fallback) {
          setPlant(fallback);
        } else {
          setError("Gagal memuat data spesies.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlant();
  }, [id]);

  // Get taxonomy for the species
  const taxonomy = plant
    ? TAXONOMY_DB[plant.scientificName.toLowerCase()] || [
        { rank: "Kerajaan", value: "Plantae" },
        { rank: "Famili", value: plant.family },
        { rank: "Genus", value: plant.genus },
        { rank: "Spesies", value: plant.scientificName },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/20 p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat data spesies...</p>
        </div>
      </div>
    );
  }

  if (error || !plant) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-muted/20 p-8">
        <p className="text-lg font-semibold text-muted-foreground">{error || "Spesies tidak ditemukan"}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-muted/20 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-background border shadow-sm hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold md:text-3xl italic">{plant.scientificName}</h1>
          <p className="text-sm text-muted-foreground">{plant.commonName}</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <div className="flex flex-col gap-6">

          {/* Description */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Keterangan Spesies</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Deskripsi Botani</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{plant.botanicalDescription}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Informasi Ekologi</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{plant.ecologicalInformation}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Dampak Lingkungan</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{plant.environmentalImpact}</p>
              </div>
            </div>
          </div>

          {/* Sketch */}
          {plant.imagePath && (
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
                <ImageIcon className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">Sketsa Herbarium</h2>
              </div>
              <div
                className="relative w-full overflow-hidden bg-white"
                style={{
                  aspectRatio: HERBARIUM_IMAGE_DIMENSIONS[plant.imagePath]
                    ? `${HERBARIUM_IMAGE_DIMENSIONS[plant.imagePath].width} / ${HERBARIUM_IMAGE_DIMENSIONS[plant.imagePath].height}`
                    : "4 / 5",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={plant.imagePath}
                  alt={`Herbarium sketch of ${plant.scientificName}`}
                  className="block h-full w-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Taxonomy */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
              <Network className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Taksonomi Tanaman</h2>
            </div>
            <div className="p-4">
              <div className="flex flex-col space-y-2">
                {taxonomy.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1 border-b last:border-0 border-muted">
                    <span className="text-muted-foreground">{item.rank}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
