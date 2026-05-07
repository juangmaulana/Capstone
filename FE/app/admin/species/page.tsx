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

export default function SpeciesManagement() {
  const [search, setSearch] = useState("");
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      toast.error("Failed to load species data");
    } finally {
      setLoading(false);
    }
  }, [search]);

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
        toast.success("Species updated successfully");
        setIsEditDialogOpen(false);
        fetchPlants();
      } else {
        toast.error(result.error?.message || "Failed to update species");
      }
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("An error occurred while updating");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this species?")) return;

    try {
      const response = await fetch(`/api/v1/plants/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Species deleted successfully");
        fetchPlants();
      } else {
        toast.error("Failed to delete species");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Stats (Mocked or derived) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Species</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{plants.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Families</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">
            {new Set(plants.map((p) => p.family)).size}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Last Updated</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">
            {plants.length > 0 ? new Date(plants[0].updatedAt).toLocaleDateString() : "N/A"}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Species Records</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search species..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-56 rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Species
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Species Name</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Family</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Genus</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Last Updated</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Loading species...</p>
                  </td>
                </tr>
              ) : plants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                    No species found.
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
                      {species.updatedAt}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(species)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(species.id)}
                          className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                          title="Delete"
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
            <DialogTitle>Edit Species</DialogTitle>
            <DialogDescription>
              Update the details for <span className="italic font-medium">{editingPlant?.scientificName}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commonName">Common Name</Label>
                <Input
                  id="commonName"
                  value={formData.commonName}
                  onChange={(e) => setFormData({ ...formData, commonName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scientificName">Scientific Name</Label>
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
                <Label htmlFor="family">Family</Label>
                <Input
                  id="family"
                  value={formData.family}
                  onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genus">Genus</Label>
                <Input
                  id="genus"
                  value={formData.genus}
                  onChange={(e) => setFormData({ ...formData, genus: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="botanicalDescription">Botanical Description</Label>
              <Textarea
                id="botanicalDescription"
                value={formData.botanicalDescription}
                onChange={(e) => setFormData({ ...formData, botanicalDescription: e.target.value })}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ecologicalInformation">Ecological Information</Label>
              <Textarea
                id="ecologicalInformation"
                value={formData.ecologicalInformation}
                onChange={(e) => setFormData({ ...formData, ecologicalInformation: e.target.value })}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="environmentalImpact">Environmental Impact</Label>
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
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
