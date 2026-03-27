"use client";

import { useState } from "react";
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
import { Download, Search, Filter } from "lucide-react";

const DATA = [
  { id: 1, species: "Acacia nilotica", location: "Savana Bekol, Baluran", risk: "Critical", date: "2025-12-15", source: "Field Survey", confidence: 96 },
  { id: 2, species: "Lantana camara", location: "Pantai Bama, Baluran", risk: "High", date: "2025-11-20", source: "GBIF Import", confidence: 88 },
  { id: 3, species: "Mikania micrantha", location: "Gunung Baluran, Baluran", risk: "Medium", date: "2026-01-05", source: "Citizen Science", confidence: 78 },
  { id: 4, species: "Chromolaena odorata", location: "Hutan Tropis, Baluran", risk: "High", date: "2026-02-10", source: "Remote Sensing", confidence: 95 },
  { id: 5, species: "Ageratum conyzoides", location: "Pos Sumber Batang, Baluran", risk: "Low", date: "2026-01-28", source: "Field Survey", confidence: 75 },
  { id: 6, species: "Lantana camara", location: "Savana Bekol, Baluran", risk: "Critical", date: "2025-10-14", source: "GBIF Import", confidence: 91 },
  { id: 7, species: "Acacia nilotica", location: "Gunung Baluran, Baluran", risk: "High", date: "2025-09-03", source: "Field Survey", confidence: 92 },
  { id: 8, species: "Chromolaena odorata", location: "Kawasan Bama, Baluran", risk: "Medium", date: "2026-02-20", source: "Citizen Science", confidence: 84 },
];

const riskVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Critical: "destructive",
  High: "destructive",
  Medium: "secondary",
  Low: "outline",
};

export default function DataExplorer() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  const filtered = DATA.filter((d) => {
    const matchSearch = d.species.toLowerCase().includes(search.toLowerCase()) || d.location.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === "all" || d.risk === riskFilter;
    return matchSearch && matchRisk;
  });

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Explorer</h1>
          <p className="text-sm text-muted-foreground">Browse and manage species observation records</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search species or location..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risks</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Species</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.species}</TableCell>
                <TableCell>{row.location}</TableCell>
                <TableCell>
                  <Badge variant={riskVariant[row.risk]}>{row.risk}</Badge>
                </TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.source}</TableCell>
                <TableCell className="text-right">{row.confidence}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} records found</p>
    </div>
  );
}
