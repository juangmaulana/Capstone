"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Leaf, Network, Map as MapIcon, ThermometerSun, FileText, Image as ImageIcon } from "lucide-react";

const SPECIES_DB: Record<string, any> = {
  "acacia-nilotica": {
    name: "Acacia nilotica",
    commonName: "Babul / Gum Arabic Tree",
    description: "Acacia nilotica adalah gulma berkayu invasif di Taman Nasional Baluran, di mana awalnya diperkenalkan sebagai sekat bakar. Sejak itu ia menyebar secara agresif di sabana Bekol, membentuk semak belukar padat yang menekan pertumbuhan rumput asli yang penting bagi herbivora lokal seperti Banteng Jawa.",
    taxonomy: [
      { rank: "Kerajaan", value: "Plantae" },
      { rank: "Filum", value: "Tracheophyta" },
      { rank: "Kelas", value: "Magnoliopsida" },
      { rank: "Ordo", value: "Fabales" },
      { rank: "Famili", value: "Fabaceae" },
      { rank: "Genus", value: "Vachellia" },
      { rank: "Spesies", value: "V. nilotica" },
    ],
    herbariumSketch: "/sketsa-herbarium-acacia-nilotica.gif",
  },
  "lantana-camara": {
    name: "Lantana camara",
    commonName: "Tembelekan / Tickberry",
    description: "Lantana camara adalah spesies asing yang sangat invasif di banyak daerah tropis dan subtropis. Tanaman ini membentuk semak belukar yang padat dan tak tertembus yang mengalahkan flora asli, mengubah rezim kebakaran, dan sangat mengurangi lahan penggembalaan bagi satwa liar seperti Banteng Jawa di sabana.",
    taxonomy: [
      { rank: "Kerajaan", value: "Plantae" },
      { rank: "Filum", value: "Tracheophyta" },
      { rank: "Kelas", value: "Magnoliopsida" },
      { rank: "Ordo", value: "Lamiales" },
      { rank: "Famili", value: "Verbenaceae" },
      { rank: "Genus", value: "Lantana" },
      { rank: "Spesies", value: "L. camara" },
    ],
    herbariumSketch: "/sketsa-herbarium-lantana-camara.jpg",
  },
  "mikania-micrantha": {
    name: "Mikania micrantha",
    commonName: "Sembung Rambat / Bitter Vine",
    description: "Dikenal sebagai gulma 'satu mil per menit', Mikania micrantha adalah tanaman rambat tahunan yang tumbuh sangat cepat. Tanaman ini merupakan ancaman serius bagi ekosistem tropis karena ia dengan cepat memanjat tanaman dan pohon lain, mencekik mereka dan menghalangi sinar matahari, yang dapat menyebabkan kematian vegetasi di bawahnya.",
    taxonomy: [
      { rank: "Kerajaan", value: "Plantae" },
      { rank: "Filum", value: "Tracheophyta" },
      { rank: "Kelas", value: "Magnoliopsida" },
      { rank: "Ordo", value: "Asterales" },
      { rank: "Famili", value: "Asteraceae" },
      { rank: "Genus", value: "Mikania" },
      { rank: "Spesies", value: "M. micrantha" },
    ],
    herbariumSketch: "/sketsa-herbarium-Mikania-micrantha.jpg",
  },
  "chromolaena-odorata": {
    name: "Chromolaena odorata",
    commonName: "Kirinyuh / Siam Weed",
    description: "Chromolaena odorata adalah semak tahunan yang tumbuh cepat dan gulma invasif yang sangat merusak di daerah tropis. Tanaman ini secara agresif menyerang tepi hutan, sabana, dan lahan pertanian, menekan pertumbuhan tanaman asli melalui persaingan dan alelopati. Tanaman ini juga sangat mudah terbakar.",
    taxonomy: [
      { rank: "Kerajaan", value: "Plantae" },
      { rank: "Filum", value: "Tracheophyta" },
      { rank: "Kelas", value: "Magnoliopsida" },
      { rank: "Ordo", value: "Asterales" },
      { rank: "Famili", value: "Asteraceae" },
      { rank: "Genus", value: "Chromolaena" },
      { rank: "Spesies", value: "C. odorata" },
    ],
    herbariumSketch: "/sketsa-herbarium-Chromolaena-odorata.webp",
  },
  "ageratum-conyzoides": {
    name: "Ageratum conyzoides",
    commonName: "Bandotan / Billygoat Weed",
    description: "Ageratum conyzoides adalah gulma herba tahunan yang terkenal karena produksi bijinya yang tinggi dan kemampuan beradaptasinya. Tanaman ini sering menyerang lahan yang terganggu, ladang pertanian, dan ekosistem alami. Ia menghasilkan bahan kimia alelopati yang menghambat pertumbuhan tanaman asli di sekitarnya dan bisa menjadi racun bagi hewan pemakan rumput.",
    taxonomy: [
      { rank: "Kerajaan", value: "Plantae" },
      { rank: "Filum", value: "Tracheophyta" },
      { rank: "Kelas", value: "Magnoliopsida" },
      { rank: "Ordo", value: "Asterales" },
      { rank: "Famili", value: "Asteraceae" },
      { rank: "Genus", value: "Ageratum" },
      { rank: "Spesies", value: "A. conyzoides" },
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
    commonName: "Spesies Tidak Diketahui",
    description: "Belum ada keterangan untuk spesies ini. Silakan periksa kembali nanti atau perbarui basis data.",
    taxonomy: [
      { rank: "Kerajaan", value: "Tidak Diketahui" },
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
        </div>
      </div>
    </div>
  );
}
