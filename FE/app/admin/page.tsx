"use client";

import { Users, UserPlus, ShieldCheck, Activity, Bug, Upload, ScrollText, Database, Plus, Pencil, Trash2, Search, FileSpreadsheet, FileText, CheckCircle2, Clock, AlertCircle, AlertTriangle, Info, Server, Wifi, Filter, LogOut, User, Tag, Download, Eye, X, ChevronDown, ChevronRight, Image as ImageIcon, MapPin, Calendar, ThumbsUp, ThumbsDown, FileDown, BarChart3, Lock, Copy, KeyRound } from "lucide-react";
import { useState, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminDataAnnotationPanel } from "@/components/AdminDataAnnotationPanel";

/* ───────────── MOCK DATA ───────────── */

const INITIAL_USERS = [
  { id: 1, name: "Dr. Andi Prasetyo", email: "andi@biowatch.id", role: "Admin", status: "Active", lastLogin: "2026-04-15" },
  { id: 2, name: "Siti Nurhaliza", email: "siti@biowatch.id", role: "Researcher", status: "Active", lastLogin: "2026-04-14" },
  { id: 3, name: "Budi Santoso", email: "budi@biowatch.id", role: "Field Officer", status: "Active", lastLogin: "2026-04-13" },
  { id: 4, name: "Maya Putri", email: "maya@biowatch.id", role: "Researcher", status: "Inactive", lastLogin: "2026-03-28" },
  { id: 5, name: "Rudi Hermawan", email: "rudi@biowatch.id", role: "Field Officer", status: "Active", lastLogin: "2026-04-12" },
];

const AVAILABLE_ROLES = ["Admin", "Researcher", "Field Officer"];

const SPECIES_DATA = [
  { id: 1, name: "Acacia nilotica", family: "Fabaceae", riskLevel: "High", totalRecords: 1247, lastUpdated: "2026-04-10" },
  { id: 2, name: "Ageratum conyzoides", family: "Asteraceae", riskLevel: "Medium", totalRecords: 892, lastUpdated: "2026-04-08" },
  { id: 3, name: "Chromolaena odorata", family: "Asteraceae", riskLevel: "High", totalRecords: 2103, lastUpdated: "2026-04-12" },
  { id: 4, name: "Lantana camara", family: "Verbenaceae", riskLevel: "High", totalRecords: 1856, lastUpdated: "2026-04-11" },
  { id: 5, name: "Mikania micrantha", family: "Asteraceae", riskLevel: "Medium", totalRecords: 634, lastUpdated: "2026-04-06" },
];

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
  { id: 1, timestamp: "2026-04-15 09:32:14", level: "info", source: "Auth", message: "User login successful", user: "Dr. Andi Prasetyo" },
  { id: 2, timestamp: "2026-04-15 09:15:20", level: "info", source: "Auth", message: "User logout successful", user: "Dr. Andi Prasetyo" },
  { id: 5, timestamp: "2026-04-15 08:40:11", level: "info", source: "Auth", message: "User login successful", user: "Rudi Hermawan" },
  { id: 6, timestamp: "2026-04-15 08:05:30", level: "info", source: "Auth", message: "User logout successful", user: "Rudi Hermawan" },
  { id: 9, timestamp: "2026-04-15 07:15:00", level: "warning", source: "Auth", message: "Failed login attempt", user: "Unknown" },
  { id: 10, timestamp: "2026-04-14 22:10:05", level: "error", source: "Auth", message: "Account locked due to multiple failed attempts", user: "Maya Putri" },
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
      { id: 101, imageUrl: "/placeholder-species.jpg", filename: "IMG_20260115_001.jpg", capturedDate: "2026-01-15", location: "Savana Bekol, Baluran", coordinates: "-7.8503, 114.3680", predictedSpecies: "Acacia nilotica", confidence: 0.92, annotatedSpecies: "Acacia nilotica", annotatedBy: "Siti Nurhaliza", annotatedDate: "2026-04-02", validatedBy: "Dr. Andi Prasetyo", validatedDate: "2026-04-03", status: "validated", notes: "Clear image, correct identification" },
      { id: 102, imageUrl: "/placeholder-species.jpg", filename: "IMG_20260118_002.jpg", capturedDate: "2026-01-18", location: "Pantai Bama, Baluran", coordinates: "-7.8215, 114.3842", predictedSpecies: "Lantana camara", confidence: 0.87, annotatedSpecies: "Lantana camara", annotatedBy: "Budi Santoso", annotatedDate: "2026-04-03", validatedBy: "Dr. Andi Prasetyo", validatedDate: "2026-04-04", status: "validated" },
      { id: 103, imageUrl: "/placeholder-species.jpg", filename: "IMG_20260205_003.jpg", capturedDate: "2026-02-05", location: "Evergreen Forest Trail", coordinates: "-7.8412, 114.3756", predictedSpecies: "Chromolaena odorata", confidence: 0.78, annotatedSpecies: "Ageratum conyzoides", annotatedBy: "Siti Nurhaliza", annotatedDate: "2026-04-05", status: "annotated", notes: "Model predicted wrong — leaves are different" },
      { id: 104, imageUrl: "/placeholder-species.jpg", filename: "IMG_20260210_004.jpg", capturedDate: "2026-02-10", location: "Savana Balanan", coordinates: "-7.8601, 114.3520", predictedSpecies: "Acacia nilotica", confidence: 0.95, annotatedSpecies: "Acacia nilotica", annotatedBy: "Budi Santoso", annotatedDate: "2026-04-05", validatedBy: "Dr. Andi Prasetyo", validatedDate: "2026-04-06", status: "validated" },
      { id: 105, imageUrl: "/placeholder-species.jpg", filename: "IMG_20260222_005.jpg", capturedDate: "2026-02-22", location: "Tanjung Sedano", coordinates: "-7.8003, 114.3910", predictedSpecies: "Mikania micrantha", confidence: 0.65, annotatedSpecies: "Mikania micrantha", annotatedBy: "Rudi Hermawan", annotatedDate: "2026-04-06", status: "annotated", notes: "Low confidence — partially occluded by other vegetation" },
      { id: 106, imageUrl: "/placeholder-species.jpg", filename: "IMG_20260305_006.jpg", capturedDate: "2026-03-05", location: "Watu Numpuk", coordinates: "-7.8320, 114.3615", predictedSpecies: "Lantana camara", confidence: 0.43, annotatedSpecies: "Unknown", annotatedBy: "Siti Nurhaliza", annotatedDate: "2026-04-07", status: "rejected", notes: "Image too blurry — cannot identify species" },
      { id: 107, imageUrl: "/placeholder-species.jpg", filename: "IMG_20260312_007.jpg", capturedDate: "2026-03-12", location: "Kramat Area", coordinates: "-7.8550, 114.3700", predictedSpecies: "Ageratum conyzoides", confidence: 0.81, status: "pending" },
      { id: 108, imageUrl: "/placeholder-species.jpg", filename: "IMG_20260325_008.jpg", capturedDate: "2026-03-25", location: "Savana Bekol, Baluran", coordinates: "-7.8488, 114.3695", predictedSpecies: "Chromolaena odorata", confidence: 0.73, status: "pending" },
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

  // User management state
  const [users, setUsers] = useState(INITIAL_USERS);
  const [editRoleUser, setEditRoleUser] = useState<typeof INITIAL_USERS[0] | null>(null);
  const [editRoleValue, setEditRoleValue] = useState("");
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<typeof INITIAL_USERS[0] | null>(null);

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

  const handleAddUserSubmit = () => {
    setAddUserError("");

    // Validate email
    if (!addUserForm.email.trim()) {
      setAddUserError("Email wajib diisi");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(addUserForm.email.trim())) {
      setAddUserError("Format email tidak valid");
      return;
    }

    // Check for duplicate email
    if (users.some(u => u.email.toLowerCase() === addUserForm.email.trim().toLowerCase())) {
      setAddUserError("Email sudah terdaftar dalam sistem");
      return;
    }

    // Validate name
    if (!addUserForm.name.trim()) {
      setAddUserError("Nama user wajib diisi");
      return;
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();

    // Add the new user to the table
    const newUser = {
      id: Math.max(...users.map(u => u.id)) + 1,
      name: addUserForm.name.trim(),
      email: addUserForm.email.trim(),
      role: addUserForm.role,
      status: "Active",
      lastLogin: "-",
    };
    setUsers(prev => [...prev, newUser]);

    // Register credentials in the auth system so the user can log in
    registerUser(addUserForm.email.trim(), tempPassword, addUserForm.name.trim(), addUserForm.role);

    // Show credentials card
    setAddUserCreatedCreds({
      email: addUserForm.email.trim(),
      password: tempPassword,
      name: addUserForm.name.trim(),
      role: addUserForm.role,
    });
  };

  const handleCopyCredentials = () => {
    if (!addUserCreatedCreds) return;
    const text = `Email: ${addUserCreatedCreds.email}\nPassword Sementara: ${addUserCreatedCreds.password}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCreds(true);
      setTimeout(() => setCopiedCreds(false), 2000);
    });
  };

  const handleEditRole = (u: typeof INITIAL_USERS[0]) => {
    if (!isSuperAdmin) return;
    setEditRoleUser(u);
    setEditRoleValue(u.role);
  };

  const submitRoleChange = () => {
    if (!editRoleUser) return;
    setUsers(prev => prev.map(u =>
      u.id === editRoleUser.id ? { ...u, role: editRoleValue } : u
    ));
    setEditRoleUser(null);
  };

  const handleDeleteUser = (u: typeof INITIAL_USERS[0]) => {
    if (!isSuperAdmin) return;
    setDeleteConfirmUser(u);
  };

  const confirmDeleteUser = () => {
    if (!deleteConfirmUser) return;
    setUsers(prev => prev.filter(u => u.id !== deleteConfirmUser.id));
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

  const handleChangePassword = () => {
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

    // Actually update the password in the credential store
    const success = updatePassword(
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
  const [speciesData, setSpeciesData] = useState(SPECIES_DATA);
  const [showAddSpecies, setShowAddSpecies] = useState(false);
  const [speciesForm, setSpeciesForm] = useState({ id: 0, name: "", family: "", riskLevel: "Medium" });
  const [deleteSpeciesConfirm, setDeleteSpeciesConfirm] = useState<typeof SPECIES_DATA[0] | null>(null);

  const handleOpenAddSpecies = () => {
    setSpeciesForm({ id: 0, name: "", family: "", riskLevel: "Medium" });
    setShowAddSpecies(true);
  };

  const handleEditSpecies = (s: typeof SPECIES_DATA[0]) => {
    setSpeciesForm({ id: s.id, name: s.name, family: s.family, riskLevel: s.riskLevel });
    setShowAddSpecies(true);
  };

  const handleSaveSpecies = () => {
    if (!speciesForm.name.trim() || !speciesForm.family.trim()) return;
    
    if (speciesForm.id === 0) {
      const newSpecies = {
        id: Math.max(...speciesData.map(s => s.id), 0) + 1,
        name: speciesForm.name.trim(),
        family: speciesForm.family.trim(),
        riskLevel: speciesForm.riskLevel,
        totalRecords: 0,
        lastUpdated: new Date().toISOString().split("T")[0],
      };
      setSpeciesData(prev => [...prev, newSpecies]);
    } else {
      setSpeciesData(prev => prev.map(s => s.id === speciesForm.id ? {
        ...s,
        name: speciesForm.name.trim(),
        family: speciesForm.family.trim(),
        riskLevel: speciesForm.riskLevel,
        lastUpdated: new Date().toISOString().split("T")[0],
      } : s));
    }
    setShowAddSpecies(false);
  };

  const handleDeleteSpecies = (s: typeof SPECIES_DATA[0]) => {
    setDeleteSpeciesConfirm(s);
  };

  const confirmDeleteSpecies = () => {
    if (!deleteSpeciesConfirm) return;
    setSpeciesData(prev => prev.filter(s => s.id !== deleteSpeciesConfirm.id));
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
    s.name.toLowerCase().includes(speciesSearch.toLowerCase())
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
              { label: "Admins", value: String(users.filter(u => u.role === "Admin").length), icon: ShieldCheck, color: "text-purple-600 bg-purple-50" },
              { label: "New This Month", value: "5", icon: UserPlus, color: "text-amber-600 bg-amber-50" },
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Species", value: String(speciesData.length), color: "text-emerald-600" },
              { label: "High Risk", value: String(speciesData.filter(s => s.riskLevel === "High").length), color: "text-red-600" },
              { label: "Total Records", value: "6,732", color: "text-blue-600" },
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
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Species Name</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Family</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Risk Level</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Records</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Last Updated</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpecies.map((species) => (
                    <tr key={species.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium italic">{species.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{species.family}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${species.riskLevel === "High" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                          }`}>{species.riskLevel}</span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{species.totalRecords.toLocaleString()}</td>
                      <td className="px-6 py-4 text-muted-foreground">{species.lastUpdated}</td>
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
                <h2 className="text-lg font-semibold">Auth Logs</h2>
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
                {AVAILABLE_ROLES.map((role) => (
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
                      {AVAILABLE_ROLES.map((role) => (
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
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Species Name <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={speciesForm.name}
                  onChange={(e) => setSpeciesForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Acacia nilotica"
                  className="w-full h-11 rounded-lg border border-border bg-background px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Family <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={speciesForm.family}
                  onChange={(e) => setSpeciesForm(f => ({ ...f, family: e.target.value }))}
                  placeholder="e.g., Fabaceae"
                  className="w-full h-11 rounded-lg border border-border bg-background px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Risk Level</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="riskLevel" 
                      value="High" 
                      checked={speciesForm.riskLevel === "High"}
                      onChange={(e) => setSpeciesForm(f => ({ ...f, riskLevel: e.target.value }))}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm">High</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="riskLevel" 
                      value="Medium" 
                      checked={speciesForm.riskLevel === "Medium"}
                      onChange={(e) => setSpeciesForm(f => ({ ...f, riskLevel: e.target.value }))}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Medium</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="riskLevel" 
                      value="Low" 
                      checked={speciesForm.riskLevel === "Low"}
                      onChange={(e) => setSpeciesForm(f => ({ ...f, riskLevel: e.target.value }))}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Low</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t bg-muted/30 px-6 py-4">
              <button onClick={() => setShowAddSpecies(false)} className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveSpecies} disabled={!speciesForm.name.trim() || !speciesForm.family.trim()} className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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
                Are you sure you want to delete <span className="font-bold italic text-foreground">{deleteSpeciesConfirm.name}</span>? This action cannot be undone.
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
