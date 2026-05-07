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

export default function DataExplorer() {
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState("all");
  const [plants, setPlants] = useState<PlantRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

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
          setPlants(json.data.map((p: any) => ({
            id: p.id,
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

  // Get unique families for filter
  const families = [...new Set(plants.map(p => p.family))].filter(Boolean);

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
          <h1 className="text-2xl font-bold text-foreground">Data Explorer</h1>
          <p className="text-sm text-muted-foreground">Browse and manage species records from database</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExportCSV} disabled={plants.length === 0}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search species..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={familyFilter} onValueChange={(v) => { setFamilyFilter(v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Family" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Families</SelectItem>
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
            <span className="text-sm text-muted-foreground">Memuat data dari database...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scientific Name</TableHead>
                <TableHead>Common Name</TableHead>
                <TableHead>Family</TableHead>
                <TableHead>Genus</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Tidak ada data ditemukan
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
                        <Badge variant="outline" className="text-xs">Available</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString('id-ID') : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{total} records found</p>
        {total > limit && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">Page {page} of {Math.ceil(total / limit)}</span>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
