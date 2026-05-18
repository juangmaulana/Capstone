"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Network, FileText, Image as ImageIcon, Loader2, Pencil } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  botanicalDescriptionEn?: string;
  botanicalDescriptionId?: string;
  ecologicalInformation: string;
  ecologicalInformationEn?: string;
  ecologicalInformationId?: string;
  environmentalImpact: string;
  environmentalImpactEn?: string;
  environmentalImpactId?: string;
  imagePath: string;
}

interface PlantApiRecord {
  id: number;
  commonName?: string;
  common_name?: string;
  scientificName?: string;
  scientific_name?: string;
  family?: string;
  genus?: string;
  botanicalDescription?: string;
  botanical_description?: string;
  botanicalDescriptionEn?: string;
  botanical_description_en?: string;
  botanicalDescriptionId?: string;
  botanical_description_id?: string;
  ecologicalInformation?: string;
  ecological_information?: string;
  ecologicalInformationEn?: string;
  ecological_information_en?: string;
  ecologicalInformationId?: string;
  ecological_information_id?: string;
  environmentalImpact?: string;
  environmental_impact?: string;
  environmentalImpactEn?: string;
  environmental_impact_en?: string;
  environmentalImpactId?: string;
  environmental_impact_id?: string;
  description?: string;
  ecology?: string;
  imagePath?: string;
  image_path?: string;
}

const SPECIES_SOURCE_STORAGE_PREFIX = "biowatch_species_source_";

const createSpeciesSlug = (scientificName: string) =>
  scientificName.trim().toLowerCase().replace(/\s+/g, "-");

const getSpeciesSourceStorageKey = (speciesId: number, scientificName: string) =>
  speciesId > 0 ? `${SPECIES_SOURCE_STORAGE_PREFIX}${speciesId}` : `${SPECIES_SOURCE_STORAGE_PREFIX}tmp_${createSpeciesSlug(scientificName)}`;

const readStoredSpeciesSourceText = (speciesId: number, scientificName: string) => {
  if (typeof window === "undefined") return "";

  try {
    const primaryKey = getSpeciesSourceStorageKey(speciesId, scientificName);
    const fallbackKey = `${SPECIES_SOURCE_STORAGE_PREFIX}tmp_${createSpeciesSlug(scientificName)}`;
    const raw = localStorage.getItem(primaryKey) || localStorage.getItem(fallbackKey);
    if (!raw) return "";

    const parsed = JSON.parse(raw) as string;
    return typeof parsed === "string" ? parsed : raw;
  } catch {
    return "";
  }
};

const writeStoredSpeciesSourceText = (speciesId: number, scientificName: string, sourceText: string) => {
  if (typeof window === "undefined") return;

  const storageKey = getSpeciesSourceStorageKey(speciesId, scientificName);
  const fallbackKey = `${SPECIES_SOURCE_STORAGE_PREFIX}tmp_${createSpeciesSlug(scientificName)}`;
  const normalizedText = sourceText.trim();

  if (!normalizedText) {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(fallbackKey);
    return;
  }

  localStorage.setItem(storageKey, JSON.stringify(normalizedText));
  if (speciesId > 0) {
    localStorage.removeItem(fallbackKey);
  }
};

const SPECIES_COPY = {
  en: {
    loading: "Loading species data...",
    notFound: "Species was not found in the database.",
    loadFailed: "Failed to load species data.",
    speciesMissing: "Species not found",
    back: "Back",
    cancel: "Cancel",
    saveSpecies: "Save Species",
    saving: "Saving...",
    editSpecies: "Edit Species",
    updateDetails: "Update the details for",
    scientificName: "Scientific Name",
    commonName: "Common Name",
    family: "Family",
    genus: "Genus",
    descriptionTitle: "Species Description",
    botanicalDescription: "Botanical Description",
    ecologicalInformation: "Ecological Information",
    environmentalImpact: "Environmental Impact",
    source: "Source",
    herbariumSketch: "Herbarium Sketch",
    taxonomy: "Plant Taxonomy",
    herbariumAlt: "Herbarium sketch of",
    sourceEmpty: "No source available.",
    ranks: {
      Kerajaan: "Kingdom",
      Filum: "Phylum",
      Kelas: "Class",
      Ordo: "Order",
      Famili: "Family",
      Genus: "Genus",
      Spesies: "Species",
    },
  },
  id: {
    loading: "Memuat data spesies...",
    notFound: "Spesies tidak ditemukan dalam database.",
    loadFailed: "Gagal memuat data spesies.",
    speciesMissing: "Spesies tidak ditemukan",
    back: "Kembali",
    cancel: "Batal",
    saveSpecies: "Simpan Spesies",
    saving: "Menyimpan...",
    editSpecies: "Edit Spesies",
    updateDetails: "Perbarui detail untuk",
    scientificName: "Nama Ilmiah",
    commonName: "Nama Umum",
    family: "Famili",
    genus: "Genus",
    descriptionTitle: "Keterangan Spesies",
    botanicalDescription: "Deskripsi Botani",
    ecologicalInformation: "Informasi Ekologi",
    environmentalImpact: "Dampak Lingkungan",
    source: "Sumber",
    herbariumSketch: "Sketsa Herbarium",
    taxonomy: "Taksonomi Tanaman",
    herbariumAlt: "Sketsa herbarium",
    sourceEmpty: "Sumber tidak tersedia.",
    ranks: {
      Kerajaan: "Kerajaan",
      Filum: "Filum",
      Kelas: "Kelas",
      Ordo: "Ordo",
      Famili: "Famili",
      Genus: "Genus",
      Spesies: "Spesies",
    },
  },
} as const;

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
    botanicalDescriptionEn: "Merremia hederacea is an annual herbaceous climber in the Convolvulaceae family. It has thin bright-green leaves that are heart-shaped to 3-5 lobed, pale yellow to white funnel-shaped flowers, and rounded capsules containing small seeds.",
    botanicalDescriptionId: "Tanaman merambat herba tahunan dari keluarga Convolvulaceae. Daun berbentuk jantung hingga berlekuk 3-5 jari, tipis, dan berwarna hijau cerah. Bunga berbentuk corong berwarna kuning pucat hingga putih. Buah kapsul membulat berisi biji kecil.",
    ecologicalInformation: "Tumbuh agresif di tepi hutan, lahan terbuka, dan area terganggu di kawasan tropis. Merremia hederacea merambat cepat menutupi vegetasi bawah dan mampu memanjat pohon hingga menaungi tajuknya.",
    ecologicalInformationEn: "Grows aggressively along forest edges, open land, and disturbed tropical areas. Merremia hederacea spreads rapidly over understory vegetation and can climb trees, shading their crowns.",
    ecologicalInformationId: "Tumbuh agresif di tepi hutan, lahan terbuka, dan area terganggu di kawasan tropis. Merremia hederacea merambat cepat menutupi vegetasi bawah dan mampu memanjat pohon hingga menaungi tajuknya.",
    environmentalImpact: "Menutupi tanaman asli sehingga menghambat fotosintesis, menekan regenerasi alami hutan, dan mengubah struktur vegetasi di sabana dan tepi hutan Taman Nasional Baluran.",
    environmentalImpactEn: "Covers native plants and reduces photosynthesis, suppresses natural forest regeneration, and changes vegetation structure in savannas and forest edges of Baluran National Park.",
    environmentalImpactId: "Menutupi tanaman asli sehingga menghambat fotosintesis, menekan regenerasi alami hutan, dan mengubah struktur vegetasi di sabana dan tepi hutan Taman Nasional Baluran.",
    imagePath: "/sketsa-herbarium-merremia-hederacea.jpg",
  },
  "clitoria ternatea": {
    id: 902,
    commonName: "Telang",
    scientificName: "Clitoria ternatea",
    family: "Fabaceae",
    genus: "Clitoria",
    botanicalDescription: "Tanaman merambat herba perennial dari keluarga Fabaceae. Daun majemuk menyirip ganjil dengan 5-7 anak daun. Bunga berbentuk kupu-kupu berwarna biru tua hingga ungu, kadang putih. Polong pipih berisi biji berbentuk ginjal.",
    botanicalDescriptionEn: "Clitoria ternatea is a perennial herbaceous climber in the Fabaceae family. It has odd-pinnate compound leaves with 5-7 leaflets, butterfly-shaped deep blue to purple flowers that are sometimes white, and flat pods with kidney-shaped seeds.",
    botanicalDescriptionId: "Tanaman merambat herba perennial dari keluarga Fabaceae. Daun majemuk menyirip ganjil dengan 5-7 anak daun. Bunga berbentuk kupu-kupu berwarna biru tua hingga ungu, kadang putih. Polong pipih berisi biji berbentuk ginjal.",
    ecologicalInformation: "Tumbuh di daerah tropis dan subtropis, toleran terhadap berbagai jenis tanah. Di Taman Nasional Baluran, tanaman ini menyebar di area sabana dan pinggiran hutan, bersaing dengan vegetasi asli untuk mendapatkan sinar matahari dan nutrisi.",
    ecologicalInformationEn: "Grows in tropical and subtropical areas and tolerates many soil types. In Baluran National Park, it spreads through savanna areas and forest margins, competing with native vegetation for sunlight and nutrients.",
    ecologicalInformationId: "Tumbuh di daerah tropis dan subtropis, toleran terhadap berbagai jenis tanah. Di Taman Nasional Baluran, tanaman ini menyebar di area sabana dan pinggiran hutan, bersaing dengan vegetasi asli untuk mendapatkan sinar matahari dan nutrisi.",
    environmentalImpact: "Mampu menekan pertumbuhan rumput asli melalui naungan yang padat, mengubah komposisi vegetasi sabana, dan mengganggu ketersediaan pakan bagi herbivora asli seperti Banteng Jawa.",
    environmentalImpactEn: "Can suppress native grasses through dense shading, alter savanna vegetation composition, and disrupt forage availability for native herbivores such as the Javan banteng.",
    environmentalImpactId: "Mampu menekan pertumbuhan rumput asli melalui naungan yang padat, mengubah komposisi vegetasi sabana, dan mengganggu ketersediaan pakan bagi herbivora asli seperti Banteng Jawa.",
    imagePath: "/sketsa-herbarium-clitoria-ternatea.jpg",
  },
};

export default function SpeciesPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "lantana-camara";
  const { language } = useLanguage();
  const copy = SPECIES_COPY[language];

  const [plant, setPlant] = useState<PlantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState({
    scientificName: "",
    commonName: "",
    family: "",
    genus: "",
    botanicalDescription: "",
    ecologicalInformation: "",
    environmentalImpact: "",
    source: "",
  });
  const [sourceText, setSourceText] = useState("");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("biowatch_admin_auth");
      if (!stored) {
        setIsAdmin(false);
        return;
      }

      const parsed = JSON.parse(stored) as { role?: string };
      setIsAdmin(Boolean(parsed.role && parsed.role.toLowerCase().includes("admin")));
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const mapPlantRecord = (record: PlantApiRecord): PlantData => ({
    id: record.id,
    commonName: record.commonName || record.common_name || "",
    scientificName: record.scientificName || record.scientific_name || "",
    family: record.family || "",
    genus: record.genus || "",
    botanicalDescription: record.botanicalDescription || record.botanical_description || record.description || "",
    botanicalDescriptionEn:
      record.botanicalDescriptionEn
      || record.botanical_description_en
      || record.botanicalDescription
      || record.botanical_description
      || record.description
      || "",
    botanicalDescriptionId:
      record.botanicalDescriptionId
      || record.botanical_description_id
      || record.botanicalDescription
      || record.botanical_description
      || record.description
      || "",
    ecologicalInformation: record.ecologicalInformation || record.ecological_information || record.ecology || "",
    ecologicalInformationEn:
      record.ecologicalInformationEn
      || record.ecological_information_en
      || record.ecologicalInformation
      || record.ecological_information
      || record.ecology
      || "",
    ecologicalInformationId:
      record.ecologicalInformationId
      || record.ecological_information_id
      || record.ecologicalInformation
      || record.ecological_information
      || record.ecology
      || "",
    environmentalImpact: record.environmentalImpact || record.environmental_impact || "",
    environmentalImpactEn: record.environmentalImpactEn || record.environmental_impact_en || "",
    environmentalImpactId: record.environmentalImpactId || record.environmental_impact_id || "",
    imagePath: record.imagePath || record.image_path || "",
  });

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
          setPlant(mapPlantRecord(json.data[0]));
        } else {
          // Try fallback data for species not yet in the database
          const fallback = FALLBACK_PLANTS[searchTerm.toLowerCase()];
          if (fallback) {
            setPlant(fallback);
          } else {
            setError(copy.notFound);
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
          setError(copy.loadFailed);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlant();
  }, [copy.loadFailed, copy.notFound, id]);

  useEffect(() => {
    if (!plant || isEditing) return;

    setDraft({
      scientificName: plant.scientificName,
      commonName: plant.commonName,
      family: plant.family,
      genus: plant.genus,
      botanicalDescription: language === "id"
        ? plant.botanicalDescriptionId || plant.botanicalDescription
        : plant.botanicalDescriptionEn || plant.botanicalDescription,
      ecologicalInformation: language === "id"
        ? plant.ecologicalInformationId || plant.ecologicalInformation
        : plant.ecologicalInformationEn || plant.ecologicalInformation,
      environmentalImpact: language === "id"
        ? plant.environmentalImpactId || plant.environmentalImpact
        : plant.environmentalImpactEn || plant.environmentalImpact,
      source: sourceText,
    });
  }, [language, isEditing, plant, sourceText]);

  useEffect(() => {
    if (!plant) {
      setSourceText("");
      return;
    }

    setSourceText(readStoredSpeciesSourceText(plant.id, plant.scientificName));
  }, [plant]);

  const handleStartEditing = () => {
    if (!plant) return;

    setDraft({
      scientificName: plant.scientificName,
      commonName: plant.commonName,
      family: plant.family,
      genus: plant.genus,
      botanicalDescription: language === "id"
        ? plant.botanicalDescriptionId || plant.botanicalDescription
        : plant.botanicalDescriptionEn || plant.botanicalDescription,
      ecologicalInformation: language === "id"
        ? plant.ecologicalInformationId || plant.ecologicalInformation
        : plant.ecologicalInformationEn || plant.ecologicalInformation,
      environmentalImpact: language === "id"
        ? plant.environmentalImpactId || plant.environmentalImpact
        : plant.environmentalImpactEn || plant.environmentalImpact,
      source: readStoredSpeciesSourceText(plant.id, plant.scientificName),
    });
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    if (!plant) return;

    setDraft({
      scientificName: plant.scientificName,
      commonName: plant.commonName,
      family: plant.family,
      genus: plant.genus,
      botanicalDescription: language === "id"
        ? plant.botanicalDescriptionId || plant.botanicalDescription
        : plant.botanicalDescriptionEn || plant.botanicalDescription,
      ecologicalInformation: language === "id"
        ? plant.ecologicalInformationId || plant.ecologicalInformation
        : plant.ecologicalInformationEn || plant.ecologicalInformation,
      environmentalImpact: language === "id"
        ? plant.environmentalImpactId || plant.environmentalImpact
        : plant.environmentalImpactEn || plant.environmentalImpact,
      source: sourceText,
    });
  };

  const handleSaveSpecies = async () => {
    if (!plant) return;

    setIsSaving(true);
    try {
      const scientificName = draft.scientificName.trim();
      const commonName = draft.commonName.trim();
      const family = draft.family.trim();
      const genus = draft.genus.trim();

      if (!scientificName || !family || !genus) {
        toast.error(language === "id" ? "Nama ilmiah, famili, dan genus wajib diisi" : "Scientific name, family, and genus are required");
        return;
      }

      const payload = language === "id"
        ? {
            scientificName,
            commonName: commonName || scientificName,
            family,
            genus,
            botanicalDescription: draft.botanicalDescription,
            botanicalDescriptionId: draft.botanicalDescription,
            ecologicalInformation: draft.ecologicalInformation,
            ecologicalInformationId: draft.ecologicalInformation,
            environmentalImpact: draft.environmentalImpact,
            environmentalImpactId: draft.environmentalImpact,
          }
        : {
            scientificName,
            commonName: commonName || scientificName,
            family,
            genus,
            botanicalDescription: draft.botanicalDescription,
            botanicalDescriptionEn: draft.botanicalDescription,
            ecologicalInformation: draft.ecologicalInformation,
            ecologicalInformationEn: draft.ecologicalInformation,
            environmentalImpact: draft.environmentalImpact,
            environmentalImpactEn: draft.environmentalImpact,
          };

      const response = await fetch(`/api/v1/plants/${plant.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || "Failed to update species");
      }

      setPlant(mapPlantRecord(result.data));
      writeStoredSpeciesSourceText(plant.id, scientificName, draft.source);
      setSourceText(draft.source.trim());
      setIsEditing(false);
      toast.success(language === "id" ? "Detail spesies berhasil diperbarui" : "Species details updated successfully");
    } catch (err) {
      console.error("Failed to update plant details:", err);
      toast.error(language === "id" ? "Gagal memperbarui detail spesies" : "Failed to update species details");
    } finally {
      setIsSaving(false);
    }
  };

  // Get taxonomy for the species
  const taxonomy = plant
    ? TAXONOMY_DB[plant.scientificName.toLowerCase()] || [
        { rank: "Kerajaan", value: "Plantae" },
        { rank: "Famili", value: plant.family },
        { rank: "Genus", value: plant.genus },
        { rank: "Spesies", value: plant.scientificName },
      ]
    : [];
  const botanicalDescription = language === "id"
    ? plant?.botanicalDescriptionId || plant?.botanicalDescription
    : plant?.botanicalDescriptionEn || plant?.botanicalDescription;
  const ecologicalInformation = language === "id"
    ? plant?.ecologicalInformationId || plant?.ecologicalInformation
    : plant?.ecologicalInformationEn || plant?.ecologicalInformation;
  const environmentalImpact = language === "id"
    ? plant?.environmentalImpactId || plant?.environmentalImpact
    : plant?.environmentalImpactEn || plant?.environmentalImpact;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/20 p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !plant) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-muted/20 p-8">
        <p className="text-lg font-semibold text-muted-foreground">{error || copy.speciesMissing}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {copy.back}
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
            <div className="flex items-center justify-between gap-2 border-b bg-muted/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">{copy.descriptionTitle}</h2>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleStartEditing}
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{copy.botanicalDescription}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{botanicalDescription}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{copy.ecologicalInformation}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{ecologicalInformation}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{copy.environmentalImpact}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{environmentalImpact}</p>
              </div>
            </div>
          </div>

          {/* Sketch */}
          {plant.imagePath && (
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
                <ImageIcon className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">{copy.herbariumSketch}</h2>
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
                  alt={`${copy.herbariumAlt} ${plant.scientificName}`}
                  className="block h-full w-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Taxonomy */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
              <Network className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">{copy.taxonomy}</h2>
            </div>
            <div className="p-4">
              <div className="flex flex-col space-y-2">
                {taxonomy.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1 border-b last:border-0 border-muted">
                    <span className="text-muted-foreground">{copy.ranks[item.rank as keyof typeof copy.ranks] || item.rank}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Source */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">{copy.source}</h2>
            </div>
            <div className="p-4">
              <div className="rounded-lg border bg-background px-3 py-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {sourceText.trim() || copy.sourceEmpty}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isEditing} onOpenChange={(open) => (open ? handleStartEditing() : handleCancelEditing())}>
        <DialogContent className="w-[min(100vw-2rem,44rem)] max-w-none overflow-hidden rounded-lg p-0 shadow-2xl">
          <div className="border-b bg-muted/40 px-6 py-5">
            <DialogHeader className="space-y-1 pr-8 text-left">
              <DialogTitle className="text-xl font-semibold">{copy.editSpecies}</DialogTitle>
              <DialogDescription className="text-sm">
                {copy.updateDetails} <span className="italic">({plant.scientificName})</span>
              </DialogDescription>
            </DialogHeader>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSaveSpecies();
            }}
            className="max-h-[calc(90vh-6.5rem)] space-y-5 overflow-y-auto bg-card px-6 py-5"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-scientific-name">{copy.scientificName}</Label>
                <Input
                  id="edit-scientific-name"
                  value={draft.scientificName}
                  onChange={(event) => setDraft((current) => ({ ...current, scientificName: event.target.value }))}
                  className="italic"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-common-name">{copy.commonName}</Label>
                <Input
                  id="edit-common-name"
                  value={draft.commonName}
                  onChange={(event) => setDraft((current) => ({ ...current, commonName: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-family">{copy.family}</Label>
                <Input
                  id="edit-family"
                  value={draft.family}
                  onChange={(event) => setDraft((current) => ({ ...current, family: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-genus">{copy.genus}</Label>
                <Input
                  id="edit-genus"
                  value={draft.genus}
                  onChange={(event) => setDraft((current) => ({ ...current, genus: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-botanical-description" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {copy.botanicalDescription}
              </Label>
              <Textarea
                id="edit-botanical-description"
                value={draft.botanicalDescription}
                onChange={(event) => setDraft((current) => ({ ...current, botanicalDescription: event.target.value }))}
                rows={4}
                className="min-h-[112px] rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-ecological-information" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {copy.ecologicalInformation}
              </Label>
              <Textarea
                id="edit-ecological-information"
                value={draft.ecologicalInformation}
                onChange={(event) => setDraft((current) => ({ ...current, ecologicalInformation: event.target.value }))}
                rows={4}
                className="min-h-[112px] rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-environmental-impact" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {copy.environmentalImpact}
              </Label>
              <Textarea
                id="edit-environmental-impact"
                value={draft.environmentalImpact}
                onChange={(event) => setDraft((current) => ({ ...current, environmentalImpact: event.target.value }))}
                rows={4}
                className="min-h-[112px] rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-source" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {copy.source}
              </Label>
              <Textarea
                id="edit-source"
                value={draft.source}
                onChange={(event) => setDraft((current) => ({ ...current, source: event.target.value }))}
                rows={4}
                className="min-h-[112px] rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleCancelEditing} disabled={isSaving}>
                {copy.cancel}
              </Button>
              <Button type="submit" disabled={isSaving || !draft.scientificName.trim() || !draft.family.trim() || !draft.genus.trim()}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {copy.saving}
                  </>
                ) : (
                  copy.saveSpecies
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
