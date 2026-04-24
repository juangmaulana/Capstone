"use client";

import { Bug, Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState } from "react";

const SPECIES_DATA = [
  { id: 1, name: "Acacia nilotica", family: "Fabaceae", riskLevel: "High", totalRecords: 1247, lastUpdated: "2026-04-10" },
  { id: 2, name: "Ageratum conyzoides", family: "Asteraceae", riskLevel: "Medium", totalRecords: 892, lastUpdated: "2026-04-08" },
  { id: 3, name: "Chromolaena odorata", family: "Asteraceae", riskLevel: "High", totalRecords: 2103, lastUpdated: "2026-04-12" },
  { id: 4, name: "Lantana camara", family: "Verbenaceae", riskLevel: "High", totalRecords: 1856, lastUpdated: "2026-04-11" },
  { id: 5, name: "Mikania micrantha", family: "Asteraceae", riskLevel: "Medium", totalRecords: 634, lastUpdated: "2026-04-06" },
];

const stats = [
  { label: "Total Species", value: "5", color: "text-emerald-600 bg-emerald-50" },
  { label: "High Risk", value: "3", color: "text-red-600 bg-red-50" },
  { label: "Total Records", value: "6,732", color: "text-blue-600 bg-blue-50" },
  { label: "Last Updated", value: "Today", color: "text-amber-600 bg-amber-50" },
];

export default function SpeciesManagement() {
  const [search, setSearch] = useState("");

  const filtered = SPECIES_DATA.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color.split(" ")[0]}`}>{stat.value}</p>
          </div>
        ))}
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
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" />
              Add Species
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Species Name</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Family</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Risk Level</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Records</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Last Updated</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((species) => (
                <tr key={species.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium italic">{species.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{species.family}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      species.riskLevel === "High" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {species.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{species.totalRecords.toLocaleString()}</td>
                  <td className="px-6 py-4 text-muted-foreground">{species.lastUpdated}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
