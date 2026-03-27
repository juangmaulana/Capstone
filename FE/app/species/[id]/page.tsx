"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Leaf, Network, Map as MapIcon, ThermometerSun, FileText, Image as ImageIcon } from "lucide-react";

const SPECIES_DB: Record<string, any> = {
  "acacia-nilotica": {
    name: "Acacia nilotica",
    commonName: "Babul / Gum Arabic Tree",
    description: "Acacia nilotica is an invasive woody weed in Baluran National Park, where it was originally introduced as a firebreak. It has since aggressively spread across the Bekol savanna, forming dense thickets that suppress the growth of native grasses essential for local herbivores like the Javan Banteng.",
    taxonomy: [
      { rank: "Kingdom", value: "Plantae" },
      { rank: "Phylum", value: "Tracheophyta" },
      { rank: "Class", value: "Magnoliopsida" },
      { rank: "Order", value: "Fabales" },
      { rank: "Family", value: "Fabaceae" },
      { rank: "Genus", value: "Vachellia" },
      { rank: "Species", value: "V. nilotica" },
    ],
    herbariumSketch: "/sketsa-herbarium-acacia-nilotica.gif",
  },
  "lantana-camara": {
    name: "Lantana camara",
    commonName: "Tembelekan / Tickberry",
    description: "Lantana camara is a highly invasive alien species in many tropical and subtropical regions. It forms dense, impenetrable thickets that outcompete native flora, alter fire regimes, and severely reduce grazing land for wildlife such as the Javan Banteng in savannas.",
    taxonomy: [
      { rank: "Kingdom", value: "Plantae" },
      { rank: "Phylum", value: "Tracheophyta" },
      { rank: "Class", value: "Magnoliopsida" },
      { rank: "Order", value: "Lamiales" },
      { rank: "Family", value: "Verbenaceae" },
      { rank: "Genus", value: "Lantana" },
      { rank: "Species", value: "L. camara" },
    ],
    herbariumSketch: "/sketsa-herbarium-lantana-camara.jpg",
  },
  "mikania-micrantha": {
    name: "Mikania micrantha",
    commonName: "Sembung Rambat / Bitter Vine",
    description: "Known as the 'mile-a-minute' weed, Mikania micrantha is an extremely fast-growing perennial creeping vine. It is a severe threat to tropical ecosystems as it rapidly climbs over other plants and trees, smothering them and blocking sunlight, which can lead to the death of the underlying vegetation.",
    taxonomy: [
      { rank: "Kingdom", value: "Plantae" },
      { rank: "Phylum", value: "Tracheophyta" },
      { rank: "Class", value: "Magnoliopsida" },
      { rank: "Order", value: "Asterales" },
      { rank: "Family", value: "Asteraceae" },
      { rank: "Genus", value: "Mikania" },
      { rank: "Species", value: "M. micrantha" },
    ],
    herbariumSketch: "/sketsa-herbarium-Mikania-micrantha.jpg",
  },
  "chromolaena-odorata": {
    name: "Chromolaena odorata",
    commonName: "Kirinyuh / Siam Weed",
    description: "Chromolaena odorata is a rapidly growing perennial shrub and a highly destructive invasive weed in tropical regions. It aggressively invades forest margins, savannas, and agricultural lands, suppressing native plant growth through competition and allelopathy. It is also highly flammable.",
    taxonomy: [
      { rank: "Kingdom", value: "Plantae" },
      { rank: "Phylum", value: "Tracheophyta" },
      { rank: "Class", value: "Magnoliopsida" },
      { rank: "Order", value: "Asterales" },
      { rank: "Family", value: "Asteraceae" },
      { rank: "Genus", value: "Chromolaena" },
      { rank: "Species", value: "C. odorata" },
    ],
    herbariumSketch: "/sketsa-herbarium-Chromolaena-odorata.webp",
  },
  "ageratum-conyzoides": {
    name: "Ageratum conyzoides",
    commonName: "Bandotan / Billygoat Weed",
    description: "Ageratum conyzoides is an annual herbaceous weed notorious for its high seed production and adaptability. It frequently invades disturbed lands, agricultural fields, and natural ecosystems. It produces allelopathic chemicals that inhibit the growth of surrounding native plants and can be toxic to grazing animals.",
    taxonomy: [
      { rank: "Kingdom", value: "Plantae" },
      { rank: "Phylum", value: "Tracheophyta" },
      { rank: "Class", value: "Magnoliopsida" },
      { rank: "Order", value: "Asterales" },
      { rank: "Family", value: "Asteraceae" },
      { rank: "Genus", value: "Ageratum" },
      { rank: "Species", value: "A. conyzoides" },
    ],
    herbariumSketch: "/sketsa-herbarium-Ageratum-conyzoides.webp",
  }
};

const getMockData = (id: string) => {
  const normId = id.toLowerCase().trim();
  if (SPECIES_DB[normId]) {
    return SPECIES_DB[normId];
  }

  // Fallback if not found
  const formattedId = id.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  return {
    name: formattedId === "Search" ? "Lantana camara" : formattedId,
    commonName: "Unknown Species",
    description: "No description available for this species yet. Please check back later or update the database.",
    taxonomy: [
      { rank: "Kingdom", value: "Unknown" },
    ],
  };
};

export default function SpeciesPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "lantana-camara";

  const species = getMockData(id);

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
          <h1 className="text-2xl font-bold md:text-3xl italic">{species.name}</h1>
          <p className="text-sm text-muted-foreground">{species.commonName}</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <div className="flex flex-col gap-6">

          {/* Sketch */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
              <ImageIcon className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Sketsa Herbarium</h2>
            </div>
            <div className="relative aspect-[3/4] w-full bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={species.herbariumSketch}
                alt={`Herbarium sketch of ${species.name}`}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Taxonomy */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
              <Network className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Taksonomi Tanaman</h2>
            </div>
            <div className="p-4">
              <div className="flex flex-col space-y-2">
                {species.taxonomy.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm py-1 border-b last:border-0 border-muted">
                    <span className="text-muted-foreground">{item.rank}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Keterangan Spesies</h2>
            </div>
            <div className="p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {species.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
