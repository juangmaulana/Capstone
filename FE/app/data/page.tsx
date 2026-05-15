"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Search, Filter, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PlantRecord {
  id: number;
  commonName: string;
  scientificName: string;
  family: string;
  genus: string;
  botanicalDescription: string;
  imagePath: string;
  createdAt: string;
  updatedAt: string;
}

type PlantApiRecord = Partial<{
  id: number;
  commonName: string;
  common_name: string;
  scientificName: string;
  scientific_name: string;
  family: string;
  genus: string;
  botanicalDescription: string;
  botanical_description: string;
  imagePath: string;
  image_path: string;
  createdAt: string;
  created_at: string;
  updatedAt: string;
  updated_at: string;
}>;

const DATA_COPY = {
  en: {
    title: "Data Explorer",
    subtitle: "Browse and manage species records from the database",
    exportCsv: "Export CSV",
    searchPlaceholder: "Search species...",
    familyPlaceholder: "Family",
    allFamilies: "All Families",
    loading: "Loading data from database...",
    empty: "No data found",
    recordsFound: "records found",
    previous: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    available: "Available",
    columns: {
      scientificName: "Scientific Name",
      commonName: "Common Name",
      family: "Family",
      genus: "Genus",
      image: "Image",
      updated: "Updated",
    },
  },
  id: {
    title: "Penjelajah Data",
    subtitle: "Jelajahi dan kelola catatan spesies dari database",
    exportCsv: "Ekspor CSV",
    searchPlaceholder: "Cari spesies...",
    familyPlaceholder: "Famili",
    allFamilies: "Semua Famili",
    loading: "Memuat data dari database...",
    empty: "Tidak ada data ditemukan",
    recordsFound: "catatan ditemukan",
    previous: "Sebelumnya",
    next: "Berikutnya",
    page: "Halaman",
    of: "dari",
    available: "Tersedia",
    columns: {
      scientificName: "Nama Ilmiah",
      commonName: "Nama Umum",
      family: "Famili",
      genus: "Genus",
      image: "Gambar",
      updated: "Diperbarui",
    },
  },
} as const;

export default function DataExplorer() {
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState("all");
  const [plants, setPlants] = useState<PlantRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const { language } = useLanguage();
  const copy = DATA_COPY[language];

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (familyFilter !== "all") params.set("family", familyFilter);
        params.set("limit", String(limit));
        params.set("offset", String((page - 1) * limit));

        const res = await fetch(`/api/v1/plants?${params.toString()}`);
        const json = await res.json();

        if (json.success && json.data) {
          setPlants(json.data.map((p: PlantApiRecord) => ({
            id: p.id ?? 0,
            commonName: p.commonName || p.common_name || "",
            scientificName: p.scientificName || p.scientific_name || "",
            family: p.family || "",
            genus: p.genus || "",
            botanicalDescription: p.botanicalDescription || p.botanical_description || "",
            imagePath: p.imagePath || p.image_path || "",
            createdAt: p.createdAt || p.created_at || "",
            updatedAt: p.updatedAt || p.updated_at || "",
          })));
          setTotal(json.meta?.total || json.data.length);
        }
      } catch (err) {
        console.error("Failed to fetch plants:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [search, familyFilter, page]);

  const handleExportCSV = () => {
    if (plants.length === 0) return;
    const headers = "ID,Scientific Name,Common Name,Family,Genus,Created At\n";
    const rows = plants.map(p =>
      `${p.id},"${p.scientificName}","${p.commonName}","${p.family}","${p.genus}","${p.createdAt}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "biowatch_plants_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExportCSV} disabled={plants.length === 0}>
          <Download className="h-4 w-4" /> {copy.exportCsv}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={copy.searchPlaceholder}
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={familyFilter} onValueChange={(v) => { setFamilyFilter(v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder={copy.familyPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.allFamilies}</SelectItem>
            <SelectItem value="Fabaceae">Fabaceae</SelectItem>
            <SelectItem value="Verbenaceae">Verbenaceae</SelectItem>
            <SelectItem value="Asteraceae">Asteraceae</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span className="text-sm text-muted-foreground">{copy.loading}</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.columns.scientificName}</TableHead>
                <TableHead>{copy.columns.commonName}</TableHead>
                <TableHead>{copy.columns.family}</TableHead>
                <TableHead>{copy.columns.genus}</TableHead>
                <TableHead>{copy.columns.image}</TableHead>
                <TableHead>{copy.columns.updated}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {copy.empty}
                  </TableCell>
                </TableRow>
              ) : (
                plants.map((row) => (
                  <TableRow key={row.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                    const slug = row.scientificName.toLowerCase().replace(/\s+/g, '-');
                    window.location.href = `/species/${slug}`;
                  }}>
                    <TableCell className="font-medium italic">{row.scientificName}</TableCell>
                    <TableCell>{row.commonName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.family}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.genus}</TableCell>
                    <TableCell>
                      {row.imagePath ? (
                        <Badge variant="outline" className="text-xs">{copy.available}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString(language === "id" ? "id-ID" : "en-US") : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{total} {copy.recordsFound}</p>
        {total > limit && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              {copy.previous}
            </Button>
            <span className="text-xs text-muted-foreground">{copy.page} {page} {copy.of} {Math.ceil(total / limit)}</span>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>
              {copy.next}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
