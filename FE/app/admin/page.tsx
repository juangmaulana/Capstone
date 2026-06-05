"use client";

import { Users, UserPlus, ShieldCheck, Activity, ScrollText, Plus, Pencil, Trash2, Search, CheckCircle2, AlertCircle, AlertTriangle, Info, Filter, LogOut, User, Eye, X, Image as ImageIcon, Lock, Copy, KeyRound } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AdminDataAnnotationPanel } from "@/components/AdminDataAnnotationPanel";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createScientificNameSlug, getScientificNameWithAuthor } from "@/lib/plant/scientific-name-author";

/* ───────────── TYPES ───────────── */

interface ApiUser {
  id: number;
  name: string;
  email: string;
  roleId: number;
  role_id?: number;
  role?: string;
  roleName?: string;
  role_name?: string;
  status?: string;
  updatedAt?: string;
  updated_at?: string;
  lastLoginAt?: string;
}

interface ApiRole {
  id: number;
  name: string;
  description: string;
}

interface ApiPlant {
  id: number;
  scientificName?: string;
  scientific_name?: string;
  commonName?: string;
  common_name?: string;
  family: string;
  genus: string;
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
  imagePath?: string;
  image_path?: string;
  kingdom?: string;
  phylum?: string;
  taxClass?: string;
  tax_class?: string;
  class?: string;
  orderRank?: string;
  order_rank?: string;
  order?: string;
  taxSpecies?: string;
  tax_species?: string;
  species?: string;
  source?: string;
  sourceReference?: string;
  source_reference?: string;
  imageSource?: string;
  image_source?: string;
  imageReference?: string;
  image_reference?: string;
  updatedAt?: string;
  updated_at?: string;
}

interface ApiAuditLog {
  id: string | number;
  actorId?: string;
  actor_id?: string;
  entityId?: string;
  entity_id?: string;
  entityType?: string;
  entity_type?: string;
  action?: string;
  message?: string;
  createdAt?: string;
  created_at?: string;
}

interface DisplayUser {
  id: number;
  name: string;
  email: string;
  role: string;
  roleId: number;
  status: string;
  lastLogin: string;
}

interface DisplaySpecies {
  id: number;
  scientificName: string;
  commonName: string;
  family: string;
  genus: string;
  botanicalDescription: string;
  botanicalDescriptionEn: string;
  botanicalDescriptionId: string;
  ecologicalInformation: string;
  ecologicalInformationEn: string;
  ecologicalInformationId: string;
  environmentalImpact: string;
  environmentalImpactEn: string;
  environmentalImpactId: string;
  imagePath: string;
  kingdom: string;
  phylum: string;
  taxClass: string;
  orderRank: string;
  taxSpecies: string;
  source: string;
  imageSource: string;
  lastUpdated: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "string" && error.trim()) return error;
  if (typeof error === "object" && error !== null) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
};

const createSpeciesSlug = (scientificName: string) =>
  createScientificNameSlug(scientificName).replace(/--+/g, "-");

const SPECIES_SOURCE_STORAGE_PREFIX = "biowatch_species_source_";

const getSpeciesSourceStorageKey = (speciesId: number, scientificName: string) =>
  speciesId > 0 ? `${SPECIES_SOURCE_STORAGE_PREFIX}${speciesId}` : `${SPECIES_SOURCE_STORAGE_PREFIX}tmp_${createSpeciesSlug(scientificName)}`.replace(/--+/g, "-");

const readStoredSpeciesSourceText = (speciesId: number, scientificName: string) => {
  if (typeof window === "undefined") return "";

  try {
    const primaryKey = getSpeciesSourceStorageKey(speciesId, scientificName);
    const fallbackKey = `${SPECIES_SOURCE_STORAGE_PREFIX}tmp_${createSpeciesSlug(scientificName)}`;
    const raw = localStorage.getItem(primaryKey) || localStorage.getItem(fallbackKey);
    if (!raw) return "";

    const parsed = JSON.parse(raw) as string | Array<{ source?: string; detail?: string }>;
    if (typeof parsed === "string") return parsed;
    if (Array.isArray(parsed)) {
      return parsed
        .map((row) => {
          const source = row.source?.trim() || "";
          const detail = row.detail?.trim() || "";
          if (source && detail) return `${source}: ${detail}`;
          return source || detail;
        })
        .filter(Boolean)
        .join("\n");
    }

    return "";
  } catch {
    return "";
  }
};

const writeStoredSpeciesSourceText = (speciesId: number, scientificName: string, sourceText: string) => {
  if (typeof window === "undefined") return;

  const normalizedText = sourceText.trim();

  const storageKey = getSpeciesSourceStorageKey(speciesId, scientificName);
  const fallbackKey = `${SPECIES_SOURCE_STORAGE_PREFIX}tmp_${createSpeciesSlug(scientificName)}`;

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

const SPECIES_IMAGE_SOURCE_STORAGE_PREFIX = "biowatch_species_image_source_";

const getSpeciesImageSourceStorageKey = (speciesId: number, scientificName: string) =>
  speciesId > 0
    ? `${SPECIES_IMAGE_SOURCE_STORAGE_PREFIX}${speciesId}`
    : `${SPECIES_IMAGE_SOURCE_STORAGE_PREFIX}tmp_${createSpeciesSlug(scientificName)}`.replace(/--+/g, "-");

const readStoredSpeciesImageSourceText = (speciesId: number, scientificName: string) => {
  if (typeof window === "undefined") return "";

  try {
    const primaryKey = getSpeciesImageSourceStorageKey(speciesId, scientificName);
    const fallbackKey = `${SPECIES_IMAGE_SOURCE_STORAGE_PREFIX}tmp_${createSpeciesSlug(scientificName)}`;
    const raw = localStorage.getItem(primaryKey) || localStorage.getItem(fallbackKey);
    if (!raw) return "";
    return JSON.parse(raw) as string;
  } catch {
    return "";
  }
};

const writeStoredSpeciesImageSourceText = (speciesId: number, scientificName: string, sourceText: string) => {
  if (typeof window === "undefined") return;

  const normalizedText = sourceText.trim();
  const storageKey = getSpeciesImageSourceStorageKey(speciesId, scientificName);
  const fallbackKey = `${SPECIES_IMAGE_SOURCE_STORAGE_PREFIX}tmp_${createSpeciesSlug(scientificName)}`;

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

const SPECIES_TAXONOMY_STORAGE_PREFIX = "biowatch_species_taxonomy_";

interface TaxonomyFields { kingdom: string; phylum: string; taxClass: string; order: string; taxSpecies: string; }
const EMPTY_TAXONOMY: TaxonomyFields = { kingdom: "", phylum: "", taxClass: "", order: "", taxSpecies: "" };

const getSpeciesTaxonomyStorageKey = (speciesId: number, scientificName: string) =>
  speciesId > 0
    ? `${SPECIES_TAXONOMY_STORAGE_PREFIX}${speciesId}`
    : `${SPECIES_TAXONOMY_STORAGE_PREFIX}tmp_${createSpeciesSlug(scientificName)}`.replace(/--+/g, "-");

const readStoredSpeciesTaxonomy = (speciesId: number, scientificName: string): TaxonomyFields => {
  if (typeof window === "undefined") return EMPTY_TAXONOMY;
  try {
    const key = getSpeciesTaxonomyStorageKey(speciesId, scientificName);
    const fallbackKey = `${SPECIES_TAXONOMY_STORAGE_PREFIX}tmp_${createSpeciesSlug(scientificName)}`;
    const raw = localStorage.getItem(key) || localStorage.getItem(fallbackKey);
    if (!raw) return EMPTY_TAXONOMY;
    return JSON.parse(raw) as TaxonomyFields;
  } catch {
    return EMPTY_TAXONOMY;
  }
};

const writeStoredSpeciesTaxonomy = (speciesId: number, scientificName: string, taxonomy: TaxonomyFields) => {
  if (typeof window === "undefined") return;
  const key = getSpeciesTaxonomyStorageKey(speciesId, scientificName);
  const fallbackKey = `${SPECIES_TAXONOMY_STORAGE_PREFIX}tmp_${createSpeciesSlug(scientificName)}`;
  const hasData = Object.values(taxonomy).some((v) => v.trim());
  if (!hasData) {
    localStorage.removeItem(key);
    localStorage.removeItem(fallbackKey);
    return;
  }
  localStorage.setItem(key, JSON.stringify(taxonomy));
  if (speciesId > 0) localStorage.removeItem(fallbackKey);
};

type LogLevel = "info" | "warning" | "error" | "success";

interface LogEntry {
  id: string | number;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  user?: string;
}

const LEVEL_STYLES: Record<LogLevel, { bg: string; text: string; icon: typeof Info }> = {
  info: { bg: "bg-blue-100", text: "text-blue-700", icon: Info },
  warning: { bg: "bg-amber-100", text: "text-amber-700", icon: AlertTriangle },
  error: { bg: "bg-red-100", text: "text-red-700", icon: AlertCircle },
  success: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle2 },
};

const getLogLevelFromAction = (action?: string): LogLevel => {
  const normalizedAction = action?.toLowerCase() ?? "";
  if (normalizedAction.includes("error") || normalizedAction.includes("fail") || normalizedAction.includes("reject")) return "error";
  if (normalizedAction.includes("warn")) return "warning";
  if (normalizedAction.includes("info") || normalizedAction.includes("read") || normalizedAction.includes("view")) return "info";
  return "success";
};

const formatAuditTimestamp = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().replace("T", " ").substring(0, 19);
};

const mapAuditLog = (log: ApiAuditLog): LogEntry => ({
  id: log.id,
  timestamp: formatAuditTimestamp(log.createdAt || log.created_at),
  level: getLogLevelFromAction(log.action),
  source: log.entityType || log.entity_type || "-",
  message: log.message || log.action || "-",
  user: log.actorId || log.actor_id || undefined,
});

/* ───────────── TABS ───────────── */

type Tab = "users" | "species" | "logs" | "annotation";
type AdminConfirmAction = "logout" | "addSpecies" | "editSpecies" | "saveProfile";

const getAdminTabFromPath = (pathname: string): Tab => {
  if (pathname.startsWith("/admin/species")) return "species";
  if (pathname.startsWith("/admin/annotation")) return "annotation";
  if (pathname.startsWith("/admin/logs")) return "logs";
  return "users";
};

const ADMIN_COPY = {
  en: {
    fallbackAdmin: "Administrator",
    profile: "Profile",
    logout: "Logout",
    tabs: {
      users: "User Management",
      species: "Species Management",
      annotation: "Data Annotation",
      logs: "System Logs",
    },
    users: {
      total: "Total Users",
      active: "Active Users",
      admins: "Admins",
      roles: "Roles",
      title: "Users",
      add: "Add User",
      superAdminOnlyTitle: "Only Super Admin can add users",
      columns: ["Name", "Email", "Role", "Status", "Last Login", "Actions"],
      editRole: "Edit Role",
      deleteUser: "Delete User",
      activeStatus: "Active",
      inactiveStatus: "Inactive",
    },
    species: {
      total: "Total Species",
      families: "Families",
      lastUpdated: "Last Updated",
      today: "Today",
      records: "Species Records",
      search: "Search species...",
      add: "Add Species",
      columns: ["Scientific Name", "Common Name", "Family", "Genus", "Last Updated", "Actions"],
      edit: "Edit",
      delete: "Delete",
      addTitle: "Add New Species",
      editTitle: "Edit Species",
      updateDetails: "Update the details for",
      scientificName: "Scientific Name",
      commonName: "Common Name",
      family: "Family",
      genus: "Genus",
      botanicalDescription: "Botanical Description",
      ecologicalInformation: "Ecological Information",
      environmentalImpact: "Environmental Impact",
      source: "Source",
      herbariumSketch: "Herbarium Sketch",
      herbariumSketchPlaceholder: "e.g., /sketsa-herbarium-example.jpg",
      imageSource: "Image Source",
      imageSourcePlaceholder: "Add the herbarium sketch source, credit, or link...",
      taxonomy: "Plant Taxonomy",
      kingdom: "Kingdom",
      phylum: "Phylum",
      taxClass: "Class",
      order: "Order",
      taxSpecies: "Species",
      kingdomPlaceholder: "e.g., Plantae",
      phylumPlaceholder: "e.g., Tracheophyta",
      classPaceholder: "e.g., Magnoliopsida",
      orderPlaceholder: "e.g., Asterales",
      taxSpeciesPlaceholder: "e.g., V. nilotica",
      scientificPlaceholder: "e.g., Vachellia nilotica",
      commonPlaceholder: "e.g., Babul",
      familyPlaceholder: "e.g., Fabaceae",
      genusPlaceholder: "e.g., Vachellia",
      botanicalPlaceholder: "Describe the plant's physical characteristics...",
      ecologicalPlaceholder: "Describe its habitat and ecological role...",
      impactPlaceholder: "Describe its impact on the environment...",
      sourcePlaceholder: "Add references, links, or source notes...",
      save: "Save Species",
      viewDetail: "View species page",
      deleteTitle: "Delete Species?",
      deleteDesc: "Are you sure you want to delete",
      cannotUndo: "This action cannot be undone.",
      yesDelete: "Yes, Delete",
    },
    logs: {
      title: "Annotation & Verification Logs",
      by: "by",
      filters: { all: "all", info: "info", warning: "warning", error: "error", success: "success" },
      levels: { info: "info", warning: "warning", error: "error", success: "success" },
      sources: { Annotation: "Annotation", Verification: "Verification" },
    },
    profileModal: {
      start: "Start editing",
      stop: "Stop editing",
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      country: "Country",
      save: "Save",
      newPassword: "New Password",
      repeatPassword: "Repeat New Password",
      currentPassword: "Current Password",
      changePassword: "Change Password",
      repeatRequired: "Repeat New Password is required",
      mismatch: "Passwords do not match",
      currentRequired: "Current Password is required",
      currentWrong: "Current password is incorrect",
    },
    confirm: {
      logoutTitle: "Log out?",
      logoutDesc: "You will need to sign in again to access the admin system.",
      logoutAction: "Log Out",
      addSpeciesTitle: "Add species?",
      addSpeciesDesc: "This will create a new species record with the current form data.",
      addSpeciesAction: "Add Species",
      editSpeciesTitle: "Save species changes?",
      editSpeciesDesc: "This will update the selected species record.",
      editSpeciesAction: "Save Changes",
      saveProfileTitle: "Save profile changes?",
      saveProfileDesc: "This will close the profile editor and apply the current profile changes.",
      saveProfileAction: "Save Profile",
    },
    roleModal: {
      title: "Edit Role",
      user: "User",
      role: "Role",
    },
    deleteModal: {
      title: "Delete User",
      desc: "This action cannot be undone",
      confirmPrefix: "Are you sure you want to delete",
      confirmSuffix: "from the system?",
      delete: "Delete",
    },
    addUser: {
      successTitle: "User Added Successfully",
      title: "Add New User",
      successSubtitle: "Save the credentials below",
      subtitle: "Invite a new user with an email address",
      addedAs: "was added as",
      loginCredentials: "Login Credentials",
      temporaryPassword: "Temporary Password",
      copied: "Copied!",
      copyCredentials: "Copy Credentials",
      important: "Important!",
      warning: "Send these credentials to the user through a secure channel. The user should change the password after the first login.",
      emailLabel: "Email Address",
      emailPlaceholder: "example@bio-inspector.id",
      emailHelp: "Enter the active email of the user you want to add to the system",
      fullName: "Full Name",
      namePlaceholder: "Enter full name",
      role: "Role",
      passwordInfo: <>A temporary password will be <strong>generated automatically</strong> by the system and shown after the user is added.</>,
      superAdminOnly: "Only Super Admin can add users",
      done: "Done",
      add: "Add User",
      emailRequired: "Email is required",
      emailInvalid: "Email format is invalid",
      nameRequired: "User name is required",
      roleMissing: "Role was not found",
      serverFailed: "Failed to contact server",
      createFailed: "Failed to add user",
      passwordLabel: "Temporary Password",
    },
    common: {
      cancel: "Cancel",
      save: "Save",
      done: "Done",
      unknownError: "Unknown error",
      saveSpeciesFailed: "Failed to save species",
      contactServerError: "An error occurred while contacting the server",
    },
  },
  id: {
    fallbackAdmin: "Administrator",
    profile: "Profil",
    logout: "Keluar",
    tabs: {
      users: "Manajemen User",
      species: "Manajemen Spesies",
      annotation: "Anotasi Data",
      logs: "Log Sistem",
    },
    users: {
      total: "Total User",
      active: "User Aktif",
      admins: "Admin",
      roles: "Role",
      title: "User",
      add: "Tambah User",
      superAdminOnlyTitle: "Hanya Super Admin yang dapat menambahkan user",
      columns: ["Nama", "Email", "Role", "Status", "Login Terakhir", "Aksi"],
      editRole: "Edit Role",
      deleteUser: "Hapus User",
      activeStatus: "Aktif",
      inactiveStatus: "Tidak Aktif",
    },
    species: {
      total: "Total Spesies",
      families: "Famili",
      lastUpdated: "Terakhir Diperbarui",
      today: "Hari Ini",
      records: "Catatan Spesies",
      search: "Cari spesies...",
      add: "Tambah Spesies",
      columns: ["Nama Ilmiah", "Nama Umum", "Famili", "Genus", "Terakhir Diperbarui", "Aksi"],
      edit: "Edit",
      delete: "Hapus",
      addTitle: "Tambah Spesies Baru",
      editTitle: "Edit Spesies",
      updateDetails: "Perbarui detail untuk",
      scientificName: "Nama Ilmiah",
      commonName: "Nama Umum",
      family: "Famili",
      genus: "Genus",
      botanicalDescription: "Deskripsi Botani",
      ecologicalInformation: "Informasi Ekologi",
      environmentalImpact: "Dampak Lingkungan",
      source: "Sumber",
      herbariumSketch: "Sketsa Herbarium",
      herbariumSketchPlaceholder: "contoh: /sketsa-herbarium-contoh.jpg",
      imageSource: "Sumber Gambar",
      imageSourcePlaceholder: "Tambahkan sumber, kredit, atau tautan sketsa herbarium...",
      taxonomy: "Taksonomi Tanaman",
      kingdom: "Kerajaan",
      phylum: "Filum",
      taxClass: "Kelas",
      order: "Ordo",
      taxSpecies: "Spesies",
      kingdomPlaceholder: "contoh: Plantae",
      phylumPlaceholder: "contoh: Tracheophyta",
      classPaceholder: "contoh: Magnoliopsida",
      orderPlaceholder: "contoh: Asterales",
      taxSpeciesPlaceholder: "contoh: V. nilotica",
      scientificPlaceholder: "contoh: Vachellia nilotica",
      commonPlaceholder: "contoh: Babul",
      familyPlaceholder: "contoh: Fabaceae",
      genusPlaceholder: "contoh: Vachellia",
      botanicalPlaceholder: "Jelaskan karakteristik fisik tanaman...",
      ecologicalPlaceholder: "Jelaskan habitat dan peran ekologinya...",
      impactPlaceholder: "Jelaskan dampaknya terhadap lingkungan...",
      sourcePlaceholder: "Tambahkan referensi, tautan, atau catatan sumber...",
      save: "Simpan Spesies",
      viewDetail: "Lihat halaman spesies",
      deleteTitle: "Hapus Spesies?",
      deleteDesc: "Apakah Anda yakin ingin menghapus",
      cannotUndo: "Tindakan ini tidak dapat dibatalkan.",
      yesDelete: "Ya, Hapus",
    },
    logs: {
      title: "Log Anotasi & Verifikasi",
      by: "oleh",
      filters: { all: "semua", info: "info", warning: "peringatan", error: "error", success: "berhasil" },
      levels: { info: "info", warning: "peringatan", error: "error", success: "berhasil" },
      sources: { Annotation: "Anotasi", Verification: "Verifikasi" },
    },
    profileModal: {
      start: "Mulai edit",
      stop: "Berhenti edit",
      firstName: "Nama Depan",
      lastName: "Nama Belakang",
      email: "Email",
      country: "Negara",
      save: "Simpan",
      newPassword: "Password Baru",
      repeatPassword: "Ulangi Password Baru",
      currentPassword: "Password Saat Ini",
      changePassword: "Ubah Password",
      repeatRequired: "Ulangi Password Baru wajib diisi",
      mismatch: "Password tidak cocok",
      currentRequired: "Password Saat Ini wajib diisi",
      currentWrong: "Password saat ini salah",
    },
    confirm: {
      logoutTitle: "Keluar?",
      logoutDesc: "Anda perlu login kembali untuk mengakses sistem admin.",
      logoutAction: "Keluar",
      addSpeciesTitle: "Tambah spesies?",
      addSpeciesDesc: "Data pada form saat ini akan dibuat sebagai catatan spesies baru.",
      addSpeciesAction: "Tambah Spesies",
      editSpeciesTitle: "Simpan perubahan spesies?",
      editSpeciesDesc: "Catatan spesies yang dipilih akan diperbarui.",
      editSpeciesAction: "Simpan Perubahan",
      saveProfileTitle: "Simpan perubahan profil?",
      saveProfileDesc: "Editor profil akan ditutup dan perubahan profil saat ini akan diterapkan.",
      saveProfileAction: "Simpan Profil",
    },
    roleModal: {
      title: "Edit Role",
      user: "User",
      role: "Role",
    },
    deleteModal: {
      title: "Hapus User",
      desc: "Tindakan ini tidak dapat dibatalkan",
      confirmPrefix: "Apakah Anda yakin ingin menghapus",
      confirmSuffix: "dari sistem?",
      delete: "Hapus",
    },
    addUser: {
      successTitle: "User Berhasil Ditambahkan",
      title: "Tambah User Baru",
      successSubtitle: "Simpan kredensial di bawah ini",
      subtitle: "Undang user baru dengan alamat email",
      addedAs: "berhasil ditambahkan sebagai",
      loginCredentials: "Kredensial Login",
      temporaryPassword: "Password Sementara",
      copied: "Tersalin!",
      copyCredentials: "Salin Kredensial",
      important: "Penting!",
      warning: "Kirimkan kredensial ini ke user melalui kanal yang aman. User disarankan segera mengganti password setelah login pertama.",
      emailLabel: "Alamat Email",
      emailPlaceholder: "contoh@bio-inspector.id",
      emailHelp: "Masukkan email aktif user yang ingin ditambahkan ke sistem",
      fullName: "Nama Lengkap",
      namePlaceholder: "Masukkan nama lengkap",
      role: "Role",
      passwordInfo: <>Password sementara akan di-<strong>generate otomatis</strong> oleh sistem dan ditampilkan setelah user berhasil ditambahkan.</>,
      superAdminOnly: "Hanya Super Admin yang dapat menambahkan user",
      done: "Selesai",
      add: "Tambah User",
      emailRequired: "Email wajib diisi",
      emailInvalid: "Format email tidak valid",
      nameRequired: "Nama user wajib diisi",
      roleMissing: "Role tidak ditemukan",
      serverFailed: "Gagal menghubungi server",
      createFailed: "Gagal menambahkan user",
      passwordLabel: "Password Sementara",
    },
    common: {
      cancel: "Batal",
      save: "Simpan",
      done: "Selesai",
      unknownError: "Unknown error",
      saveSpeciesFailed: "Gagal menyimpan spesies",
      contactServerError: "Terjadi kesalahan saat menghubungi server",
    },
  },
} as const;

const isSuperAdminRole = (role: string) => role.trim().toLowerCase() === "super admin";

const formatUserLastLogin = (lastLoginAt: string | undefined, role: string, language: keyof typeof ADMIN_COPY) => {
  if (isSuperAdminRole(role)) return "";

  return lastLoginAt ? new Date(lastLoginAt).toLocaleString(language === "id" ? "id-ID" : "en-US", {
    dateStyle: 'medium',
    timeStyle: 'short'
  }) : "-";
};

/* ───────────── COMPONENT ───────────── */

export default function AdminPage() {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = getAdminTabFromPath(pathname);
  const [speciesSearch, setSpeciesSearch] = useState("");
  const [logFilter, setLogFilter] = useState<LogLevel | "all">("all");
  const { user, logout, updatePassword } = useAuth();
  const { language } = useLanguage();
  const copy = ADMIN_COPY[language];
  const [confirmAction, setConfirmAction] = useState<AdminConfirmAction | null>(null);

  // Check if current user is Super Admin
  const isSuperAdmin = user?.role === "Super Admin";

  // User management state (must be declared before fetch functions)
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [isLoadingSpecies, setIsLoadingSpecies] = useState(true);
  const [speciesData, setSpeciesData] = useState<DisplaySpecies[]>([]);

  // Fetch functions
  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/roles");
      const json = await res.json();
      if (json.success && json.data) {
        setRoles(json.data);
        return json.data as ApiRole[];
      }
    } catch (e) { console.error("Failed to fetch roles:", e); }
    return [] as ApiRole[];
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const [usersRes, rolesData] = await Promise.all([
        fetch("/api/v1/users?limit=100"),
        fetchRoles(),
      ]);
      const usersJson = await usersRes.json();
      const roleMap: Record<number, string> = {};
      rolesData.forEach(r => { roleMap[r.id] = r.name; });
      const mapApiUserToDisplayUser = (u: ApiUser): DisplayUser => {
        const roleId = u.roleId || u.role_id || 0;
        const roleName = u.roleName || u.role_name || u.role || roleMap[roleId] || "User";
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: roleName === "Field Officer" ? "Ranger" : roleName,
          roleId,
          status: u.status || "Active",
          lastLogin: formatUserLastLogin(u.lastLoginAt, roleName, language),
        };
      };

      if (usersJson.success && usersJson.data) {
        setUsers(usersJson.data.map(mapApiUserToDisplayUser));
      }
    } catch (e) { console.error("Failed to fetch users:", e); }
  }, [fetchRoles, language]);

  const fetchSpecies = useCallback(async () => {
    setIsLoadingSpecies(true);
    try {
      const res = await fetch("/api/v1/plants?limit=100");
      const json = await res.json();
      if (json.success && json.data) {
        setSpeciesData(json.data.map((p: ApiPlant) => ({
          id: p.id,
          scientificName: getScientificNameWithAuthor(p.scientificName || p.scientific_name || ""),
          commonName: p.commonName || p.common_name || "",
          family: p.family || "",
          genus: p.genus || "",
          botanicalDescription: p.botanicalDescription || p.botanical_description || "",
          botanicalDescriptionEn: p.botanicalDescriptionEn || p.botanical_description_en || p.botanicalDescription || p.botanical_description || "",
          botanicalDescriptionId: p.botanicalDescriptionId || p.botanical_description_id || p.botanicalDescription || p.botanical_description || "",
          ecologicalInformation: p.ecologicalInformation || p.ecological_information || "",
          ecologicalInformationEn: p.ecologicalInformationEn || p.ecological_information_en || p.ecologicalInformation || p.ecological_information || "",
          ecologicalInformationId: p.ecologicalInformationId || p.ecological_information_id || p.ecologicalInformation || p.ecological_information || "",
          environmentalImpact: p.environmentalImpact || p.environmental_impact || "",
          environmentalImpactEn: p.environmentalImpactEn || p.environmental_impact_en || p.environmentalImpact || p.environmental_impact || "",
          environmentalImpactId: p.environmentalImpactId || p.environmental_impact_id || p.environmentalImpact || p.environmental_impact || "",
          imagePath: p.imagePath || p.image_path || "",
          kingdom: p.kingdom || "",
          phylum: p.phylum || "",
          taxClass: p.taxClass || p.tax_class || p.class || "",
          orderRank: p.orderRank || p.order_rank || p.order || "",
          taxSpecies: p.taxSpecies || p.tax_species || p.species || "",
          source: p.source || p.sourceReference || p.source_reference || "",
          imageSource: p.imageSource || p.image_source || p.imageReference || p.image_reference || "",
          lastUpdated: p.updatedAt || p.updated_at || "-",
        })));
      }
    } catch (e) { console.error("Failed to fetch species:", e); }
    setIsLoadingSpecies(false);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchSpecies();
  }, [fetchUsers, fetchSpecies]);
  const [editRoleUser, setEditRoleUser] = useState<DisplayUser | null>(null);
  const [editRoleValue, setEditRoleValue] = useState("");
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<DisplayUser | null>(null);

  // Add User modal state (Super Admin only)
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserForm, setAddUserForm] = useState({ email: "", name: "", role: "Researcher" });
  const [addUserError, setAddUserError] = useState("");
  const [addUserCreatedCreds, setAddUserCreatedCreds] = useState<{ email: string; password: string; name: string; role: string } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Auto-generate a secure temporary password
  const generateTempPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    const specialChars = "!@#$%";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    // Shuffle
    return password.split("").sort(() => Math.random() - 0.5).join("");
  };

  const handleOpenAddUser = () => {
    if (!isSuperAdmin) return;
    setAddUserForm({ email: "", name: "", role: "Researcher" });
    setAddUserError("");
    setAddUserCreatedCreds(null);
    setCopiedCreds(false);
    setShowAddUser(true);
  };

  const handleAddUserSubmit = async () => {
    setAddUserError("");

    if (!addUserForm.email.trim()) { setAddUserError(copy.addUser.emailRequired); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(addUserForm.email.trim())) { setAddUserError(copy.addUser.emailInvalid); return; }
    if (!addUserForm.name.trim()) { setAddUserError(copy.addUser.nameRequired); return; }

    const tempPassword = generateTempPassword();
    // Handle "Ranger" mapping to "Field Officer" if database hasn't been updated
    const searchRoleName = addUserForm.role === "Ranger" ? "Field Officer" : addUserForm.role;
    const selectedRole = roles.find(r => r.name === addUserForm.role) || roles.find(r => r.name === searchRoleName);
    if (!selectedRole) { setAddUserError(copy.addUser.roleMissing); return; }

    try {
      const res = await fetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addUserForm.name.trim(),
          email: addUserForm.email.trim(),
          password: tempPassword,
          confirmPassword: tempPassword,
          roleId: selectedRole.id,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setAddUserError(json.error?.message || copy.addUser.createFailed); return; }

      setAddUserCreatedCreds({ email: addUserForm.email.trim(), password: tempPassword, name: addUserForm.name.trim(), role: addUserForm.role });
      fetchUsers();
    } catch { setAddUserError(copy.addUser.serverFailed); }
  };

  const fallbackCopyText = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      const copied = document.execCommand("copy");
      if (!copied) {
        window.prompt(copy.addUser.copyCredentials, text);
        return;
      }
      setCopiedCreds(true);
      setTimeout(() => setCopiedCreds(false), 2000);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const handleCopyCredentials = async () => {
    if (!addUserCreatedCreds) return;
    const text = `Email: ${addUserCreatedCreds.email}\n${copy.addUser.passwordLabel}: ${addUserCreatedCreds.password}`;

    try {
      if (!navigator.clipboard || !window.isSecureContext) {
        fallbackCopyText(text);
        return;
      }

      await navigator.clipboard.writeText(text);
      setCopiedCreds(true);
      setTimeout(() => setCopiedCreds(false), 2000);
    } catch {
      fallbackCopyText(text);
    }
  };

  const mapApiUserToDisplayUser = useCallback((u: ApiUser, rolesData = roles): DisplayUser => {
    const roleId = u.roleId || u.role_id || 0;
    const roleName = u.roleName || u.role_name || u.role || rolesData.find((role) => role.id === roleId)?.name || "User";

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: roleName === "Field Officer" ? "Ranger" : roleName,
      roleId,
      status: u.status || "Active",
      lastLogin: formatUserLastLogin(u.lastLoginAt, roleName, language),
    };
  }, [language, roles]);

  const handleEditRole = async (u: DisplayUser) => {
    if (!isSuperAdmin) return;
    let userDetail = u;

    try {
      const res = await fetch(`/api/v1/users/${u.id}`);
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        userDetail = mapApiUserToDisplayUser(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch user detail:", error);
    }

    setEditRoleUser(userDetail);
    setEditRoleValue(userDetail.role);
  };

  const submitRoleChange = async () => {
    if (!editRoleUser) return;
    const searchRoleName = editRoleValue === "Ranger" ? "Field Officer" : editRoleValue;
    const selectedRole = roles.find(r => r.name === editRoleValue) || roles.find(r => r.name === searchRoleName);
    if (!selectedRole) return;
    try {
      await fetch(`/api/v1/users/${editRoleUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: selectedRole.id }),
      });
      fetchUsers();
    } catch (e) { console.error("Failed to update role:", e); }
    setEditRoleUser(null);
  };

  const handleDeleteUser = (u: DisplayUser) => {
    if (!isSuperAdmin) return;
    setDeleteConfirmUser(u);
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      await fetch(`/api/v1/users/${deleteConfirmUser.id}`, { method: "DELETE" });
      fetchUsers();
    } catch (e) { console.error("Failed to delete user:", e); }
    setDeleteConfirmUser(null);
  };

  // Profile modal state
  const [showProfile, setShowProfile] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    country: "Indonesia",
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    repeatNewPassword: "",
    currentPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({
    repeatNewPassword: "",
    currentPassword: "",
  });

  const openProfile = async () => {
    let profileUser = user;

    if (user?.id) {
      try {
        const res = await fetch(`/api/v1/users/${user.id}`);
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          const detail = mapApiUserToDisplayUser(json.data);
          profileUser = {
            id: detail.id,
            name: detail.name,
            email: detail.email,
            role: detail.role,
          };
        }
      } catch (error) {
        console.error("Failed to fetch profile user detail:", error);
      }
    }

    const nameParts = (profileUser?.name || "Admin").split(" ");
    setProfileForm({
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: profileUser?.email || "",
      country: "Indonesia",
    });
    setPasswordForm({ newPassword: "", repeatNewPassword: "", currentPassword: "" });
    setPasswordErrors({ repeatNewPassword: "", currentPassword: "" });
    setProfileEditing(false);
    setShowProfile(true);
  };

  const handleSaveProfile = () => {
    setProfileEditing(false);
    setShowProfile(false);
    router.push("/admin/users");
  };

  const handleChangePassword = async () => {
    const errors = { repeatNewPassword: "", currentPassword: "" };
    let hasError = false;

    if (!passwordForm.newPassword.trim()) {
      errors.repeatNewPassword = "";
      // No error for new password field itself, but we need it filled
    }
    if (!passwordForm.repeatNewPassword.trim()) {
      errors.repeatNewPassword = copy.profileModal.repeatRequired;
      hasError = true;
    } else if (passwordForm.newPassword !== passwordForm.repeatNewPassword) {
      errors.repeatNewPassword = copy.profileModal.mismatch;
      hasError = true;
    }
    if (!passwordForm.currentPassword.trim()) {
      errors.currentPassword = copy.profileModal.currentRequired;
      hasError = true;
    }

    setPasswordErrors(errors);
    if (hasError) return;

    // Actually update the password via API (or local fallback)
    const success = await updatePassword(
      user?.email || "",
      passwordForm.currentPassword,
      passwordForm.newPassword
    );

    if (!success) {
      setPasswordErrors({ repeatNewPassword: "", currentPassword: copy.profileModal.currentWrong });
      return;
    }

    // Success — reset form, close modal, go to User Management
    setPasswordForm({ newPassword: "", repeatNewPassword: "", currentPassword: "" });
    setPasswordErrors({ repeatNewPassword: "", currentPassword: "" });
    setShowProfile(false);
    setProfileEditing(false);
    router.push("/admin/users");
  };

  // Species management state
  const [showAddSpecies, setShowAddSpecies] = useState(false);
  const [speciesForm, setSpeciesForm] = useState({
    id: 0,
    scientificName: "",
    commonName: "",
    family: "",
    genus: "",
    botanicalDescription: "",
    botanicalDescriptionEn: "",
    botanicalDescriptionId: "",
    ecologicalInformation: "",
    ecologicalInformationEn: "",
    ecologicalInformationId: "",
    environmentalImpact: "",
    environmentalImpactEn: "",
    environmentalImpactId: "",
    imagePath: "",
    imageSource: readStoredSpeciesImageSourceText(0, ""),
    kingdom: "",
    phylum: "",
    taxClass: "",
    order: "",
    taxSpecies: "",
    source: readStoredSpeciesSourceText(0, ""),
  });
  const [deleteSpeciesConfirm, setDeleteSpeciesConfirm] = useState<DisplaySpecies | null>(null);
  const [isUploadingSketch, setIsUploadingSketch] = useState(false);
  const sketchFileInputRef = useRef<HTMLInputElement>(null);

  const handleSketchUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingSketch(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/v1/plants/upload-sketch", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok && json.success) {
        setSpeciesForm((prev) => ({ ...prev, imagePath: json.data.path }));
      } else {
        alert(getErrorMessage(json.error, "Upload failed"));
      }
    } catch {
      alert("Upload failed");
    } finally {
      setIsUploadingSketch(false);
    }
  };

  const handleOpenAddSpecies = () => {
    setSpeciesForm({
      id: 0,
      scientificName: "",
      commonName: "",
      family: "",
      genus: "",
      botanicalDescription: "",
      botanicalDescriptionEn: "",
      botanicalDescriptionId: "",
      ecologicalInformation: "",
      ecologicalInformationEn: "",
      ecologicalInformationId: "",
      environmentalImpact: "",
      environmentalImpactEn: "",
      environmentalImpactId: "",
      imagePath: "",
      imageSource: readStoredSpeciesImageSourceText(0, ""),
      kingdom: "",
      phylum: "",
      taxClass: "",
      order: "",
      taxSpecies: "",
      source: readStoredSpeciesSourceText(0, ""),
    });
    setShowAddSpecies(true);
  };

  const handleEditSpecies = (s: DisplaySpecies) => {
    const localTaxonomy = readStoredSpeciesTaxonomy(s.id, s.scientificName);
    setSpeciesForm({
      id: s.id,
      scientificName: s.scientificName,
      commonName: s.commonName,
      family: s.family,
      genus: s.genus || "",
      botanicalDescription: s.botanicalDescription || "",
      botanicalDescriptionEn: s.botanicalDescriptionEn || s.botanicalDescription || "",
      botanicalDescriptionId: s.botanicalDescriptionId || s.botanicalDescription || "",
      ecologicalInformation: s.ecologicalInformation || "",
      ecologicalInformationEn: s.ecologicalInformationEn || s.ecologicalInformation || "",
      ecologicalInformationId: s.ecologicalInformationId || s.ecologicalInformation || "",
      environmentalImpact: s.environmentalImpact || "",
      environmentalImpactEn: s.environmentalImpactEn || s.environmentalImpact || "",
      environmentalImpactId: s.environmentalImpactId || s.environmentalImpact || "",
      imagePath: s.imagePath || "",
      imageSource: s.imageSource || readStoredSpeciesImageSourceText(s.id, s.scientificName) || "",
      kingdom: s.kingdom || localTaxonomy.kingdom,
      phylum: s.phylum || localTaxonomy.phylum,
      taxClass: s.taxClass || localTaxonomy.taxClass,
      order: s.orderRank || localTaxonomy.order,
      taxSpecies: s.taxSpecies || localTaxonomy.taxSpecies,
      source: s.source || readStoredSpeciesSourceText(s.id, s.scientificName) || "",
    });
    setShowAddSpecies(true);
  };

  const displayedBotanicalDescription = language === "id"
    ? speciesForm.botanicalDescriptionId
    : speciesForm.botanicalDescriptionEn;
  const displayedEcologicalInformation = language === "id"
    ? speciesForm.ecologicalInformationId
    : speciesForm.ecologicalInformationEn;
  const displayedEnvironmentalImpact = language === "id"
    ? speciesForm.environmentalImpactId
    : speciesForm.environmentalImpactEn;

  const updateLocalizedSpeciesText = (
    field: "botanicalDescription" | "ecologicalInformation" | "environmentalImpact",
    value: string,
  ) => {
    setSpeciesForm((prev) => {
      if (field === "botanicalDescription") {
        return language === "id"
          ? { ...prev, botanicalDescription: value, botanicalDescriptionId: value }
          : { ...prev, botanicalDescription: value, botanicalDescriptionEn: value };
      }
      if (field === "ecologicalInformation") {
        return language === "id"
          ? { ...prev, ecologicalInformation: value, ecologicalInformationId: value }
          : { ...prev, ecologicalInformation: value, ecologicalInformationEn: value };
      }
      return language === "id"
        ? { ...prev, environmentalImpact: value, environmentalImpactId: value }
        : { ...prev, environmentalImpact: value, environmentalImpactEn: value };
    });
  };

  const handleSaveSpecies = async () => {
    if (!speciesForm.scientificName.trim() || !speciesForm.family.trim()) return;
    const botanicalDescription = (
      language === "id"
        ? speciesForm.botanicalDescriptionId
        : speciesForm.botanicalDescriptionEn
    ).trim() || speciesForm.botanicalDescription.trim() || "-";
    const ecologicalInformation = (
      language === "id"
        ? speciesForm.ecologicalInformationId
        : speciesForm.ecologicalInformationEn
    ).trim() || speciesForm.ecologicalInformation.trim() || "-";
    const environmentalImpact = (
      language === "id"
        ? speciesForm.environmentalImpactId
        : speciesForm.environmentalImpactEn
    ).trim() || speciesForm.environmentalImpact.trim() || "-";
    const sourceText = speciesForm.source?.trim() || "";
    const imageSourceText = speciesForm.imageSource?.trim() || "";

    try {
      const buildPlantFormData = (fields: Record<string, string>) => {
        const fd = new FormData();
        Object.entries(fields).forEach(([key, val]) => fd.append(key, val));
        return fd;
      };

      let res;
      if (speciesForm.id === 0) {
        res = await fetch("/api/v1/plants", {
          method: "POST",
          body: buildPlantFormData({
            commonName: speciesForm.commonName.trim() || speciesForm.scientificName.trim(),
            scientificName: speciesForm.scientificName.trim(),
            family: speciesForm.family.trim(),
            genus: speciesForm.genus.trim() || speciesForm.family.trim(),
            botanicalDescription,
            ecologicalInformation,
            environmentalImpact,
            imagePath: speciesForm.imagePath.trim(),
            kingdom: speciesForm.kingdom.trim(),
            phylum: speciesForm.phylum.trim(),
            class: speciesForm.taxClass.trim(),
            order: speciesForm.order.trim(),
            species: speciesForm.taxSpecies.trim(),
            sourceReference: sourceText,
            imageReference: imageSourceText,
          }),
        });
      } else {
        res = await fetch(`/api/v1/plants/${speciesForm.id}`, {
          method: "PATCH",
          body: buildPlantFormData({
            commonName: speciesForm.commonName.trim(),
            scientificName: speciesForm.scientificName.trim(),
            family: speciesForm.family.trim(),
            genus: speciesForm.genus.trim(),
            botanicalDescription,
            ecologicalInformation,
            environmentalImpact,
            imagePath: speciesForm.imagePath.trim(),
            kingdom: speciesForm.kingdom.trim(),
            phylum: speciesForm.phylum.trim(),
            class: speciesForm.taxClass.trim(),
            order: speciesForm.order.trim(),
            species: speciesForm.taxSpecies.trim(),
            sourceReference: sourceText,
            imageReference: imageSourceText,
          }),
        });
      }

      const result = res ? await res.json() : null;

      if (res && res.ok) {
        const savedSpeciesId = result?.data?.id || speciesForm.id;
        writeStoredSpeciesSourceText(savedSpeciesId, speciesForm.scientificName.trim(), sourceText);
        writeStoredSpeciesImageSourceText(savedSpeciesId, speciesForm.scientificName.trim(), imageSourceText);
        writeStoredSpeciesTaxonomy(savedSpeciesId, speciesForm.scientificName.trim(), {
          kingdom: speciesForm.kingdom.trim(),
          phylum: speciesForm.phylum.trim(),
          taxClass: speciesForm.taxClass.trim(),
          order: speciesForm.order.trim(),
          taxSpecies: speciesForm.taxSpecies.trim(),
        });
        await fetchSpecies();
        setShowAddSpecies(false);
      } else {
        console.error("Failed to save species:", result);
        alert(`${copy.common.saveSpeciesFailed}: ${result?.error?.message || copy.common.unknownError}`);
      }
    } catch (e) { 
      console.error("Failed to save species:", e); 
      alert(copy.common.contactServerError);
    }
  };

  const handleDeleteSpecies = (s: DisplaySpecies) => {
    setDeleteSpeciesConfirm(s);
  };

  const confirmDeleteSpecies = async () => {
    if (!deleteSpeciesConfirm) return;
    try {
      const res = await fetch(`/api/v1/plants/${deleteSpeciesConfirm.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSpeciesData(prev => prev.filter(s => s.id !== deleteSpeciesConfirm.id));
      } else {
        console.error("Failed to delete species from API");
      }
    } catch (e) {
      console.error("Error deleting species:", e);
    }
    setDeleteSpeciesConfirm(null);
  };

  const filteredSpecies = speciesData.filter(s =>
    s.scientificName.toLowerCase().includes(speciesSearch.toLowerCase()) ||
    s.commonName.toLowerCase().includes(speciesSearch.toLowerCase())
  );

  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch("/api/v1/audit?limit=100");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSystemLogs(json.data.map(mapAuditLog));
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const addLog = (level: LogLevel, source: string, message: string, userStr?: string) => {
    const actorId = user?.id ? String(user.id) : userStr || user?.email || user?.name || "Admin";
    const optimisticLog: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      level,
      source,
      message,
      user: userStr || user?.name || "Admin",
    };

    setSystemLogs(prev => [
      optimisticLog,
      ...prev
    ]);

    fetch("/api/v1/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actorId,
        entityId: String(optimisticLog.id),
        entityType: source,
        action: level.toUpperCase(),
        message,
      }),
    })
      .then((res) => res.ok ? fetchAuditLogs() : undefined)
      .catch((error) => console.error("Failed to write audit log:", error));
  };

  const filteredLogs = logFilter === "all"
    ? systemLogs
    : systemLogs.filter((log) => log.level === logFilter);

  const getConfirmContent = () => {
    switch (confirmAction) {
      case "logout":
        return {
          title: copy.confirm.logoutTitle,
          description: copy.confirm.logoutDesc,
          action: copy.confirm.logoutAction,
          destructive: true,
        };
      case "addSpecies":
        return {
          title: copy.confirm.addSpeciesTitle,
          description: copy.confirm.addSpeciesDesc,
          action: copy.confirm.addSpeciesAction,
          destructive: false,
        };
      case "editSpecies":
        return {
          title: copy.confirm.editSpeciesTitle,
          description: copy.confirm.editSpeciesDesc,
          action: copy.confirm.editSpeciesAction,
          destructive: false,
        };
      case "saveProfile":
        return {
          title: copy.confirm.saveProfileTitle,
          description: copy.confirm.saveProfileDesc,
          action: copy.confirm.saveProfileAction,
          destructive: false,
        };
      default:
        return null;
    }
  };

  const handleConfirmAction = () => {
    const action = confirmAction;
    setConfirmAction(null);

    if (action === "logout") {
      void logout();
      return;
    }
    if (action === "saveProfile") {
      handleSaveProfile();
      return;
    }
    if (action === "addSpecies" || action === "editSpecies") {
      void handleSaveSpecies();
    }
  };

  const confirmContent = getConfirmContent();

  return (
    <div className="p-6 space-y-6">
      {/* Admin Header with User Info & Logout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{user?.name || copy.fallbackAdmin}</p>
            <p className="text-xs text-muted-foreground">{user?.email} • {user?.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openProfile}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <User className="h-4 w-4" />
            {copy.profile}
          </button>
          <button
            onClick={() => setConfirmAction("logout")}
            className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {copy.logout}
          </button>
        </div>
      </div>

      {/* ─── USER MANAGEMENT TAB ─── */}
      {activeTab === "users" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: copy.users.total, value: String(users.length), icon: Users, color: "text-blue-600 bg-blue-50" },
              { label: copy.users.active, value: String(users.filter(u => u.status === "Active").length), icon: Activity, color: "text-green-600 bg-green-50" },
              { label: copy.users.admins, value: String(users.filter(u => u.role.includes("Admin")).length), icon: ShieldCheck, color: "text-purple-600 bg-purple-50" },
              { label: copy.users.roles, value: String(roles.filter(r => r.name !== 'Super Admin').length), icon: UserPlus, color: "text-amber-600 bg-amber-50" },
            ].map((stat) => (
              <div key={stat.label} className="stat-card flex items-center gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">{copy.users.title}</h2>
              {isSuperAdmin ? (
                <button
                  onClick={handleOpenAddUser}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  {copy.users.add}
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed" title={copy.users.superAdminOnlyTitle}>
                  <Lock className="h-4 w-4" />
                  {copy.users.add}
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {copy.users.columns.slice(0, isSuperAdmin ? 6 : 5).map((column) => (
                      <th key={column} className="px-6 py-3 text-left font-medium text-muted-foreground">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{u.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${u.role === "Admin" ? "bg-purple-100 text-purple-700" :
                          u.role === "Researcher" ? "bg-blue-100 text-blue-700" :
                            "bg-green-100 text-green-700"
                          }`}>{u.role}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${u.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${u.status === "Active" ? "bg-green-500" : "bg-gray-400"}`} />
                          {u.status === "Active" ? copy.users.activeStatus : copy.users.inactiveStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{u.lastLogin}</td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditRole(u)}
                              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              title={copy.users.editRole}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                              title={copy.users.deleteUser}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── SPECIES MANAGEMENT TAB ─── */}
      {activeTab === "species" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: copy.species.total, value: isLoadingSpecies ? "..." : String(speciesData.length), color: "text-emerald-600" },
              { label: copy.species.families, value: isLoadingSpecies ? "..." : String(new Set(speciesData.map(s => s.family)).size), color: "text-blue-600" },
              { label: copy.species.lastUpdated, value: copy.species.today, color: "text-amber-600" },
            ].map((stat) => (
              <div key={stat.label} className="stat-card">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border bg-card shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b px-6 py-4">
              <h2 className="text-lg font-semibold">{copy.species.records}</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={copy.species.search}
                    value={speciesSearch}
                    onChange={(e) => setSpeciesSearch(e.target.value)}
                    className="h-9 w-56 rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>
                <button onClick={handleOpenAddSpecies} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Plus className="h-4 w-4" />
                  {copy.species.add}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {copy.species.columns.map((column) => (
                      <th key={column} className="px-6 py-3 text-left font-medium text-muted-foreground">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSpecies.map((species) => (
                    <tr key={species.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium italic">{species.scientificName}</td>
                      <td className="px-6 py-4 text-muted-foreground">{species.commonName}</td>
                      <td className="px-6 py-4 text-muted-foreground">{species.family}</td>
                      <td className="px-6 py-4 text-muted-foreground">{species.genus}</td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">{species.lastUpdated ? new Date(species.lastUpdated).toLocaleDateString(language === "id" ? "id-ID" : "en-US") : '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/species/${createSpeciesSlug(species.scientificName)}`}
                            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title={copy.species.viewDetail}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button onClick={() => handleEditSpecies(species)} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title={copy.species.edit}><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteSpecies(species)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title={copy.species.delete}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── SYSTEM LOGS TAB ─── */}
      {activeTab === "logs" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b px-6 py-4">
              <div className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">{copy.logs.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                {(["all", "info", "warning", "error", "success"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setLogFilter(level)}
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${logFilter === level
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                  >
                    {copy.logs.filters[level]}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y">
              {isLoadingLogs && (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Loading audit logs...
                </div>
              )}
              {!isLoadingLogs && filteredLogs.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No audit logs found.
                </div>
              )}
              {!isLoadingLogs && filteredLogs.map((log) => {
                const style = LEVEL_STYLES[log.level];
                const Icon = style.icon;
                return (
                  <div key={log.id} className="flex items-start gap-3 px-6 py-3 hover:bg-muted/30 transition-colors">
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${style.text}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${style.bg} ${style.text}`}>{copy.logs.levels[log.level]}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{copy.logs.sources[log.source as keyof typeof copy.logs.sources] || log.source}</span>
                        {log.user && <span className="text-xs text-muted-foreground">{copy.logs.by} {log.user}</span>}
                      </div>
                      <p className="mt-1 text-sm">{log.message}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">{log.timestamp}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── DATA ANNOTATION TAB ─── */}
      {activeTab === "annotation" && (
        <AdminDataAnnotationPanel 
          adminName={user?.name || "Admin"} 
          onLog={(level, source, message) => addLog(level, source, message)}
        />
      )}

      {/* ─── PROFILE MODAL ─── */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card shadow-2xl border animate-in zoom-in-95 duration-200">
            {/* Header bar */}
            <div className={`flex items-center justify-between px-6 py-3 rounded-t-2xl transition-colors ${profileEditing ? "bg-primary" : "bg-muted/60"
              }`}>
              <button
                onClick={() => setShowProfile(false)}
                className={`p-1.5 rounded-lg transition-colors ${profileEditing ? "hover:bg-white/20 text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                  }`}
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${profileEditing ? "text-primary-foreground" : "text-muted-foreground"
                  }`}>
                  {profileEditing ? copy.profileModal.stop : copy.profileModal.start}
                </span>
                <button
                  onClick={() => setProfileEditing(!profileEditing)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profileEditing ? "bg-white/30" : "bg-muted-foreground/30"
                    }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${profileEditing ? "translate-x-6" : "translate-x-1"
                    }`} />
                </button>
              </div>
            </div>

            {/* Profile fields */}
            <div className="px-8 py-8 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{copy.profileModal.firstName}</label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm(p => ({ ...p, firstName: e.target.value }))}
                    disabled={!profileEditing}
                    className="w-full border-0 border-b border-border bg-transparent pb-2 text-base font-medium text-foreground outline-none focus:border-primary transition-colors disabled:opacity-70 disabled:cursor-default"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{copy.profileModal.lastName}</label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm(p => ({ ...p, lastName: e.target.value }))}
                    disabled={!profileEditing}
                    className="w-full border-0 border-b border-border bg-transparent pb-2 text-base font-medium text-foreground outline-none focus:border-primary transition-colors disabled:opacity-70 disabled:cursor-default"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{copy.profileModal.email}</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))}
                    disabled={!profileEditing}
                    className="w-full border-0 border-b border-border bg-transparent pb-2 text-base font-medium text-foreground outline-none focus:border-primary transition-colors disabled:opacity-70 disabled:cursor-default"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{copy.profileModal.country}</label>
                  <input
                    type="text"
                    value={profileForm.country}
                    onChange={(e) => setProfileForm(p => ({ ...p, country: e.target.value }))}
                    disabled={!profileEditing}
                    className="w-full border-0 border-b border-border bg-transparent pb-2 text-base font-medium text-foreground outline-none focus:border-primary transition-colors disabled:opacity-70 disabled:cursor-default"
                  />
                </div>

              </div>

              {profileEditing && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setConfirmAction("saveProfile")}
                    className="text-sm font-semibold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
                  >
                    {copy.profileModal.save}
                  </button>
                </div>
              )}

              {profileEditing && (
                <>
                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Change Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{copy.profileModal.newPassword}</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                        className="w-full border-0 border-b border-border bg-transparent pb-2 text-base font-medium text-foreground outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        {copy.profileModal.repeatPassword} <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="password"
                        value={passwordForm.repeatNewPassword}
                        onChange={(e) => {
                          setPasswordForm(p => ({ ...p, repeatNewPassword: e.target.value }));
                          if (passwordErrors.repeatNewPassword) setPasswordErrors(p => ({ ...p, repeatNewPassword: "" }));
                        }}
                        className={`w-full border-0 border-b bg-transparent pb-2 text-base font-medium text-foreground outline-none transition-colors ${passwordErrors.repeatNewPassword ? "border-destructive" : "border-border focus:border-primary"
                          }`}
                      />
                      {passwordErrors.repeatNewPassword && (
                        <p className="mt-1 text-xs text-destructive">{passwordErrors.repeatNewPassword}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        {copy.profileModal.currentPassword} <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => {
                          setPasswordForm(p => ({ ...p, currentPassword: e.target.value }));
                          if (passwordErrors.currentPassword) setPasswordErrors(p => ({ ...p, currentPassword: "" }));
                        }}
                        className={`w-full border-0 border-b bg-transparent pb-2 text-base font-medium text-foreground outline-none transition-colors ${passwordErrors.currentPassword ? "border-destructive" : "border-border focus:border-primary"
                          }`}
                      />
                      {passwordErrors.currentPassword && (
                        <p className="mt-1 text-xs text-destructive">{passwordErrors.currentPassword}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleChangePassword}
                      className="text-sm font-semibold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
                    >
                      {copy.profileModal.changePassword}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT ROLE MODAL ─── */}
      {editRoleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl border p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{copy.roleModal.title}</h3>
              <button onClick={() => setEditRoleUser(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{copy.roleModal.user}</p>
              <p className="text-sm font-medium">{editRoleUser.name} ({editRoleUser.email})</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">{copy.roleModal.role}</label>
              <div className="flex flex-wrap gap-2">
                {roles
                  .filter((r) => ["researcher", "ranger", "field officer"].includes(r.name.toLowerCase()))
                  .map((r) => r.name.toLowerCase() === "field officer" ? "Ranger" : r.name)
                  .map((role) => (
                    <button
                      key={role}
                      onClick={() => setEditRoleValue(role)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                        editRoleValue === role
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditRoleUser(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                {copy.common.cancel}
              </button>
              <button
                onClick={submitRoleChange}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {copy.common.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM MODAL ─── */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl border p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{copy.deleteModal.title}</h3>
                <p className="text-sm text-muted-foreground">{copy.deleteModal.desc}</p>
              </div>
            </div>
            <p className="text-sm">
              {copy.deleteModal.confirmPrefix} <span className="font-semibold">{deleteConfirmUser.name}</span> ({deleteConfirmUser.email}) {copy.deleteModal.confirmSuffix}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                {copy.common.cancel}
              </button>
              <button
                onClick={confirmDeleteUser}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 transition-colors"
              >
                {copy.deleteModal.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD USER MODAL (Super Admin Only) ─── */}
      {showAddUser && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-card shadow-2xl border animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  {addUserCreatedCreds ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <UserPlus className="h-5 w-5 text-primary" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{addUserCreatedCreds ? copy.addUser.successTitle : copy.addUser.title}</h3>
                  <p className="text-xs text-muted-foreground">{addUserCreatedCreds ? copy.addUser.successSubtitle : copy.addUser.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddUser(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-5">
              {addUserCreatedCreds ? (
                /* ─── Credential Summary Card ─── */
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Success banner */}
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span><strong>{addUserCreatedCreds.name}</strong> {copy.addUser.addedAs} <strong>{addUserCreatedCreds.role}</strong></span>
                  </div>

                  {/* Credential card */}
                  <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-5 space-y-4">
                    <div className="flex items-center gap-2 text-amber-700">
                      <KeyRound className="h-4 w-4" />
                      <span className="text-sm font-semibold">{copy.addUser.loginCredentials}</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Email</p>
                        <p className="text-sm font-mono font-medium bg-white rounded-lg border px-3 py-2">{addUserCreatedCreds.email}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{copy.addUser.temporaryPassword}</p>
                        <p className="text-sm font-mono font-medium bg-white rounded-lg border px-3 py-2 tracking-wide">{addUserCreatedCreds.password}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCredentials}
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                        copiedCreds
                          ? "bg-green-100 border-green-300 text-green-700"
                          : "bg-white border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {copiedCreds ? (
                        <><CheckCircle2 className="h-4 w-4" /> {copy.addUser.copied}</>
                      ) : (
                        <><Copy className="h-4 w-4" /> {copy.addUser.copyCredentials}</>
                      )}
                    </button>
                  </div>

                  {/* Warning note */}
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{copy.addUser.important}</p>
                      <p>{copy.addUser.warning}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* ─── Add User Form ─── */
                <>
                  {/* Email field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{copy.addUser.emailLabel} <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                      <input
                        type="email"
                        value={addUserForm.email}
                        onChange={(e) => {
                          setAddUserForm(f => ({ ...f, email: e.target.value }));
                          if (addUserError) setAddUserError("");
                        }}
                        placeholder={copy.addUser.emailPlaceholder}
                        className={`w-full h-11 rounded-lg border bg-background pl-9 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 ${
                          addUserError ? "border-destructive focus:ring-destructive/20" : "border-border"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{copy.addUser.emailHelp}</p>
                  </div>

                  {/* Name field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{copy.addUser.fullName} <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      value={addUserForm.name}
                      onChange={(e) => {
                        setAddUserForm(f => ({ ...f, name: e.target.value }));
                        if (addUserError) setAddUserError("");
                      }}
                      placeholder={copy.addUser.namePlaceholder}
                      className="w-full h-11 rounded-lg border border-border bg-background px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Role selection */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{copy.addUser.role}</label>
                    <div className="flex flex-wrap gap-2">
                      {roles
                        .filter((r) => ["researcher", "ranger", "field officer"].includes(r.name.toLowerCase()))
                        .map((r) => r.name.toLowerCase() === "field officer" ? "Ranger" : r.name)
                        .map((role) => (
                          <button
                            key={role}
                            onClick={() => setAddUserForm(f => ({ ...f, role }))}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                              addUserForm.role === role
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-muted-foreground border-border hover:bg-muted"
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Password info */}
                  <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-700">
                    <KeyRound className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>{copy.addUser.passwordInfo}</p>
                  </div>

                  {/* Error message */}
                  {addUserError && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {addUserError}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t px-6 py-4">
              <p className="text-xs text-muted-foreground">
                <ShieldCheck className="inline h-3.5 w-3.5 mr-1" />
                {copy.addUser.superAdminOnly}
              </p>
              <div className="flex items-center gap-3">
                {addUserCreatedCreds ? (
                  <button
                    onClick={() => setShowAddUser(false)}
                    className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    {copy.addUser.done}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowAddUser(false)}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                      {copy.common.cancel}
                    </button>
                    <button
                      onClick={handleAddUserSubmit}
                      className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <UserPlus className="inline h-4 w-4 mr-1.5" />
                      {copy.addUser.add}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ─── ADD/EDIT SPECIES MODAL ─── */}
      <Dialog open={showAddSpecies} onOpenChange={setShowAddSpecies}>
        <DialogContent className="w-[min(100vw-2rem,44rem)] max-w-none overflow-hidden rounded-2xl p-0 shadow-2xl">
          <div className="border-b bg-muted/40 px-6 py-5">
            <DialogHeader className="space-y-1 pr-8 text-left">
              <DialogTitle className="text-xl">
                {speciesForm.id === 0 ? copy.species.addTitle : copy.species.editTitle}
              </DialogTitle>
              <DialogDescription>
                {speciesForm.id === 0
                  ? copy.species.addTitle
                  : `${copy.species.updateDetails} ${speciesForm.scientificName ? `(${speciesForm.scientificName})` : ""}`}
              </DialogDescription>
            </DialogHeader>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!speciesForm.scientificName.trim() || !speciesForm.family.trim()) return;
              setConfirmAction(speciesForm.id === 0 ? "addSpecies" : "editSpecies");
            }}
            className="max-h-[calc(90vh-6.5rem)] space-y-5 overflow-y-auto px-6 py-5"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scientificName">{copy.species.scientificName}</Label>
                <Input
                  id="scientificName"
                  value={speciesForm.scientificName}
                  onChange={(e) => setSpeciesForm({ ...speciesForm, scientificName: e.target.value })}
                  placeholder={copy.species.scientificPlaceholder}
                  className="italic"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commonName">{copy.species.commonName}</Label>
                <Input
                  id="commonName"
                  value={speciesForm.commonName}
                  onChange={(e) => setSpeciesForm({ ...speciesForm, commonName: e.target.value })}
                  placeholder={copy.species.commonPlaceholder}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="family">{copy.species.family}</Label>
                <Input
                  id="family"
                  value={speciesForm.family}
                  onChange={(e) => setSpeciesForm({ ...speciesForm, family: e.target.value })}
                  placeholder={copy.species.familyPlaceholder}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genus">{copy.species.genus}</Label>
                <Input
                  id="genus"
                  value={speciesForm.genus}
                  onChange={(e) => setSpeciesForm({ ...speciesForm, genus: e.target.value })}
                  placeholder={copy.species.genusPlaceholder}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="botanicalDescription" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {copy.species.botanicalDescription}
              </Label>
              <Textarea
                id="botanicalDescription"
                value={displayedBotanicalDescription}
                onChange={(e) => updateLocalizedSpeciesText("botanicalDescription", e.target.value)}
                placeholder={copy.species.botanicalPlaceholder}
                rows={4}
                className="min-h-[112px] rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ecologicalInformation" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {copy.species.ecologicalInformation}
              </Label>
              <Textarea
                id="ecologicalInformation"
                value={displayedEcologicalInformation}
                onChange={(e) => updateLocalizedSpeciesText("ecologicalInformation", e.target.value)}
                placeholder={copy.species.ecologicalPlaceholder}
                rows={4}
                className="min-h-[112px] rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="environmentalImpact" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {copy.species.environmentalImpact}
              </Label>
              <Textarea
                id="environmentalImpact"
                value={displayedEnvironmentalImpact}
                onChange={(e) => updateLocalizedSpeciesText("environmentalImpact", e.target.value)}
                placeholder={copy.species.impactPlaceholder}
                rows={4}
                className="min-h-[112px] rounded-xl"
              />
            </div>
            {/* Herbarium Sketch */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {copy.species.herbariumSketch}
              </Label>
              <input
                ref={sketchFileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleSketchUpload(file);
                  e.target.value = "";
                }}
              />
              {speciesForm.imagePath.trim() ? (
                <div className="relative rounded-xl border overflow-hidden bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={speciesForm.imagePath.trim()}
                    alt="Herbarium preview"
                    className="max-h-56 w-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/40 px-3 py-2">
                    <span className="text-xs text-white truncate">{speciesForm.imagePath.split("/").pop()}</span>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => sketchFileInputRef.current?.click()}
                        disabled={isUploadingSketch}
                        className="rounded-md bg-white/20 hover:bg-white/30 px-2.5 py-1 text-xs text-white font-medium transition-colors"
                      >
                        {isUploadingSketch ? "Uploading..." : "Change"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpeciesForm((prev) => ({ ...prev, imagePath: "" }))}
                        className="rounded-md bg-destructive/80 hover:bg-destructive px-2.5 py-1 text-xs text-white font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => sketchFileInputRef.current?.click()}
                  disabled={isUploadingSketch}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 py-8 text-muted-foreground transition-colors hover:bg-muted/40 hover:border-primary/40 disabled:opacity-60"
                >
                  <ImageIcon className="h-8 w-8 opacity-40" />
                  <span className="text-sm font-medium">
                    {isUploadingSketch ? "Uploading..." : "Click to upload JPG or PNG"}
                  </span>
                  <span className="text-xs opacity-60">Max 10 MB</span>
                </button>
              )}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="imageSource" className="text-xs text-muted-foreground">
                  {copy.species.imageSource}
                </Label>
                <Textarea
                  id="imageSource"
                  value={speciesForm.imageSource}
                  onChange={(e) => setSpeciesForm({ ...speciesForm, imageSource: e.target.value })}
                  placeholder={copy.species.imageSourcePlaceholder}
                  rows={2}
                  className="min-h-[72px] rounded-xl"
                />
              </div>
            </div>

            {/* Plant Taxonomy */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {copy.species.taxonomy}
              </Label>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="kingdom" className="text-xs text-muted-foreground">{copy.species.kingdom}</Label>
                  <Input
                    id="kingdom"
                    value={speciesForm.kingdom}
                    onChange={(e) => setSpeciesForm({ ...speciesForm, kingdom: e.target.value })}
                    placeholder={copy.species.kingdomPlaceholder}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phylum" className="text-xs text-muted-foreground">{copy.species.phylum}</Label>
                  <Input
                    id="phylum"
                    value={speciesForm.phylum}
                    onChange={(e) => setSpeciesForm({ ...speciesForm, phylum: e.target.value })}
                    placeholder={copy.species.phylumPlaceholder}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taxClass" className="text-xs text-muted-foreground">{copy.species.taxClass}</Label>
                  <Input
                    id="taxClass"
                    value={speciesForm.taxClass}
                    onChange={(e) => setSpeciesForm({ ...speciesForm, taxClass: e.target.value })}
                    placeholder={copy.species.classPaceholder}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="order" className="text-xs text-muted-foreground">{copy.species.order}</Label>
                  <Input
                    id="order"
                    value={speciesForm.order}
                    onChange={(e) => setSpeciesForm({ ...speciesForm, order: e.target.value })}
                    placeholder={copy.species.orderPlaceholder}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taxFamily" className="text-xs text-muted-foreground">{copy.species.family}</Label>
                  <Input
                    id="taxFamily"
                    value={speciesForm.family}
                    onChange={(e) => setSpeciesForm({ ...speciesForm, family: e.target.value })}
                    placeholder={copy.species.familyPlaceholder}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taxGenus" className="text-xs text-muted-foreground">{copy.species.genus}</Label>
                  <Input
                    id="taxGenus"
                    value={speciesForm.genus}
                    onChange={(e) => setSpeciesForm({ ...speciesForm, genus: e.target.value })}
                    placeholder={copy.species.genusPlaceholder}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taxSpecies" className="text-xs text-muted-foreground">{copy.species.taxSpecies}</Label>
                  <Input
                    id="taxSpecies"
                    value={speciesForm.taxSpecies}
                    onChange={(e) => setSpeciesForm({ ...speciesForm, taxSpecies: e.target.value })}
                    placeholder={copy.species.taxSpeciesPlaceholder}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {copy.species.source}
              </Label>
              <Textarea
                id="source"
                value={speciesForm.source}
                onChange={(e) => setSpeciesForm({ ...speciesForm, source: e.target.value })}
                placeholder={copy.species.sourcePlaceholder}
                rows={4}
                className="min-h-[112px] rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddSpecies(false)}>
                {copy.common.cancel}
              </Button>
              <Button type="submit" disabled={!speciesForm.scientificName.trim() || !speciesForm.family.trim()}>
                {copy.species.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmContent?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmContent?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={confirmContent?.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirmContent?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── DELETE SPECIES CONFIRMATION MODAL ─── */}
      {deleteSpeciesConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-2xl border animate-in zoom-in-95 duration-200 p-6 text-center space-y-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{copy.species.deleteTitle}</h3>
              <p className="text-sm text-muted-foreground">
                {copy.species.deleteDesc} <span className="font-bold italic text-foreground">{deleteSpeciesConfirm.scientificName}</span>? {copy.species.cannotUndo}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setDeleteSpeciesConfirm(null)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                {copy.common.cancel}
              </button>
              <button onClick={confirmDeleteSpecies} className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 transition-colors">
                {copy.species.yesDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
