"use client";

import { Bug, Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Plant {
  id: number;
  commonName: string;
  scientificName: string;
  family: string;
  genus: string;
  botanicalDescription: string;
  ecologicalInformation: string;
  environmentalImpact: string;
  imagePath: string;
  createdAt: string;
  updatedAt: string;
}

const SPECIES_ADMIN_COPY = {
  en: {
    totalSpecies: "Total Species",
    families: "Families",
    lastUpdated: "Last Updated",
    records: "Species Records",
    search: "Search species...",
    addSpecies: "Add Species",
    columns: ["Species Name", "Family", "Genus", "Last Updated", "Actions"],
    loading: "Loading species...",
    empty: "No species found.",
    edit: "Edit",
    delete: "Delete",
    editSpecies: "Edit Species",
    updateDetails: "Update the details for",
    commonName: "Common Name",
    scientificName: "Scientific Name",
    family: "Family",
    genus: "Genus",
    botanicalDescription: "Botanical Description",
    ecologicalInformation: "Ecological Information",
    environmentalImpact: "Environmental Impact",
    cancel: "Cancel",
    saving: "Saving...",
    save: "Save Changes",
    loadFailed: "Failed to load species data",
    updateSuccess: "Species updated successfully",
    updateFailed: "Failed to update species",
    updateError: "An error occurred while updating",
    deleteConfirm: "Are you sure you want to delete this species?",
    deleteSuccess: "Species deleted successfully",
    deleteFailed: "Failed to delete species",
    deleteError: "An error occurred while deleting",
  },
  id: {
    totalSpecies: "Total Spesies",
    families: "Famili",
    lastUpdated: "Terakhir Diperbarui",
    records: "Catatan Spesies",
    search: "Cari spesies...",
    addSpecies: "Tambah Spesies",
    columns: ["Nama Spesies", "Famili", "Genus", "Terakhir Diperbarui", "Aksi"],
    loading: "Memuat spesies...",
    empty: "Spesies tidak ditemukan.",
    edit: "Edit",
    delete: "Hapus",
    editSpecies: "Edit Spesies",
    updateDetails: "Perbarui detail untuk",
    commonName: "Nama Umum",
    scientificName: "Nama Ilmiah",
    family: "Famili",
    genus: "Genus",
    botanicalDescription: "Deskripsi Botani",
    ecologicalInformation: "Informasi Ekologi",
    environmentalImpact: "Dampak Lingkungan",
    cancel: "Batal",
    saving: "Menyimpan...",
    save: "Simpan Perubahan",
    loadFailed: "Gagal memuat data spesies",
    updateSuccess: "Spesies berhasil diperbarui",
    updateFailed: "Gagal memperbarui spesies",
    updateError: "Terjadi kesalahan saat memperbarui",
    deleteConfirm: "Apakah Anda yakin ingin menghapus spesies ini?",
    deleteSuccess: "Spesies berhasil dihapus",
    deleteFailed: "Gagal menghapus spesies",
    deleteError: "Terjadi kesalahan saat menghapus",
  },
} as const;

export default function SpeciesManagement() {
  const [search, setSearch] = useState("");
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { language } = useLanguage();
  const copy = SPECIES_ADMIN_COPY[language];

  const [formData, setFormData] = useState({
    commonName: "",
    scientificName: "",
    family: "",
    genus: "",
    botanicalDescription: "",
    ecologicalInformation: "",
    environmentalImpact: "",
    imagePath: "",
  });

  const fetchPlants = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/plants?search=${search}`);
      const result = await response.json();
      if (result.success) {
        setPlants(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch plants:", error);
      toast.error(copy.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [copy.loadFailed, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPlants();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchPlants]);

  const handleEditClick = (plant: Plant) => {
    setEditingPlant(plant);
    setFormData({
      commonName: plant.commonName,
      scientificName: plant.scientificName,
      family: plant.family,
      genus: plant.genus,
      botanicalDescription: plant.botanicalDescription,
      ecologicalInformation: plant.ecologicalInformation,
      environmentalImpact: plant.environmentalImpact,
      imagePath: plant.imagePath,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlant) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/plants/${editingPlant.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(copy.updateSuccess);
        setIsEditDialogOpen(false);
        fetchPlants();
      } else {
        toast.error(result.error?.message || copy.updateFailed);
      }
    } catch (error) {
      console.error("Update failed:", error);
      toast.error(copy.updateError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(copy.deleteConfirm)) return;

    try {
      const response = await fetch(`/api/v1/plants/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        toast.success(copy.deleteSuccess);
        fetchPlants();
      } else {
        toast.error(copy.deleteFailed);
      }
    } catch (error) {
      toast.error(copy.deleteError);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Stats (Mocked or derived) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">{copy.totalSpecies}</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{plants.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">{copy.families}</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">
            {new Set(plants.map((p) => p.family)).size}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">{copy.lastUpdated}</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">
            {plants.length > 0 ? new Date(plants[0].updatedAt).toLocaleDateString() : "N/A"}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{copy.records}</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={copy.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-56 rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              {copy.addSpecies}
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {copy.columns.map((column) => (
                  <th key={column} className="px-6 py-3 text-left font-medium text-muted-foreground">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">{copy.loading}</p>
                  </td>
                </tr>
              ) : plants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                    {copy.empty}
                  </td>
                </tr>
              ) : (
                plants.map((species) => (
                  <tr key={species.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium italic">{species.scientificName}</div>
                      <div className="text-xs text-muted-foreground">{species.commonName}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{species.family}</td>
                    <td className="px-6 py-4 text-muted-foreground">{species.genus}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(species.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(species)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title={copy.edit}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(species.id)}
                          className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                          title={copy.delete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{copy.editSpecies}</DialogTitle>
            <DialogDescription>
              {copy.updateDetails} <span className="italic font-medium">{editingPlant?.scientificName}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commonName">{copy.commonName}</Label>
                <Input
                  id="commonName"
                  value={formData.commonName}
                  onChange={(e) => setFormData({ ...formData, commonName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scientificName">{copy.scientificName}</Label>
                <Input
                  id="scientificName"
                  value={formData.scientificName}
                  onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
                  className="italic"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="family">{copy.family}</Label>
                <Input
                  id="family"
                  value={formData.family}
                  onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genus">{copy.genus}</Label>
                <Input
                  id="genus"
                  value={formData.genus}
                  onChange={(e) => setFormData({ ...formData, genus: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="botanicalDescription">{copy.botanicalDescription}</Label>
              <Textarea
                id="botanicalDescription"
                value={formData.botanicalDescription}
                onChange={(e) => setFormData({ ...formData, botanicalDescription: e.target.value })}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ecologicalInformation">{copy.ecologicalInformation}</Label>
              <Textarea
                id="ecologicalInformation"
                value={formData.ecologicalInformation}
                onChange={(e) => setFormData({ ...formData, ecologicalInformation: e.target.value })}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="environmentalImpact">{copy.environmentalImpact}</Label>
              <Textarea
                id="environmentalImpact"
                value={formData.environmentalImpact}
                onChange={(e) => setFormData({ ...formData, environmentalImpact: e.target.value })}
                rows={3}
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {copy.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {copy.saving}
                  </>
                ) : (
                  copy.save
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
