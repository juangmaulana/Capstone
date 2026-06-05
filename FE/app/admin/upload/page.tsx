"use client";

import { Upload, FileSpreadsheet, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const RECENT_UPLOADS = [
  { id: 1, filename: "baluran_survey_2026_q1.csv", type: "CSV", size: "2.4 MB", uploadedBy: "Dr. Andi Prasetyo", date: "2026-04-12", status: "Completed" },
  { id: 2, filename: "species_observations_march.xlsx", type: "Excel", size: "5.1 MB", uploadedBy: "Siti Nurhaliza", date: "2026-04-10", status: "Completed" },
  { id: 3, filename: "gis_coordinates_batch3.geojson", type: "GeoJSON", size: "1.8 MB", uploadedBy: "Budi Santoso", date: "2026-04-08", status: "Processing" },
  { id: 4, filename: "field_report_feb.pdf", type: "PDF", size: "3.2 MB", uploadedBy: "Rudi Hermawan", date: "2026-04-05", status: "Failed" },
];

const UPLOAD_COPY = {
  en: {
    title: "Upload Data Files",
    drag: "Drag and drop files here, or click to browse",
    supports: "Supports CSV, Excel, GeoJSON, and PDF files (max 50MB)",
    formats: [
      { label: "Spreadsheet", desc: "CSV, XLSX, XLS" },
      { label: "GeoJSON", desc: "Geographic data" },
      { label: "Documents", desc: "PDF reports" },
    ],
    recent: "Recent Uploads",
    columns: ["Filename", "Type", "Size", "Uploaded By", "Date", "Status"],
    status: { Completed: "Completed", Processing: "Processing", Failed: "Failed" },
  },
  id: {
    title: "Unggah File Data",
    drag: "Tarik dan lepas file di sini, atau klik untuk memilih",
    supports: "Mendukung file CSV, Excel, GeoJSON, dan PDF (maks 50MB)",
    formats: [
      { label: "Spreadsheet", desc: "CSV, XLSX, XLS" },
      { label: "GeoJSON", desc: "Data geografis" },
      { label: "Dokumen", desc: "Laporan PDF" },
    ],
    recent: "Unggahan Terbaru",
    columns: ["Nama File", "Tipe", "Ukuran", "Diunggah Oleh", "Tanggal", "Status"],
    status: { Completed: "Selesai", Processing: "Diproses", Failed: "Gagal" },
  },
} as const;

export default function UploadData() {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();
  const copy = UPLOAD_COPY[language];

  return (
    <div className="p-6 space-y-6">
      {/* Upload Area */}
      <div
        className={`relative rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input type="file" ref={fileInputRef} className="hidden" multiple accept=".csv,.xlsx,.xls,.geojson,.json,.pdf" />
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">{copy.title}</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {copy.drag}
        </p>
        <p className="text-xs text-muted-foreground">
          {copy.supports}
        </p>
      </div>

      {/* Supported Formats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: FileSpreadsheet, ...copy.formats[0], color: "text-green-600 bg-green-50" },
          { icon: FileText, ...copy.formats[1], color: "text-blue-600 bg-blue-50" },
          { icon: FileText, ...copy.formats[2], color: "text-amber-600 bg-amber-50" },
        ].map((fmt) => (
          <div key={fmt.label} className="stat-card flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${fmt.color}`}>
              <fmt.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">{fmt.label}</p>
              <p className="text-xs text-muted-foreground">{fmt.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Uploads Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{copy.recent}</h2>
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
              {RECENT_UPLOADS.map((file) => (
                <tr key={file.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">{file.filename}</td>
                  <td className="px-6 py-4 text-muted-foreground">{file.type}</td>
                  <td className="px-6 py-4 text-muted-foreground">{file.size}</td>
                  <td className="px-6 py-4 text-muted-foreground">{file.uploadedBy}</td>
                  <td className="px-6 py-4 text-muted-foreground">{file.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      file.status === "Completed" ? "bg-green-100 text-green-700" :
                      file.status === "Processing" ? "bg-blue-100 text-blue-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {file.status === "Completed" && <CheckCircle2 className="h-3 w-3" />}
                      {file.status === "Processing" && <Clock className="h-3 w-3" />}
                      {file.status === "Failed" && <AlertCircle className="h-3 w-3" />}
                      {copy.status[file.status as keyof typeof copy.status] || file.status}
                    </span>
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
