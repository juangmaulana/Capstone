"use client";

import { Users, UserPlus, ShieldCheck, Activity, Bug, Upload, ScrollText, Database, Plus, Pencil, Trash2, Search, FileSpreadsheet, FileText, CheckCircle2, Clock, AlertCircle, AlertTriangle, Info, Server, Wifi, Filter, LogOut, User, Tag, Download, Eye, X, ChevronDown, ChevronRight, Image as ImageIcon, MapPin, Calendar, ThumbsUp, ThumbsDown, FileDown, BarChart3, Lock, Copy, KeyRound } from "lucide-react";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminDataAnnotationPanel } from "@/components/AdminDataAnnotationPanel";

/* ───────────── TYPES ───────────── */

interface ApiUser {
  id: number;
  name: string;
  email: string;
  roleId: number;
  role_id?: number;
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
  ecologicalInformation?: string;
  ecological_information?: string;
  environmentalImpact?: string;
  environmental_impact?: string;
  updatedAt?: string;
  updated_at?: string;
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
  ecologicalInformation: string;
  environmentalImpact: string;
  lastUpdated: string;
}

type LogLevel = "info" | "warning" | "error" | "success";

interface LogEntry {
  id: number;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  user?: string;
}

const MOCK_LOGS: LogEntry[] = [
  { id: 1, timestamp: "2026-04-15 09:32:14", level: "success", source: "Annotation", message: "Annotated image IMG_20260115_001.jpg — species: Vachellia nilotica", user: "Siti Nurhaliza" },
  { id: 2, timestamp: "2026-04-15 09:28:05", level: "success", source: "Verification", message: "Validated annotation for IMG_20260115_001.jpg", user: "Dr. Andi Prasetyo" },
  { id: 3, timestamp: "2026-04-15 09:15:42", level: "success", source: "Annotation", message: "Annotated image IMG_20260118_002.jpg — species: Lantana camara", user: "Budi Santoso" },
  { id: 4, timestamp: "2026-04-15 08:55:30", level: "success", source: "Verification", message: "Validated annotation for IMG_20260118_002.jpg", user: "Dr. Andi Prasetyo" },
  { id: 5, timestamp: "2026-04-15 08:40:11", level: "success", source: "Annotation", message: "Annotated image IMG_20260205_003.jpg — species: Ageratum conyzoides (corrected from Clitoria ternatea)", user: "Siti Nurhaliza" },
  { id: 6, timestamp: "2026-04-15 08:22:00", level: "warning", source: "Annotation", message: "Annotation for IMG_20260305_006.jpg — image too blurry, marked as Unknown", user: "Siti Nurhaliza" },
  { id: 7, timestamp: "2026-04-15 07:55:18", level: "error", source: "Verification", message: "Rejected annotation for IMG_20260305_006.jpg — image quality insufficient", user: "Dr. Andi Prasetyo" },
  { id: 8, timestamp: "2026-04-14 23:00:00", level: "success", source: "Annotation", message: "Annotated image IMG_20260222_005.jpg — species: Merremia hederacea", user: "Rudi Hermawan" },
  { id: 9, timestamp: "2026-04-14 22:15:33", level: "success", source: "Verification", message: "Validated annotation for IMG_20260210_004.jpg", user: "Dr. Andi Prasetyo" },
  { id: 10, timestamp: "2026-04-14 21:30:00", level: "info", source: "Annotation", message: "Batch Q1 2026 — 2 images remaining for annotation", user: "Dr. Andi Prasetyo" },
];

const LEVEL_STYLES: Record<LogLevel, { bg: string; text: string; icon: typeof Info }> = {
  info: { bg: "bg-blue-100", text: "text-blue-700", icon: Info },
  warning: { bg: "bg-amber-100", text: "text-amber-700", icon: AlertTriangle },
  error: { bg: "bg-red-100", text: "text-red-700", icon: AlertCircle },
  success: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle2 },
};

/* ───────────── ANNOTATION MOCK DATA ───────────── */

type AnnotationStatus = "pending" | "annotated" | "validated" | "rejected";

interface AnnotationItem {
  id: number;
  imageUrl: string;
  filename: string;
  capturedDate: string;
  location: string;
  coordinates: string;
  predictedSpecies: string;
  confidence: number;
  annotatedSpecies?: string;
  annotatedBy?: string;
  annotatedDate?: string;
  validatedBy?: string;
  validatedDate?: string;
  status: AnnotationStatus;
  notes?: string;
}

interface AnnotationBatch {
  id: number;
  period: string;
  dateRange: string;
  totalItems: number;
  pending: number;
  annotated: number;
  validated: number;
  rejected: number;
  status: "in_progress" | "review" | "completed" | "exported";
  createdBy: string;
  createdDate: string;
  items: AnnotationItem[];
}

const MOCK_ANNOTATION_BATCHES: AnnotationBatch[] = [
  {
    id: 1,
    period: "Q1 2026",
    dateRange: "Jan 1 – Mar 31, 2026",
    totalItems: 8,
    pending: 2,
    annotated: 2,
    validated: 3,
    rejected: 1,
    status: "in_progress",
    createdBy: "Dr. Andi Prasetyo",
    createdDate: "2026-04-01",
    items: [
      { id: 101, imageUrl: "/placeholder-species.jpg", filename: "IMG_20260115_001.jpg", capturedDate: "2026-01-15", location: "Savana Bekol, Baluran", coordinates: "-7.8503, 114.3680", predictedSpecies: "Vachellia nilotica", confidence: 0.92, annotatedSpecies: "Vachellia nilotica", annotatedBy: "Siti Nurhaliza", annotatedDate: "2026-04-02", validatedBy: "Dr. Andi Prasetyo", validatedDate: "2026-04-03", status: "validated", notes: "Clear image, correct identification" },
      { id: 102, imageUrl: "/placeholder-species.jpg", filename: "IMG_20260118_002.jpg", capturedDate: "2026-01-18", location: "Pantai Bama, Baluran", coordinates: "-7.8215, 114.3842", predictedSpecies: "Lantana camara", confidence: 0.87, annotatedSpecies: "Lantana camara", annotatedBy: "Budi Santoso", annotatedDate: "2026-04-03", validatedBy: "Dr. Andi Prasetyo", validatedDate: "2026-04-04", status: "validated" },
      { id: 103, imageUrl: "/placeholder-species.jpg", filename: "IMG_20260205_003.jpg", capturedDate: "2026-02-05", location: "Evergreen Forest Trail", coordinates: "-7.8412, 114.3756", predictedSpecies: "Clitoria ternatea", confidence: 0.78, annotatedSpecies: "Ageratum conyzoides", annotatedBy: "Siti Nurhaliza", annotatedDate: "2026-04-05", status: "annotated", notes: "Model predicted wrong — leaves are different" },
      { id: 104, imageUrl: "/placeholder-species.jpg", filename: "IMG_20260210_004.jpg", capturedDate: "2026-02-10", location: "Savana Balanan", coordinates: "-7.8601, 114.3520", predictedSpecies: "Vachellia nilotica", confidence: 0.95, annotatedSpecies: "Vachellia nilotica", annotatedBy: "Budi Santoso", annotatedDate: "2026-04-05", validatedBy: "Dr. Andi Prasetyo", validatedDate: "2026-04-06", status: "validated" },
      { id: 105, imageUrl: "/placeholder-species.jpg", filename: "IMG_20260222_005.jpg", capturedDate: "2026-02-22", location: "Tanjung Sedano", coordinates: "-7.8003, 114.3910", predictedSpecies: "Merremia hederacea", confidence: 0.65, annotatedSpecies: "Merremia hederacea", annotatedBy: "Rudi Hermawan", annotatedDate: "2026-04-06", status: "annotated", notes: "Low confidence — partially occluded by other vegetation" },
      { id: 106, imageUrl: "/placeholder-species.jpg", filename: "IMG_20260305_006.jpg", capturedDate: "2026-03-05", location: "Watu Numpuk", coordinates: "-7.8320, 114.3615", predictedSpecies: "Lantana camara", confidence: 0.43, annotatedSpecies: "Unknown", annotatedBy: "Siti Nurhaliza", annotatedDate: "2026-04-07", status: "rejected", notes: "Image too blurry — cannot identify species" },
      { id: 107, imageUrl: "/placeholder-species.jpg", filename: "IMG_20260312_007.jpg", capturedDate: "2026-03-12", location: "Kramat Area", coordinates: "-7.8550, 114.3700", predictedSpecies: "Ageratum conyzoides", confidence: 0.81, status: "pending" },
      { id: 108, imageUrl: "/placeholder-species.jpg", filename: "IMG_20260325_008.jpg", capturedDate: "2026-03-25", location: "Savana Bekol, Baluran", coordinates: "-7.8488, 114.3695", predictedSpecies: "Clitoria ternatea", confidence: 0.73, status: "pending" },
    ],
  },
  {
    id: 2,
    period: "Q4 2025",
    dateRange: "Oct 1 – Dec 31, 2025",
    totalItems: 24,
    pending: 0,
    annotated: 0,
    validated: 24,
    rejected: 0,
    status: "exported",
    createdBy: "Dr. Andi Prasetyo",
    createdDate: "2026-01-05",
    items: [],
  },
  {
    id: 3,
    period: "Q3 2025",
    dateRange: "Jul 1 – Sep 30, 2025",
    totalItems: 31,
    pending: 0,
    annotated: 0,
    validated: 28,
    rejected: 3,
    status: "completed",
    createdBy: "Dr. Andi Prasetyo",
    createdDate: "2025-10-02",
    items: [],
  },
];

const ANNOTATION_STATUS_STYLES: Record<AnnotationStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-gray-100", text: "text-gray-600", label: "Pending" },
  annotated: { bg: "bg-blue-100", text: "text-blue-700", label: "Annotated" },
  validated: { bg: "bg-green-100", text: "text-green-700", label: "Validated" },
  rejected: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
};

const BATCH_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  in_progress: { bg: "bg-blue-100", text: "text-blue-700", label: "In Progress" },
  review: { bg: "bg-amber-100", text: "text-amber-700", label: "Under Review" },
  completed: { bg: "bg-green-100", text: "text-green-700", label: "Completed" },
  exported: { bg: "bg-purple-100", text: "text-purple-700", label: "Exported" },
};

/* ───────────── TABS ───────────── */

type Tab = "users" | "species" | "logs" | "annotation";

const TABS: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: "users", label: "User Management", icon: Users },
  { key: "species", label: "Species Management", icon: Bug },
  { key: "annotation", label: "Data Annotation", icon: Tag },
  { key: "logs", label: "System Logs", icon: ScrollText },
];

/* ───────────── COMPONENT ───────────── */

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [speciesSearch, setSpeciesSearch] = useState("");
  const [logFilter, setLogFilter] = useState<LogLevel | "all">("all");
  const { user, logout, registerUser, updatePassword } = useAuth();

  // Check if current user is Super Admin
  const isSuperAdmin = user?.role === "Super Admin";

  // User management state (must be declared before fetch functions)
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingSpecies, setIsLoadingSpecies] = useState(true);

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
    setIsLoadingUsers(true);
    try {
      const [usersRes, rolesData] = await Promise.all([
        fetch("/api/v1/users?limit=100"),
        fetchRoles(),
      ]);
      const usersJson = await usersRes.json();
      const roleMap: Record<number, string> = {};
      rolesData.forEach(r => { roleMap[r.id] = r.name; });

      if (usersJson.success && usersJson.data) {
        setUsers(usersJson.data.map((u: ApiUser) => {
          const roleName = roleMap[u.roleId || u.role_id || 0] || "User";
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            role: roleName === "Field Officer" ? "Ranger" : roleName,
            roleId: u.roleId || u.role_id || 0,
            status: "Active",
            lastLogin: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short'
            }) : "-",
          };
        }));
      }
    } catch (e) { console.error("Failed to fetch users:", e); }
    setIsLoadingUsers(false);
  }, [fetchRoles]);

  const fetchSpecies = useCallback(async () => {
    setIsLoadingSpecies(true);
    try {
      const res = await fetch("/api/v1/plants?limit=100");
      const json = await res.json();
      if (json.success && json.data) {
        setSpeciesData(json.data.map((p: ApiPlant) => ({
          id: p.id,
          scientificName: p.scientificName || p.scientific_name || "",
          commonName: p.commonName || p.common_name || "",
          family: p.family || "",
          genus: p.genus || "",
          botanicalDescription: p.botanicalDescription || p.botanical_description || "",
          ecologicalInformation: p.ecologicalInformation || p.ecological_information || "",
          environmentalImpact: p.environmentalImpact || p.environmental_impact || "",
          lastUpdated: p.updatedAt || p.updated_at || "-",
        })));
      }
    } catch (e) { console.error("Failed to fetch species:", e); }
    setIsLoadingSpecies(false);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchSpecies();
  }, []);
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

    if (!addUserForm.email.trim()) { setAddUserError("Email wajib diisi"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(addUserForm.email.trim())) { setAddUserError("Format email tidak valid"); return; }
    if (!addUserForm.name.trim()) { setAddUserError("Nama user wajib diisi"); return; }

    const tempPassword = generateTempPassword();
    // Handle "Ranger" mapping to "Field Officer" if database hasn't been updated
    const searchRoleName = addUserForm.role === "Ranger" ? "Field Officer" : addUserForm.role;
    const selectedRole = roles.find(r => r.name === addUserForm.role) || roles.find(r => r.name === searchRoleName);
    if (!selectedRole) { setAddUserError("Role tidak ditemukan"); return; }

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
      if (!res.ok) { setAddUserError(json.error?.message || "Gagal menambahkan user"); return; }

      setAddUserCreatedCreds({ email: addUserForm.email.trim(), password: tempPassword, name: addUserForm.name.trim(), role: addUserForm.role });
      fetchUsers();
    } catch { setAddUserError("Gagal menghubungi server"); }
  };

  const handleCopyCredentials = () => {
    if (!addUserCreatedCreds) return;
    const text = `Email: ${addUserCreatedCreds.email}\nPassword Sementara: ${addUserCreatedCreds.password}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCreds(true);
      setTimeout(() => setCopiedCreds(false), 2000);
    });
  };

  const handleEditRole = (u: DisplayUser) => {
    if (!isSuperAdmin) return;
    setEditRoleUser(u);
    setEditRoleValue(u.role);
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

  const openProfile = () => {
    const nameParts = (user?.name || "Admin").split(" ");
    setProfileForm({
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: user?.email || "",
      country: "Indonesia",
    });
    setPasswordForm({ newPassword: "", repeatNewPassword: "", currentPassword: "" });
    setPasswordErrors({ repeatNewPassword: "", currentPassword: "" });
    setProfileEditing(false);
    setShowProfile(true);
  };

  const handleChangePassword = async () => {
    const errors = { repeatNewPassword: "", currentPassword: "" };
    let hasError = false;

    if (!passwordForm.newPassword.trim()) {
      errors.repeatNewPassword = "";
      // No error for new password field itself, but we need it filled
    }
    if (!passwordForm.repeatNewPassword.trim()) {
      errors.repeatNewPassword = "Repeat New Password wajib diisi";
      hasError = true;
    } else if (passwordForm.newPassword !== passwordForm.repeatNewPassword) {
      errors.repeatNewPassword = "Password tidak cocok";
      hasError = true;
    }
    if (!passwordForm.currentPassword.trim()) {
      errors.currentPassword = "Current Password wajib diisi";
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
      setPasswordErrors({ repeatNewPassword: "", currentPassword: "Current password salah" });
      return;
    }

    // Success — reset form, close modal, go to User Management
    setPasswordForm({ newPassword: "", repeatNewPassword: "", currentPassword: "" });
    setPasswordErrors({ repeatNewPassword: "", currentPassword: "" });
    setShowProfile(false);
    setProfileEditing(false);
    setActiveTab("users");
  };

  // Species management state
  const [speciesData, setSpeciesData] = useState<DisplaySpecies[]>([]);
  const [showAddSpecies, setShowAddSpecies] = useState(false);
  const [speciesForm, setSpeciesForm] = useState({ 
    id: 0, 
    scientificName: "", 
    commonName: "", 
    family: "", 
    genus: "",
    botanicalDescription: "",
    ecologicalInformation: "",
    environmentalImpact: ""
  });
  const [deleteSpeciesConfirm, setDeleteSpeciesConfirm] = useState<DisplaySpecies | null>(null);

  const handleOpenAddSpecies = () => {
    setSpeciesForm({ 
      id: 0, 
      scientificName: "", 
      commonName: "", 
      family: "", 
      genus: "",
      botanicalDescription: "",
      ecologicalInformation: "",
      environmentalImpact: ""
    });
    setShowAddSpecies(true);
  };

  const handleEditSpecies = (s: DisplaySpecies) => {
    setSpeciesForm({ 
      id: s.id, 
      scientificName: s.scientificName, 
      commonName: s.commonName, 
      family: s.family, 
      genus: s.genus || "",
      botanicalDescription: s.botanicalDescription || "",
      ecologicalInformation: s.ecologicalInformation || "",
      environmentalImpact: s.environmentalImpact || ""
    });
    setShowAddSpecies(true);
  };

  const handleSaveSpecies = async () => {
    if (!speciesForm.scientificName.trim() || !speciesForm.family.trim()) return;
    try {
      let res;
      if (speciesForm.id === 0) {
        res = await fetch("/api/v1/plants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commonName: speciesForm.commonName.trim() || speciesForm.scientificName.trim(),
            scientificName: speciesForm.scientificName.trim(),
            family: speciesForm.family.trim(),
            genus: speciesForm.genus.trim() || speciesForm.family.trim(),
            botanicalDescription: speciesForm.botanicalDescription.trim() || "-",
            ecologicalInformation: speciesForm.ecologicalInformation.trim() || "-",
            environmentalImpact: speciesForm.environmentalImpact.trim() || "-",
            imagePath: "",
          }),
        });
      } else {
        res = await fetch(`/api/v1/plants/${speciesForm.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commonName: speciesForm.commonName.trim(),
            scientificName: speciesForm.scientificName.trim(),
            family: speciesForm.family.trim(),
            genus: speciesForm.genus.trim(),
            botanicalDescription: speciesForm.botanicalDescription.trim(),
            ecologicalInformation: speciesForm.ecologicalInformation.trim(),
            environmentalImpact: speciesForm.environmentalImpact.trim(),
          }),
        });
      }
      
      if (res && res.ok) {
        await fetchSpecies();
        setShowAddSpecies(false);
      } else {
        const err = await res?.json();
        console.error("Failed to save species:", err);
        alert(`Gagal menyimpan spesies: ${err?.error?.message || "Unknown error"}`);
      }
    } catch (e) { 
      console.error("Failed to save species:", e); 
      alert("Terjadi kesalahan saat menghubungi server");
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

  // Annotation state
  const [annotationBatches, setAnnotationBatches] = useState(MOCK_ANNOTATION_BATCHES);
  const [expandedBatchId, setExpandedBatchId] = useState<number | null>(1);
  const [annotationFilter, setAnnotationFilter] = useState<AnnotationStatus | "all">("all");
  const [annotateModalItem, setAnnotateModalItem] = useState<AnnotationItem | null>(null);
  const [annotateSpecies, setAnnotateSpecies] = useState("");
  const [annotateNotes, setAnnotateNotes] = useState("");
  const [viewDetailItem, setViewDetailItem] = useState<AnnotationItem | null>(null);

  const filteredSpecies = speciesData.filter(s =>
    s.scientificName.toLowerCase().includes(speciesSearch.toLowerCase()) ||
    s.commonName.toLowerCase().includes(speciesSearch.toLowerCase())
  );

  const [systemLogs, setSystemLogs] = useState<LogEntry[]>(MOCK_LOGS);

  const addLog = (level: LogLevel, source: string, message: string, userStr?: string) => {
    setSystemLogs(prev => [
      {
        id: Math.max(...prev.map(l => l.id), 0) + 1,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        level,
        source,
        message,
        user: userStr || user?.name || "Admin",
      },
      ...prev
    ]);
  };

  const filteredLogs = logFilter === "all"
    ? systemLogs
    : systemLogs.filter((log) => log.level === logFilter);

  // Annotation helpers
  const getExpandedBatch = useMemo(() => {
    return annotationBatches.find(b => b.id === expandedBatchId);
  }, [annotationBatches, expandedBatchId]);

  const filteredAnnotationItems = useMemo(() => {
    const batch = getExpandedBatch;
    if (!batch) return [];
    if (annotationFilter === "all") return batch.items;
    return batch.items.filter(item => item.status === annotationFilter);
  }, [getExpandedBatch, annotationFilter]);

  const handleAnnotate = (item: AnnotationItem) => {
    setAnnotateModalItem(item);
    setAnnotateSpecies(item.predictedSpecies);
    setAnnotateNotes(item.notes || "");
  };

  const submitAnnotation = () => {
    if (!annotateModalItem || !annotateSpecies) return;
    setAnnotationBatches(prev => prev.map(batch => {
      if (batch.id !== expandedBatchId) return batch;
      const updatedItems = batch.items.map(item => {
        if (item.id !== annotateModalItem.id) return item;
        return {
          ...item,
          annotatedSpecies: annotateSpecies,
          annotatedBy: user?.name || "Admin",
          annotatedDate: new Date().toISOString().split("T")[0],
          notes: annotateNotes || undefined,
          status: "annotated" as AnnotationStatus,
        };
      });
      const pending = updatedItems.filter(i => i.status === "pending").length;
      const annotated = updatedItems.filter(i => i.status === "annotated").length;
      const validated = updatedItems.filter(i => i.status === "validated").length;
      const rejected = updatedItems.filter(i => i.status === "rejected").length;
      return { ...batch, items: updatedItems, pending, annotated, validated, rejected };
    }));
    setAnnotateModalItem(null);
  };

  const handleValidate = (itemId: number) => {
    setAnnotationBatches(prev => prev.map(batch => {
      if (batch.id !== expandedBatchId) return batch;
      const updatedItems = batch.items.map(item => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          validatedBy: user?.name || "Admin",
          validatedDate: new Date().toISOString().split("T")[0],
          status: "validated" as AnnotationStatus,
        };
      });
      const pending = updatedItems.filter(i => i.status === "pending").length;
      const annotated = updatedItems.filter(i => i.status === "annotated").length;
      const validated = updatedItems.filter(i => i.status === "validated").length;
      const rejected = updatedItems.filter(i => i.status === "rejected").length;
      return { ...batch, items: updatedItems, pending, annotated, validated, rejected };
    }));
  };

  const handleReject = (itemId: number) => {
    setAnnotationBatches(prev => prev.map(batch => {
      if (batch.id !== expandedBatchId) return batch;
      const updatedItems = batch.items.map(item => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          status: "rejected" as AnnotationStatus,
          validatedBy: user?.name || "Admin",
          validatedDate: new Date().toISOString().split("T")[0],
        };
      });
      const pending = updatedItems.filter(i => i.status === "pending").length;
      const annotated = updatedItems.filter(i => i.status === "annotated").length;
      const validated = updatedItems.filter(i => i.status === "validated").length;
      const rejected = updatedItems.filter(i => i.status === "rejected").length;
      return { ...batch, items: updatedItems, pending, annotated, validated, rejected };
    }));
  };

  const handleDownloadBatch = (batch: AnnotationBatch) => {
    const validatedItems = batch.items.filter(i => i.status === "validated");
    if (validatedItems.length === 0) return;
    const csvHeader = "id,filename,captured_date,location,coordinates,predicted_species,confidence,annotated_species,annotated_by,annotated_date,validated_by,validated_date,notes\n";
    const csvRows = validatedItems.map(item =>
      `${item.id},${item.filename},${item.capturedDate},"${item.location}","${item.coordinates}",${item.predictedSpecies},${item.confidence},${item.annotatedSpecies || ""},${item.annotatedBy || ""},${item.annotatedDate || ""},${item.validatedBy || ""},${item.validatedDate || ""},"${item.notes || ""}"`
    ).join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `annotation_${batch.period.replace(/\s+/g, "_").toLowerCase()}_validated.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Admin Header with User Info & Logout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{user?.name || "Administrator"}</p>
            <p className="text-xs text-muted-foreground">{user?.email} • {user?.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openProfile}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <User className="h-4 w-4" />
            Profile
          </button>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === tab.key
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── USER MANAGEMENT TAB ─── */}
      {activeTab === "users" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: String(users.length), icon: Users, color: "text-blue-600 bg-blue-50" },
              { label: "Active Users", value: String(users.filter(u => u.status === "Active").length), icon: Activity, color: "text-green-600 bg-green-50" },
              { label: "Admins", value: String(users.filter(u => u.role.includes("Admin")).length), icon: ShieldCheck, color: "text-purple-600 bg-purple-50" },
              { label: "Roles", value: String(roles.length), icon: UserPlus, color: "text-amber-600 bg-amber-50" },
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
              <h2 className="text-lg font-semibold">Users</h2>
              {isSuperAdmin ? (
                <button
                  onClick={handleOpenAddUser}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Add User
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed" title="Hanya Super Admin yang dapat menambahkan user">
                  <Lock className="h-4 w-4" />
                  Add User
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Role</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Last Login</th>
                    {isSuperAdmin && <th className="px-6 py-3 text-left font-medium text-muted-foreground">Actions</th>}
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
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{u.lastLogin}</td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditRole(u)}
                              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              title="Edit Role"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                              title="Delete User"
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
              { label: "Total Species", value: isLoadingSpecies ? "..." : String(speciesData.length), color: "text-emerald-600" },
              { label: "Families", value: isLoadingSpecies ? "..." : String(new Set(speciesData.map(s => s.family)).size), color: "text-blue-600" },
              { label: "Last Updated", value: "Today", color: "text-amber-600" },
            ].map((stat) => (
              <div key={stat.label} className="stat-card">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border bg-card shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b px-6 py-4">
              <h2 className="text-lg font-semibold">Species Records</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search species..."
                    value={speciesSearch}
                    onChange={(e) => setSpeciesSearch(e.target.value)}
                    className="h-9 w-56 rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>
                <button onClick={handleOpenAddSpecies} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Plus className="h-4 w-4" />
                  Add Species
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Scientific Name</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Common Name</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Family</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Genus</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Last Updated</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpecies.map((species) => (
                    <tr key={species.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium italic">{species.scientificName}</td>
                      <td className="px-6 py-4 text-muted-foreground">{species.commonName}</td>
                      <td className="px-6 py-4 text-muted-foreground">{species.family}</td>
                      <td className="px-6 py-4 text-muted-foreground">{species.genus}</td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">{species.lastUpdated ? new Date(species.lastUpdated).toLocaleDateString('id-ID') : '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEditSpecies(species)} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteSpecies(species)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-4 w-4" /></button>
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
                <h2 className="text-lg font-semibold">Annotation & Verification Logs</h2>
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
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y">
              {filteredLogs.map((log) => {
                const style = LEVEL_STYLES[log.level];
                const Icon = style.icon;
                return (
                  <div key={log.id} className="flex items-start gap-3 px-6 py-3 hover:bg-muted/30 transition-colors">
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${style.text}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${style.bg} ${style.text}`}>{log.level}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{log.source}</span>
                        {log.user && <span className="text-xs text-muted-foreground">by {log.user}</span>}
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
                  {profileEditing ? "Stop editing" : "Start editing"}
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
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">First Name</label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm(p => ({ ...p, firstName: e.target.value }))}
                    disabled={!profileEditing}
                    className="w-full border-0 border-b border-border bg-transparent pb-2 text-base font-medium text-foreground outline-none focus:border-primary transition-colors disabled:opacity-70 disabled:cursor-default"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Last Name</label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm(p => ({ ...p, lastName: e.target.value }))}
                    disabled={!profileEditing}
                    className="w-full border-0 border-b border-border bg-transparent pb-2 text-base font-medium text-foreground outline-none focus:border-primary transition-colors disabled:opacity-70 disabled:cursor-default"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))}
                    disabled={!profileEditing}
                    className="w-full border-0 border-b border-border bg-transparent pb-2 text-base font-medium text-foreground outline-none focus:border-primary transition-colors disabled:opacity-70 disabled:cursor-default"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Country</label>
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
                    onClick={() => { setProfileEditing(false); setShowProfile(false); setActiveTab("users"); }}
                    className="text-sm font-semibold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
                  >
                    Save
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
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">New Password</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                        className="w-full border-0 border-b border-border bg-transparent pb-2 text-base font-medium text-foreground outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Repeat New Password <span className="text-destructive">*</span>
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
                        Current Password <span className="text-destructive">*</span>
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
                      Change Password
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
              <h3 className="text-lg font-semibold">Edit Role</h3>
              <button onClick={() => setEditRoleUser(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">User</p>
              <p className="text-sm font-medium">{editRoleUser.name} ({editRoleUser.email})</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Role</label>
              <div className="flex flex-wrap gap-2">
                {roles
                  .filter((r) => r.name === "Researcher" || r.name === "Ranger" || r.name === "Field Officer")
                  .map((r) => (r.name === "Field Officer" ? "Ranger" : r.name))
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
                Batal
              </button>
              <button
                onClick={submitRoleChange}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Simpan
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
                <h3 className="text-lg font-semibold">Hapus User</h3>
                <p className="text-sm text-muted-foreground">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            <p className="text-sm">
              Apakah Anda yakin ingin menghapus <span className="font-semibold">{deleteConfirmUser.name}</span> ({deleteConfirmUser.email}) dari sistem?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteUser}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 transition-colors"
              >
                Hapus
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
                  <h3 className="text-lg font-semibold">{addUserCreatedCreds ? "User Berhasil Ditambahkan" : "Tambah User Baru"}</h3>
                  <p className="text-xs text-muted-foreground">{addUserCreatedCreds ? "Simpan kredensial di bawah ini" : "Undang user baru dengan alamat email"}</p>
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
                    <span><strong>{addUserCreatedCreds.name}</strong> berhasil ditambahkan sebagai <strong>{addUserCreatedCreds.role}</strong></span>
                  </div>

                  {/* Credential card */}
                  <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-5 space-y-4">
                    <div className="flex items-center gap-2 text-amber-700">
                      <KeyRound className="h-4 w-4" />
                      <span className="text-sm font-semibold">Kredensial Login</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Email</p>
                        <p className="text-sm font-mono font-medium bg-white rounded-lg border px-3 py-2">{addUserCreatedCreds.email}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Password Sementara</p>
                        <p className="text-sm font-mono font-medium bg-white rounded-lg border px-3 py-2 tracking-wide">{addUserCreatedCreds.password}</p>
                      </div>
                    </div>

                    <button
                      onClick={handleCopyCredentials}
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                        copiedCreds
                          ? "bg-green-100 border-green-300 text-green-700"
                          : "bg-white border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {copiedCreds ? (
                        <><CheckCircle2 className="h-4 w-4" /> Tersalin!</>
                      ) : (
                        <><Copy className="h-4 w-4" /> Salin Kredensial</>
                      )}
                    </button>
                  </div>

                  {/* Warning note */}
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Penting!</p>
                      <p>Kirimkan kredensial ini ke user melalui kanal yang aman. User disarankan segera mengganti password setelah login pertama.</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* ─── Add User Form ─── */
                <>
                  {/* Email field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Email Address <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                      <input
                        type="email"
                        value={addUserForm.email}
                        onChange={(e) => {
                          setAddUserForm(f => ({ ...f, email: e.target.value }));
                          if (addUserError) setAddUserError("");
                        }}
                        placeholder="contoh@biowatch.id"
                        className={`w-full h-11 rounded-lg border bg-background pl-9 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 ${
                          addUserError ? "border-destructive focus:ring-destructive/20" : "border-border"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Masukkan email aktif user yang ingin ditambahkan ke sistem</p>
                  </div>

                  {/* Name field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Nama Lengkap <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      value={addUserForm.name}
                      onChange={(e) => {
                        setAddUserForm(f => ({ ...f, name: e.target.value }));
                        if (addUserError) setAddUserError("");
                      }}
                      placeholder="Masukkan nama lengkap"
                      className="w-full h-11 rounded-lg border border-border bg-background px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Role selection */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Role</label>
                    <div className="flex flex-wrap gap-2">
                      {roles
                        .filter((r) => r.name === "Researcher" || r.name === "Ranger" || r.name === "Field Officer")
                        .map((r) => (r.name === "Field Officer" ? "Ranger" : r.name))
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
                    <p>Password sementara akan di-<strong>generate otomatis</strong> oleh sistem dan ditampilkan setelah user berhasil ditambahkan.</p>
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
                Hanya Super Admin yang dapat menambahkan user
              </p>
              <div className="flex items-center gap-3">
                {addUserCreatedCreds ? (
                  <button
                    onClick={() => setShowAddUser(false)}
                    className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Selesai
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowAddUser(false)}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleAddUserSubmit}
                      className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <UserPlus className="inline h-4 w-4 mr-1.5" />
                      Tambah User
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ─── ADD/EDIT SPECIES MODAL ─── */}
      {showAddSpecies && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl border animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
              <h2 className="text-lg font-semibold">{speciesForm.id === 0 ? "Add New Species" : "Edit Species"}</h2>
              <button onClick={() => setShowAddSpecies(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 py-4 px-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Scientific Name</label>
                <input
                  type="text"
                  value={speciesForm.scientificName}
                  onChange={(e) => setSpeciesForm({ ...speciesForm, scientificName: e.target.value })}
                  placeholder="e.g., Acacia nilotica"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Common Name</label>
                <input
                  type="text"
                  value={speciesForm.commonName}
                  onChange={(e) => setSpeciesForm({ ...speciesForm, commonName: e.target.value })}
                  placeholder="e.g., Babul"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Family</label>
                  <input
                    type="text"
                    value={speciesForm.family}
                    onChange={(e) => setSpeciesForm({ ...speciesForm, family: e.target.value })}
                    placeholder="e.g., Fabaceae"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Genus</label>
                  <input
                    type="text"
                    value={speciesForm.genus}
                    onChange={(e) => setSpeciesForm({ ...speciesForm, genus: e.target.value })}
                    placeholder="e.g., Vachellia"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Botanical Description</label>
                <textarea
                  value={speciesForm.botanicalDescription}
                  onChange={(e) => setSpeciesForm({ ...speciesForm, botanicalDescription: e.target.value })}
                  placeholder="Describe the plant's physical characteristics..."
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ecological Information</label>
                <textarea
                  value={speciesForm.ecologicalInformation}
                  onChange={(e) => setSpeciesForm({ ...speciesForm, ecologicalInformation: e.target.value })}
                  placeholder="Describe its habitat and ecological role..."
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Environmental Impact</label>
                <textarea
                  value={speciesForm.environmentalImpact}
                  onChange={(e) => setSpeciesForm({ ...speciesForm, environmentalImpact: e.target.value })}
                  placeholder="Describe its impact on the environment..."
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t bg-muted/30 px-6 py-4">
              <button onClick={() => setShowAddSpecies(false)} className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveSpecies} disabled={!speciesForm.scientificName.trim() || !speciesForm.family.trim()} className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Save Species
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE SPECIES CONFIRMATION MODAL ─── */}
      {deleteSpeciesConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-2xl border animate-in zoom-in-95 duration-200 p-6 text-center space-y-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Delete Species?</h3>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <span className="font-bold italic text-foreground">{deleteSpeciesConfirm.scientificName}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setDeleteSpeciesConfirm(null)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={confirmDeleteSpecies} className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 transition-colors">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
