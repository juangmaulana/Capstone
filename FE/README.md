# Dokumentasi Kode Frontend — Bio-Inspector

> **Proyek:** Bio-Inspector — Sistem Pemantauan Spesies Asing Invasif (Invasive Alien Species / IAS) di Taman Nasional Baluran
> **Cakupan dokumen:** Seluruh frontend murni (folder `FE/`) — halaman publik, layout, navigasi, context, komponen presentasional, sub-sistem admin, serta lapisan integrasi REST API (`/api/v1/*`). Implementasi backend (`app/api/`, `server/`, `lib/db`) di luar cakupan; yang didokumentasikan adalah bagaimana frontend mengonsumsinya.
> **Disusun oleh:** Tim Frontend
> **Demo:** https://bio-inspector.site/

## Daftar Isi

**Bagian 1 — Halaman Publik, Layout & Navigasi**
1. Ringkasan & Tech Stack
2. Arsitektur Frontend
3. Layout & Provider Global (`layout.tsx`, `DashboardLayout`, `LanguageContext`)
4. Navigasi (`AppSidebar`, `TopNavbar`, `NavLink`)
5. Halaman (Pages) + kode full — Dashboard, Map Explorer, Analytics, Modeling/SDM, Data Explorer, Detail Spesies, Detail Observasi, 404
6. Utilitas & Data Frontend Bersama
7. Konvensi & Pola yang Konsisten
8. Cara Menjalankan (Frontend)

**Bagian 2 — Sub-Sistem Admin & Integrasi API**
- Bagian A — Sub-Sistem `/admin/*`
  - A.1 Arsitektur Admin · A.2 `AuthContext` · A.3 `AdminLoginPage` · A.4 Reset Password · A.5 `admin/page.tsx` (4 tab) · A.6 `AdminDataAnnotationPanel` · A.7 Upload Data
- Bagian B — Integrasi API Backend ↔ Frontend
  - B.1 Pola Umum · B.2 Kontrak Respons · B.3 Tabel Endpoint · B.4 Normalisasi Field · B.5 Terjemahan · B.6 Deteksi AI (`CameraSearchDialog`) · B.7 Ringkasan & Rekomendasi

---

# Bagian 1 — Halaman Publik, Layout & Navigasi

## 1. Ringkasan & Tech Stack

Frontend dibangun dengan **Next.js 16 (App Router)** dan **React 19** menggunakan **TypeScript**. Seluruh tampilan menggunakan **Tailwind CSS v4** dengan komponen primitif **shadcn/ui** (di atas **Radix UI**). Berikut pustaka inti yang dipakai di sisi frontend:

| Kategori | Pustaka |
|---|---|
| Framework | `next@16.1.6`, `react@19.2.3`, `react-dom@19.2.3` |
| Bahasa & build | `typescript@5`, `tailwindcss@4`, `@tailwindcss/postcss` |
| UI primitives | `@radix-ui/*` (dialog, select, tabs, tooltip, dll.), `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate` |
| Ikon | `lucide-react` |
| Peta | `leaflet`, `react-leaflet`, `@types/leaflet` |
| Grafik | `recharts` |
| Form & validasi | `react-hook-form`, `@hookform/resolvers`, `zod` |
| Data fetching | `@tanstack/react-query` |
| Tema & notifikasi | `next-themes`, `sonner` |

Skrip npm yang relevan untuk frontend: `npm run dev` (development), `npm run build`, `npm run start`, `npm run lint`.

> **Catatan cakupan.** Repositori `FE/` juga memuat kode backend (`app/api/`, `server/`, `lib/db`, `lib/api`, `lib/openapi`, dan skrip migrasi/seed). Sesuai permintaan, dokumen ini **hanya** membahas frontend murni — yaitu halaman dan komponen yang dirender di sisi client serta utilitas presentasionalnya. Endpoint API yang dipanggil halaman hanya disebut sebagai kontrak (mis. `GET /api/v1/plants`), bukan didokumentasikan implementasinya.

---

## 2. Arsitektur Frontend

### 2.1 Pohon rendering (provider chain)

Setiap halaman dibungkus oleh rantai provider berikut. Urutannya penting karena halaman bergantung pada context Bahasa dan React Query di mana pun.

```
RootLayout (app/layout.tsx)
└─ DashboardLayout (components/DashboardLayout.tsx)
   └─ QueryClientProvider           ← React Query
      └─ TooltipProvider            ← Radix tooltip global
         └─ LanguageProvider        ← i18n EN/ID (Context API)
            └─ SidebarProvider
               ├─ AppSidebar        ← navigasi kiri
               └─ SidebarInset
                  ├─ TopNavbar      ← breadcrumb + toggle bahasa
                  └─ <main> {children}   ← halaman aktif dirender di sini
         + Toaster / Sonner         ← notifikasi global
```

Section `/admin/*` menambahkan satu lapis lagi (`AuthProvider` + gerbang autentikasi) di atas children-nya melalui `app/admin/layout.tsx`.

### 2.2 Pola internasionalisasi (i18n)

Aplikasi mendukung dua bahasa: **Inggris (`en`)** dan **Indonesia (`id`)**. Polanya konsisten di seluruh halaman:

1. Setiap halaman/komponen mendeklarasikan objek konstanta `COPY` (atau `*_COPY`) yang memetakan `en` dan `id` ke semua teks UI.
2. Halaman memanggil `const { language } = useLanguage()` lalu `const copy = COPY[language]`.
3. Bahasa aktif disimpan di `localStorage` (`biowatch_language`) dan dipilih awal dari preferensi browser.

Tidak ada pustaka i18n eksternal — semua dikelola manual lewat React Context. Detailnya ada di bagian Context di bawah.

### 2.3 Alur data

- **Data dinamis** (daftar & detail spesies) diambil dari REST API internal `\/api/v1/plants` via `fetch` di dalam `useEffect`. Respons API menormalkan dua gaya penamaan field (camelCase & snake_case).
- **Data statis demo** (titik observasi di peta, warna spesies) disimpan sebagai konstanta TypeScript di `lib/map-observations.ts` sehingga peta tetap berfungsi tanpa backend.
- **State editor** (mis. edit spesies oleh admin) disimpan optimistik di komponen, dengan sebagian field taksonomi/sumber dicadangkan ke `localStorage`.

### 2.4 Daftar rute (App Router)

| Rute | File | Tipe render | Keterangan |
|---|---|---|---|
| `/` | `app/page.tsx` | Client | Landing / Dashboard (hero, pencarian, statistik, peta GEE) |
| `/map` | `app/map/page.tsx` | Client (dynamic, no SSR) | Peta GIS interaktif (Leaflet) |
| `/map/observations/[id]` | `app/map/observations/[id]/page.tsx` | Client | Detail satu observasi |
| `/analytics` | `app/analytics/page.tsx` | Client | Dashboard analitik (Recharts) |
| `/modeling` | `app/modeling/page.tsx` | Client (Suspense) | Prediksi sebaran (SDM) |
| `/data` | `app/data/page.tsx` | Client | Tabel penjelajah data spesies |
| `/species/[id]` | `app/species/[id]/page.tsx` | Client | Detail spesies + editor admin |
| `*` (404) | `app/not-found.tsx` | Client | Halaman tidak ditemukan |
| `/admin/*` | `app/admin/*` | Client (auth-gated) | Sub-sistem admin (di luar fokus utama) |

---

## 3. Layout & Provider Global

### 3.1 `app/layout.tsx` — Root Layout

Root layout memuat font Geist, metadata (judul, favicon Bio-Inspector), lalu membungkus seluruh aplikasi dengan `DashboardLayout`. Ini satu-satunya server component di jalur utama; selebihnya client component.


```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import DashboardLayout from "@/components/DashboardLayout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bio-Inspector",
  description: "Invasive Alien Species Monitoring",
  icons: {
    icon: "/Logo-Bio-Inspector.png",
    shortcut: "/Logo-Bio-Inspector.png",
    apple: "/Logo-Bio-Inspector.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </body>
    </html>
  );
}
```

### 3.2 `components/DashboardLayout.tsx` — Shell aplikasi

Komponen ini memasang semua provider global (React Query, Tooltip, Language, Sidebar) dan menyusun kerangka layout: sidebar kiri + area konten dengan top navbar. `QueryClient` dibuat sekali via `useState(() => new QueryClient())` agar tidak dibuat ulang tiap render.


```tsx
"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNavbar } from "@/components/TopNavbar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <TopNavbar />
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </LanguageProvider>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
```

### 3.3 `contexts/LanguageContext.tsx` — i18n EN/ID

Provider bahasa berbasis Context API. Nilai awal diambil dari `localStorage` (kunci `biowatch_language`); jika kosong, jatuh ke preferensi `navigator.language`. Setiap perubahan ikut memperbarui atribut `lang` pada elemen `<html>`. Hook `useLanguage()` melempar error bila dipakai di luar provider — pengaman agar tidak ada konsumsi context yang lupa dibungkus.


```tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Language = "en" | "id";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LANGUAGE_STORAGE_KEY = "biowatch_language";


export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";

    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === "en" || stored === "id") {
        return stored;
      }
      return navigator.language.toLowerCase().startsWith("id") ? "id" : "en";
    } catch (e) {
      console.error("Failed to load language from storage:", e);
      return "en";
    }
  });

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      document.documentElement.lang = nextLanguage;
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
```

---

## 4. Navigasi

### 4.1 `components/AppSidebar.tsx` — Sidebar utama

Sidebar collapsible (mode ikon) berisi dua grup menu: **Utama** (Dashboard, Map Explorer, Analytics, Prediction/SDM, Data Explorer) dan **Sistem Admin** (User, Spesies, Anotasi, Log). Label menu mengikuti bahasa aktif lewat objek `NAV_COPY`. State aktif ditentukan dari `usePathname()`.


```tsx
import {
  LayoutDashboard,
  Map,
  BarChart3,
  Brain,
  Database,
  Users,
  Sprout,
  Tag,
  ScrollText,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";

const NAV_COPY = {
  en: {
    subtitle: "IAS Monitoring",
    main: "Main",
    adminSystem: "Admin System",
    toggle: "Toggle sidebar",
    items: {
      dashboard: "Dashboard",
      map: "Map Explorer",
      analytics: "Analytics",
      modeling: "Prediction (SDM)",
      data: "Data Explorer",
      users: "User Management",
      species: "Species Management",
      annotation: "Data Annotation",
      logs: "System Logs",
    },
  },
  id: {
    subtitle: "Pemantauan IAS",
    main: "Utama",
    adminSystem: "Sistem Admin",
    toggle: "Buka/tutup sidebar",
    items: {
      dashboard: "Dasbor",
      map: "Penjelajah Peta",
      analytics: "Analitik",
      modeling: "Prediksi (SDM)",
      data: "Penjelajah Data",
      users: "Manajemen User",
      species: "Manajemen Spesies",
      annotation: "Anotasi Data",
      logs: "Log Sistem",
    },
  },
} as const;

const mainItems = [
  { key: "dashboard", url: "/", icon: LayoutDashboard },
  { key: "map", url: "/map", icon: Map },
  { key: "analytics", url: "/analytics", icon: BarChart3 },
  { key: "modeling", url: "/modeling", icon: Brain },
  { key: "data", url: "/data", icon: Database },
] as const;

const adminItems = [
  { key: "users", url: "/admin/users", icon: Users },
  { key: "species", url: "/admin/species", icon: Sprout },
  { key: "annotation", url: "/admin/annotation", icon: Tag },
  { key: "logs", url: "/admin/logs", icon: ScrollText },
] as const;

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();
  const { language } = useLanguage();
  const copy = NAV_COPY[language];

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-4 transition-all">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              toggleSidebar();
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/80 transition-colors focus:outline-none"
            aria-label={copy.toggle}
          >
            <Image
              src="/Bio-Inspector-Logo-Only.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              priority
            />
          </button>
          {!collapsed && (
            <div className="flex flex-1 items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-sidebar-accent-foreground">
                  Bio-Inspector
                </span>
                <span className="text-[11px] text-sidebar-muted">
                  {copy.subtitle}
                </span>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted">
            {copy.main}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={copy.items[item.key]}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{copy.items[item.key]}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted">
            {copy.adminSystem}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => {
                const active = item.url === "/admin/users"
                  ? pathname === "/admin" || pathname === item.url
                  : pathname === item.url;

                return (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={copy.items[item.key]}
                  >
                    <Link
                      href={item.url}
                      className={`transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary" : ""}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{copy.items[item.key]}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 group-data-[collapsible=icon]:p-2 transition-all">
        {!collapsed && (
          <p className="text-[11px] text-sidebar-muted min-w-max">v1.0.0 • Bio-Inspector</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
```

### 4.2 `components/TopNavbar.tsx` — Breadcrumb & pengalih bahasa

Header atas menampilkan breadcrumb (judul rute aktif, dipetakan via `routeLabels` per bahasa) dan toggle EN/ID yang memanggil `setLanguage`. Pada layar kecil juga menampilkan `SidebarTrigger`.


```tsx
import { ChevronRight, Languages } from "lucide-react";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";

const routeLabels: Record<"en" | "id", Record<string, string>> = {
  en: {
    "/": "Dashboard",
    "/map": "Map Explorer",
    "/analytics": "Analytics",
    "/modeling": "Modeling (SDM)",
    "/data": "Data Explorer",
    "/reports": "Reports",
    "/admin": "Admin System",
    "/admin/users": "User Management",
    "/admin/species": "Species Management",
    "/admin/annotation": "Data Annotation",
    "/admin/logs": "System Logs",
  },
  id: {
    "/": "Dasbor",
    "/map": "Penjelajah Peta",
    "/analytics": "Analitik",
    "/modeling": "Pemodelan (SDM)",
    "/data": "Penjelajah Data",
    "/reports": "Laporan",
    "/admin": "Sistem Admin",
    "/admin/users": "Manajemen User",
    "/admin/species": "Manajemen Spesies",
    "/admin/annotation": "Anotasi Data",
    "/admin/logs": "Log Sistem",
  },
};

export function TopNavbar() {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const currentLabel = routeLabels[language][pathname]
    || routeLabels[language][Object.keys(routeLabels[language]).find(key => pathname.startsWith(key) && key !== "/") || ""]
    || (language === "id" ? "Halaman" : "Page");

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-card px-4">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span className="hidden sm:inline">Bio-Inspector</span>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">{currentLabel}</span>
      </nav>

      <div className="flex-1" />

      <div className="inline-flex items-center rounded-full border bg-muted/40 p-1 text-xs font-medium">
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors ${language === "en"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
            }`}
          aria-pressed={language === "en"}
        >
          <Languages className="h-3.5 w-3.5" />
          EN
        </button>
        <button
          type="button"
          onClick={() => setLanguage("id")}
          className={`rounded-full px-3 py-1.5 transition-colors ${language === "id"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
            }`}
          aria-pressed={language === "id"}
        >
          ID
        </button>
      </div>
    </header>
  );
}
```

### 4.3 `components/NavLink.tsx` — Wrapper Link aktif

Pembungkus tipis `next/link` yang meniru API `NavLink` ala React Router (`to`, `end`, `activeClassName`). Menentukan status aktif dari `usePathname()`. Memakai `forwardRef` agar bisa dipakai dengan `asChild` pada komponen sidebar.


```tsx
"use client";

import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<LinkProps, "href"> {
  to: string;
  end?: boolean;
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  children: React.ReactNode;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, end, children, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = end ? pathname === to : pathname.startsWith(to);
    const isPending = false;

    return (
      <Link
        ref={ref}
        href={to}
        className={cn(className, isActive && activeClassName, isPending && pendingClassName)}
        {...props}
      >
        {children}
      </Link>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
```

---

## 5. Halaman (Pages) — Penjelasan & Kode Full

Bagian ini adalah inti dokumentasi: tiap halaman dijelaskan lalu disertai **kode lengkapnya**.

### 5.1 `app/page.tsx` — Dashboard / Landing

Halaman beranda. Komponen utama:

- **Hero full-screen** dengan gambar latar dan kotak pencarian spesies bergaya Google.
- **Search + autocomplete:** mengambil daftar nama spesies dari `GET /api/v1/plants?limit=100` saat mount; bila gagal memakai `fallbackSpecies` (5 spesies invasif). Dropdown difilter realtime; klik hasil → `router.push('/species/{slug}')` memakai `createScientificNameSlug`.
- **Pencarian via gambar:** tombol kamera membuka `CameraSearchDialog` (mirip Google Lens).
- **Quick stats:** lima kartu statistik dihitung dari `MAP_OBSERVATIONS` (jumlah record, jumlah spesies unik, lokasi unik, observasi terbaru, rata-rata confidence).
- **Seksi peta GEE:** tiga peta raster Baluran (titik api, LST, indeks vegetasi NDVI) dirender via `next/image`.

Seluruh teks berasal dari objek `COPY` (EN/ID). State lokal: `searchQuery`, `isDropdownOpen`, `speciesList`, `isLoading`, plus `useRef` untuk menutup dropdown saat klik di luar.


```tsx
"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Search, Camera, Loader2, CalendarClock, Database, MapPinned, ScanSearch, Sprout } from "lucide-react";
import { CameraSearchDialog } from "@/components/CameraSearchDialog";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { MAP_OBSERVATIONS } from "@/lib/map-observations";
import { createScientificNameSlug, getScientificNameWithAuthor } from "@/lib/plant/scientific-name-author";

interface PlantSearchRecord {
  scientificName?: string;
  scientific_name?: string;
}

const COPY = {
  en: {
    eyebrow: "Bio-Inspector | Invasive Alien Species Monitoring",
    headline: <>Free and open access to<br />biodiversity data in Baluran</>,
    searchPlaceholder: "Search species...",
    cameraTitle: "Search by image (like Google Lens)",
    loadingSpecies: "Loading species data...",
    noSpecies: "No species found",
    stats: {
      records: "IAS records",
      species: "Detected species",
      hotspots: "Monitored locations",
      latest: "Latest observation",
      confidence: "AI detection confidence",
    },
    mapSectionTitle: "Baluran National Park Maps",
    mapItems: [
      {
        title: "Fire Hotspot Map",
        subtitle: "2019 – 2025",
        description: "Distribution of fire hotspots in Baluran National Park",
      },
      {
        title: "LST Map",
        subtitle: "2025",
        description: "Land Surface Temperature — surface temperature distribution",
      },
      {
        title: "Vegetation Index Map",
        subtitle: "2025",
        description: "NDVI — vegetation density level in the Baluran area",
      },
    ],
  },
  id: {
    eyebrow: "Bio-Inspector | Pemantauan Spesies Asing Invasif",
    headline: <>Akses bebas dan terbuka untuk<br />data biodiversitas di Baluran</>,
    searchPlaceholder: "Cari spesies...",
    cameraTitle: "Cari dengan gambar (seperti Google Lens)",
    loadingSpecies: "Memuat data spesies...",
    noSpecies: "Spesies tidak ditemukan",
    stats: {
      records: "Record IAS",
      species: "Spesies terdeteksi",
      hotspots: "Lokasi terpantau",
      latest: "Observasi terbaru",
      confidence: "Confidence deteksi AI",
    },
    mapSectionTitle: "Peta Taman Nasional Baluran",
    mapItems: [
      {
        title: "Peta Titik Api",
        subtitle: "2019 – 2025",
        description: "Sebaran titik api (hotspot) di kawasan Taman Nasional Baluran",
      },
      {
        title: "Peta LST",
        subtitle: "2025",
        description: "Land Surface Temperature — distribusi suhu permukaan tanah",
      },
      {
        title: "Peta Indeks Vegetasi",
        subtitle: "2025",
        description: "NDVI — tingkat kerapatan vegetasi di kawasan Baluran",
      },
    ],
  },
} as const;

export default function Dashboard() {
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [speciesList, setSpeciesList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const copy = COPY[language];
  const latestObservation = MAP_OBSERVATIONS.reduce((latest, observation) =>
    observation.date > latest.date ? observation : latest
  );
  const averageConfidence = Math.round(
    MAP_OBSERVATIONS.reduce((total, observation) => total + observation.confidence, 0) / MAP_OBSERVATIONS.length
  );
  const quickStats = [
    { label: copy.stats.records, value: MAP_OBSERVATIONS.length.toLocaleString("id-ID"), icon: Database },
    { label: copy.stats.species, value: new Set(MAP_OBSERVATIONS.map((observation) => observation.species)).size.toString(), icon: Sprout },
    { label: copy.stats.hotspots, value: new Set(MAP_OBSERVATIONS.map((observation) => observation.location)).size.toString(), icon: MapPinned },
    {
      label: copy.stats.latest,
      value: new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(`${latestObservation.date}T00:00:00`)),
      icon: CalendarClock,
    },
    { label: copy.stats.confidence, value: `${averageConfidence}%`, icon: ScanSearch },
  ];

  useEffect(() => {
    const fallbackSpecies = [
      "Vachellia nilotica (L.) P.J.H.Hurter & Mabb.",
      "Ageratum conyzoides L.",
      "Lantana camara L.",
      "Clitoria ternatea L.",
      "Merremia hederacea (Burm.f.) Hallier f.",
    ];

    async function fetchSpeciesList() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/v1/plants?limit=100");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const names = json.data
            .map((plant: PlantSearchRecord) => getScientificNameWithAuthor(plant.scientificName || plant.scientific_name || ""))
            .filter(Boolean);
          setSpeciesList(names.length > 0 ? names : fallbackSpecies);
        } else {
          setSpeciesList(fallbackSpecies);
        }
      } catch (error) {
        console.error("Failed to fetch species list:", error);
        setSpeciesList(fallbackSpecies);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSpeciesList();
  }, []);

  const handleSearch = (e?: React.FormEvent, queryOverride?: string) => {
    if (e) e.preventDefault();
    const query = queryOverride || searchQuery;
    if (query.trim()) {
      const id = createScientificNameSlug(query);
      router.push(`/species/${id}`);
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSpecies = speciesList.filter(species =>
    species.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full flex flex-col bg-gray-900">
      {/* Hero section — fills the full viewport minus navbar */}
      <div
        className="relative flex h-[calc(100vh-64px)] w-full flex-col justify-center overflow-hidden"
        style={{
          backgroundImage: 'url("/fb15b7a4-566e-4937-a66a-b4ea0e746ab0.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/10" />

        <div className="relative z-10 w-full px-8 md:px-16 lg:px-24 xl:px-32">
          <div className="max-w-4xl">
            <p className="mb-4 text-sm font-semibold tracking-wide text-white drop-shadow-md">
              {copy.eyebrow}
            </p>
            <h1 className="mb-8 text-4xl font-bold leading-tight tracking-tight text-white drop-shadow-md sm:text-5xl lg:text-6xl">
              {copy.headline}
            </h1>

            <div className="w-full max-w-2xl relative" ref={dropdownRef}>
              {/* Search Bar */}
              <form onSubmit={handleSearch} className={`flex w-full items-center bg-white shadow-lg ${isDropdownOpen ? 'rounded-t-2xl' : 'rounded-full'}`}>
                <div className="pl-5 flex items-center justify-center text-gray-400">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  placeholder={copy.searchPlaceholder}
                  value={searchQuery}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  className="h-14 w-full bg-transparent px-3 text-gray-900 outline-none placeholder:text-gray-500"
                />
                <button
                  type="button"
                  className="flex h-14 w-12 shrink-0 items-center justify-center text-gray-600 hover:text-black transition-colors"
                  aria-label="Upload photo"
                  onClick={() => setIsCameraDialogOpen(true)}
                  title={copy.cameraTitle}
                >
                  <Camera className="h-5 w-5" />
                </button>
              </form>

              {/* Dropdown */}
              {isDropdownOpen && (
                <div className="absolute left-0 top-full z-50 max-h-[min(36dvh,22rem)] w-full overflow-y-auto overscroll-contain rounded-b-2xl border-t border-gray-100 bg-white py-1.5 shadow-xl sm:max-h-[min(42dvh,22rem)]">
                  {isLoading ? (
                    <div className="flex items-center justify-center px-5 py-2.5 text-gray-500">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {copy.loadingSpecies}
                    </div>
                  ) : filteredSpecies.length > 0 ? (
                    filteredSpecies.map(sp => (
                      <div
                        key={sp}
                        className="flex min-h-11 cursor-pointer items-center px-5 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:min-h-12 sm:text-base"
                        onClick={() => {
                          setSearchQuery(sp);
                          handleSearch(undefined, sp);
                        }}
                      >
                        <Search className="mr-3 h-4 w-4 shrink-0 text-gray-400" />
                        <span className="min-w-0 truncate">{sp}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-2.5 text-gray-500">{copy.noSpecies}</div>
                  )}
                </div>
              )}

              <CameraSearchDialog
                open={isCameraDialogOpen}
                onOpenChange={setIsCameraDialogOpen}
              />
            </div>
          </div>
        </div>

      </div>

      <section className="w-full bg-white px-6 py-12 text-gray-700 md:px-12 md:py-16 lg:px-20">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-5">
          {quickStats.map((stat) => (
            <div key={stat.label} className="flex min-w-0 flex-col items-center text-center">
              <div className="mb-5 grid h-20 w-20 place-items-center rounded-full bg-green-50">
                <stat.icon className="h-10 w-10 text-green-700" strokeWidth={1.6} />
              </div>
              <p className="text-2xl font-semibold leading-none text-gray-700 md:text-3xl">{stat.value}</p>
              <p className="mt-3 max-w-44 text-sm font-medium leading-snug text-gray-500 md:text-base">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Map Assets Section — below the hero, visible on scroll */}
      <div className="relative z-10 w-full bg-gray-950">
        <div className="px-8 md:px-16 lg:px-24 xl:px-32 pt-12 pb-6">
          <h2 className="text-2xl font-bold text-white mb-2">{copy.mapSectionTitle}</h2>
        </div>

        <div className="space-y-8 pb-12">
          {[
            {
              title: copy.mapItems[0].title,
              subtitle: copy.mapItems[0].subtitle,
              src: "/peta-titik-api-baluran-2019-2025.jpg",
              description: copy.mapItems[0].description,
            },
            {
              title: copy.mapItems[1].title,
              subtitle: copy.mapItems[1].subtitle,
              src: "/peta-lst-baluran-2025.jpg",
              description: copy.mapItems[1].description,
            },
            {
              title: copy.mapItems[2].title,
              subtitle: copy.mapItems[2].subtitle,
              src: "/peta-indeks-vegetasi-baluran-2025.jpg",
              description: copy.mapItems[2].description,
            },
          ].map((map) => (
            <div key={map.title} className="group relative">
              {/* Title bar */}
              <div className="flex items-center justify-between px-8 md:px-16 lg:px-24 xl:px-32 py-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">{map.title}</h3>
                  <span className="text-xs font-medium text-green-400 bg-green-400/10 rounded-full px-2.5 py-0.5">{map.subtitle}</span>
                </div>
                <p className="text-xs text-gray-500 hidden sm:block">{map.description}</p>
              </div>
              {/* Full-width map image */}
              <div className="w-full overflow-hidden bg-gray-900 border-y border-white/5">
                <Image
                  src={map.src}
                  alt={map.title}
                  width={1920}
                  height={1080}
                  sizes="100vw"
                  className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 5.2 `app/map/page.tsx` — Map Explorer

Halaman peta hanya berupa wrapper tipis. Komponen peta (`GISMap`) di-`import` secara **dinamis dengan `ssr: false`** karena Leaflet butuh `window` dan tidak boleh dirender di server.


```tsx
"use client";

import dynamic from 'next/dynamic';
const GISMap = dynamic(() => import("@/components/GISMap").then(mod => mod.GISMap), { ssr: false });

export default function MapExplorer() {
  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <GISMap />
    </div>
  );
}
```

#### Komponen pendukung: `components/GISMap.tsx`

Inti dari Map Explorer. Membuat instance Leaflet (`L.map`) berpusat di Taman Nasional Baluran `[-7.833, 114.366]`, memasang tile OpenStreetMap, lalu menggambar marker lingkaran untuk tiap observasi dari `MAP_OBSERVATIONS`. Fitur:

- **Filter spesies** (panel kiri-atas) dengan checkbox per spesies + "semua".
- **Legenda** warna spesies (kiri-bawah).
- **Popup** tiap marker berisi info ringkas dan tombol "Lihat detail" → `/map/observations/{id}`.
- `ResizeObserver` memanggil `invalidateSize()` agar peta responsif saat kontainer berubah ukuran; cleanup membersihkan map & observer saat unmount.


```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/contexts/LanguageContext";
import { MAP_OBSERVATIONS, MAP_SPECIES_COLOR, MAP_SPECIES_LIST } from "@/lib/map-observations";

const MAP_COPY = {
  en: {
    legend: "Species Legend",
    filter: "Plant Filter",
    allPlants: "All plants",
    showing: "Showing",
    date: "Date",
    elevation: "Elevation",
    viewDetails: "View details",
  },
  id: {
    legend: "Legenda Spesies",
    filter: "Filter Tanaman",
    allPlants: "Semua tanaman",
    showing: "Menampilkan",
    date: "Tanggal",
    elevation: "Elevasi",
    viewDetails: "Lihat detail",
  },
} as const;

export function GISMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>(MAP_SPECIES_LIST);
  const { language } = useLanguage();
  const copy = MAP_COPY[language];
  const selectedSpeciesSet = useMemo(() => new Set(selectedSpecies), [selectedSpecies]);
  const filteredMarkers = useMemo(
    () => MAP_OBSERVATIONS.filter((marker) => selectedSpeciesSet.has(marker.species)),
    [selectedSpeciesSet],
  );
  const allSelected = selectedSpecies.length === MAP_SPECIES_LIST.length;

  const toggleAllSpecies = () => {
    setSelectedSpecies((current) => current.length === MAP_SPECIES_LIST.length ? [] : MAP_SPECIES_LIST);
  };

  const toggleSpecies = (species: string) => {
    setSelectedSpecies((current) =>
      current.includes(species)
        ? current.filter((item) => item !== species)
        : [...current, species],
    );
  };

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [-7.833, 114.366],
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markerLayer.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    // Fix map responsive behavior: Observe parent size changes
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstance.current = null;
      markerLayer.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = markerLayer.current;
    if (!layer) return;

    layer.clearLayers();

    filteredMarkers.forEach((m) => {
      const color = MAP_SPECIES_COLOR[m.species] || "#2E7D32";
      const detailsHref = `/map/observations/${m.id}`;
      const marker = L.circleMarker([m.lat, m.lng], {
        radius: 8,
        fillColor: color,
        color: color,
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.6,
      }).addTo(layer);

      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:180px">
          <h3 style="margin:0 0 6px;font-size:14px;font-weight:600">${m.species}</h3>
          <p style="margin:4px 0;font-size:12px;color:#888;font-weight:500">${m.location}</p>
          <p style="margin:4px 0;font-size:12px;color:#888">${copy.elevation}: ${m.elevation} m dpl</p>
          <p style="margin:4px 0;font-size:12px;color:#888">${copy.date}: ${m.date}</p>
          <p style="margin:0;font-size:11px;color:#666">${m.lat.toFixed(2)}°, ${m.lng.toFixed(2)}°</p>
          <a
            href="${detailsHref}"
            style="display:inline-flex;align-items:center;justify-content:center;margin-top:10px;border-radius:6px;background:#2E7D32;color:white;padding:7px 10px;font-size:12px;font-weight:600;text-decoration:none"
          >
            ${copy.viewDetails}
          </a>
        </div>
      `);
    });
  }, [copy.date, copy.elevation, copy.viewDetails, filteredMarkers]);

  return (
    <div className="relative isolate h-full w-full">
      <div ref={mapRef} className="h-full w-full rounded-lg" />

      {/* Plant Filter */}
      <div className="absolute left-6 top-6 z-[1000] max-w-[300px] rounded-lg border border-border bg-background/90 p-3 shadow-lg backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-foreground">{copy.filter}</p>
          <span className="text-[10px] font-medium text-muted-foreground">
            {copy.showing} {filteredMarkers.length}/{MAP_OBSERVATIONS.length}
          </span>
        </div>
        <label className="mb-2 flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-[11px] font-semibold text-foreground hover:bg-muted/60">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAllSpecies}
            className="h-3.5 w-3.5 accent-primary"
          />
          {copy.allPlants}
        </label>
        <div className="flex max-h-52 flex-col gap-1.5 overflow-y-auto">
          {MAP_SPECIES_LIST.map((species) => (
            <label key={species} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/60">
              <input
                type="checkbox"
                checked={selectedSpeciesSet.has(species)}
                onChange={() => toggleSpecies(species)}
                className="h-3.5 w-3.5 accent-primary"
              />
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: MAP_SPECIES_COLOR[species] }}
              />
              <span className="text-[10px] font-medium leading-tight text-foreground">{species}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Species Legend */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-background/90 backdrop-blur-md p-3 rounded-lg shadow-lg border border-border">
        <p className="text-xs font-bold mb-2 text-foreground">{copy.legend}</p>
        <div className="flex flex-col gap-1.5">
          {Object.entries(MAP_SPECIES_COLOR).map(([species, color]) => (
            <div key={species} className="flex items-center gap-2">
              <div 
                className="h-3 w-3 rounded-full shrink-0" 
                style={{ backgroundColor: color }} 
              />
              <span className="text-[10px] font-medium text-foreground">{species}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 5.3 `app/analytics/page.tsx` — Analytics

Halaman ini hanya membungkus komponen `AnalyticsPanel` dalam kontainer terpusat.


```tsx
"use client";

import { AnalyticsPanel } from "@/components/AnalyticsPanel";

export default function Analytics() {
  return (
    <div className="mx-auto max-w-7xl">
      <AnalyticsPanel />
    </div>
  );
}
```

#### Komponen pendukung: `components/AnalyticsPanel.tsx` (ringkasan)

`AnalyticsPanel` (±400 baris) membangun dashboard grafik berbasis **Recharts**: tren bulanan observasi (LineChart), distribusi per spesies (BarChart), dan komposisi (PieChart), lengkap dengan pemilih tahun dan spesies. Data demo bersifat statis di dalam komponen. Karena ini komponen presentasional (bukan rute), kode penuhnya tidak disisipkan di sini; ia mengikuti pola `COPY` dan `useLanguage()` yang sama seperti halaman lain.

### 5.4 `app/modeling/page.tsx` — Prediction (SDM)

Halaman **Species Distribution Modeling**. Pengguna memilih spesies + horizon tahun (2040–2200), menekan "Prediksi Persebaran", lalu sistem menampilkan peta zona kesesuaian habitat. Poin penting:

- Dibungkus `<Suspense>` karena memakai `useSearchParams()` (membaca `?species=`).
- `handlePredict` saat ini **simulasi** (delay 2.5 dtk via `setTimeout`) yang menghasilkan hasil dummy — siap diganti panggilan model nyata.
- Hasil prediksi memunculkan tiga kartu: peta (`SDMMap`), **penilaian risiko IUCN** (4 level: Critical/High/Medium/Low dengan warna & kategori IUCN), dan **metrik model** (AUC-ROC, akurasi, precision, jumlah sampel) yang dihitung dari konstanta `baseAcc` + modifier tahun.
- Tombol ekspor (GeoTIFF/CSV/PDF) dinonaktifkan sampai ada hasil prediksi.

Semua teks via `MODEL_COPY` (EN/ID); gaya warna risiko di `IUCN_STYLE`.


```tsx
"use client";

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Play, Loader2, Map as MapIcon, AlertTriangle, ShieldAlert, ShieldCheck, Shield } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

const SDMMap = dynamic(() => import("@/components/SDMMap").then(mod => mod.SDMMap), { ssr: false });

const SPECIES_OPTIONS = [
  { value: "vachellia-nilotica", label: "Vachellia nilotica (Babul)" },
  { value: "lantana-camara", label: "Lantana camara (Tembelekan)" },
  { value: "merremia-hederacea", label: "Merremia hederacea (Kangkung Pagar)" },
  { value: "clitoria-ternatea", label: "Clitoria ternatea (Telang)" },
  { value: "ageratum-conyzoides", label: "Ageratum conyzoides (Bandotan)" },
];

const YEAR_OPTIONS = ["2040", "2060", "2080", "2100", "2120", "2140", "2160", "2180", "2200"];

const MODEL_COPY = {
  en: {
    title: "Plant Distribution Prediction (SDM)",
    modelParameters: "Model Parameters",
    plantSpecies: "Plant Species",
    timeHorizon: "Year / Time Horizon",
    calculating: "Calculating Prediction...",
    runPrediction: "Predict Distribution",
    predictionMap: "Distribution Prediction Map",
    year: "Year",
    simulatingNote: "Depending on data resolution and parameters, this process may take a few moments.",
    emptyMap: "Choose a species and year, then run a prediction to view the result map.",
    riskLevel: "IUCN Risk Level",
    riskAssessment: "IUCN Risk Assessment — Habitat Suitability",
    riskIntro: "Habitat suitability classification based on IUCN assessment for invasive species",
    inYear: "in",
    modelMetrics: "AI Model Metrics (Validation)",
    suitability: "Suitability",
    reportCsv: "CSV Report",
    reportPdf: "PDF Report",
    statuses: {
      excellent: "Excellent",
      good: "Good",
      fair: "Fair",
    },
    metrics: {
      auc: "AUC-ROC",
      accuracy: "Prediction Accuracy",
      precision: "Precision",
      samples: "Sample Data",
      points: "points",
    },
    risks: {
      critical: {
        level: "Critical Risk",
        description: "Core invasion zone — habitat is highly suitable, populations are established and spreading aggressively.",
        suitability: "Very High (>80%)",
      },
      high: {
        level: "High Risk",
        description: "Active spread zone — habitat is suitable, species actively colonize and affect local ecosystems.",
        suitability: "High (60-80%)",
      },
      medium: {
        level: "Medium Risk",
        description: "Transition zone — habitat is moderately suitable, with colonization potential under certain conditions.",
        suitability: "Medium (40-60%)",
      },
      low: {
        level: "Low Risk",
        description: "Peripheral zone — habitat is less suitable, invasion risk is low but monitoring is still needed.",
        suitability: "Low (<40%)",
      },
    },
  },
  id: {
    title: "Prediksi Persebaran Tumbuhan (SDM)",
    modelParameters: "Parameter Model",
    plantSpecies: "Spesies Tumbuhan",
    timeHorizon: "Tahun / Time Horizon",
    calculating: "Menghitung Prediksi...",
    runPrediction: "Prediksi Persebaran",
    predictionMap: "Peta Hasil Prediksi Persebaran",
    year: "Tahun",
    simulatingNote: "Bergantung pada resolusi data dan parameter, proses ini membutuhkan beberapa waktu.",
    emptyMap: "Pilih spesies dan tahun, lalu jalankan prediksi untuk melihat peta hasil.",
    riskLevel: "Tingkat Risiko IUCN",
    riskAssessment: "Penilaian Risiko IUCN — Habitat Suitability",
    riskIntro: "Klasifikasi kesesuaian habitat berdasarkan penilaian IUCN untuk spesies invasif",
    inYear: "pada tahun",
    modelMetrics: "Metrik AI Model (Validation)",
    suitability: "Suitability",
    reportCsv: "Laporan CSV",
    reportPdf: "Laporan PDF",
    statuses: {
      excellent: "Sangat Baik",
      good: "Baik",
      fair: "Cukup",
    },
    metrics: {
      auc: "AUC-ROC",
      accuracy: "Akurasi Prediksi",
      precision: "Precision",
      samples: "Data Sampel",
      points: "titik",
    },
    risks: {
      critical: {
        level: "Critical Risk",
        description: "Zona inti invasi — habitat sangat sesuai, populasi telah mapan dan menyebar agresif.",
        suitability: "Sangat Tinggi (>80%)",
      },
      high: {
        level: "High Risk",
        description: "Zona penyebaran aktif — habitat sesuai, spesies aktif berkoloni dan berdampak pada ekosistem lokal.",
        suitability: "Tinggi (60-80%)",
      },
      medium: {
        level: "Medium Risk",
        description: "Zona transisi — habitat cukup sesuai, spesies memiliki potensi koloni dalam kondisi tertentu.",
        suitability: "Sedang (40-60%)",
      },
      low: {
        level: "Low Risk",
        description: "Zona periferal — habitat kurang sesuai, risiko invasi rendah namun perlu pemantauan.",
        suitability: "Rendah (<40%)",
      },
    },
  },
} as const;

const IUCN_STYLE = {
  critical: {
    color: "#C62828",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-800",
    badgeColor: "bg-red-600",
    icon: AlertTriangle,
    iucnCategory: "Massive Concern (MC)",
  },
  high: {
    color: "#E65100",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-800",
    badgeColor: "bg-orange-600",
    icon: ShieldAlert,
    iucnCategory: "Major Concern (MJ)",
  },
  medium: {
    color: "#F9A825",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-800",
    badgeColor: "bg-yellow-600",
    icon: Shield,
    iucnCategory: "Moderate Concern (MO)",
  },
  low: {
    color: "#2E7D32",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-800",
    badgeColor: "bg-green-600",
    icon: ShieldCheck,
    iucnCategory: "Minor Concern (MI)",
  },
} as const;

const RISK_KEYS = ["critical", "high", "medium", "low"] as const;

function ModelingContent() {
  const searchParams = useSearchParams();
  const [species, setSpecies] = useState(() => {
    const speciesParam = searchParams.get("species");
    return SPECIES_OPTIONS.find(s => s.value === speciesParam)?.value ?? "lantana-camara";
  });
  const [horizon, setHorizon] = useState("2040");
  const { language } = useLanguage();
  const copy = MODEL_COPY[language];

  const [isSimulating, setIsSimulating] = useState(false);
  const [predictionResult, setPredictionResult] = useState<{ species: string, year: string, mapUrl: string } | null>(null);

  const handlePredict = () => {
    setIsSimulating(true);
    setPredictionResult(null);

    setTimeout(() => {
      setIsSimulating(false);
      setPredictionResult({
        species,
        year: horizon,
        mapUrl: `https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop&sepia=1&hue-rotate=${Math.floor(Math.random() * 90)}deg`
      });
    }, 2500);
  };

  const baseAcc = 89;
  const accMod = parseInt(horizon) === 2025 ? 2 : parseInt(horizon) > 2050 ? -4 : 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{copy.title}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{copy.modelParameters}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{copy.plantSpecies}</label>
              <Select value={species} onValueChange={setSpecies}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPECIES_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{copy.timeHorizon}</label>
              <Select value={horizon} onValueChange={setHorizon}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="mt-4 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handlePredict}
              disabled={isSimulating}
            >
              {isSimulating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {copy.calculating}</>
              ) : (
                <><Play className="h-4 w-4" /> {copy.runPrediction}</>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>{copy.predictionMap}</span>
              {predictionResult && <Badge variant="outline" className="text-xs">{copy.year}: {predictionResult.year}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative flex h-[400px] w-full items-center justify-center overflow-hidden rounded-lg border bg-muted text-muted-foreground shadow-inner">
              {isSimulating ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative h-16 w-16">
                    <div className="absolute inset-0 animate-ping rounded-full border-2 border-primary opacity-20"></div>
                    <div className="absolute inset-2 animate-pulse rounded-full border-4 border-primary/50"></div>
                    <MapIcon className="absolute inset-4 h-8 w-8 text-primary animate-bounce shadow-sm" />
                  </div>
                  <p className="text-xs text-muted-foreground w-64 text-center">{copy.simulatingNote}</p>
                </div>
              ) : predictionResult ? (
                <>
                  <div className="absolute inset-0 z-0">
                    <SDMMap species={predictionResult.species} year={predictionResult.year} />
                  </div>
                  <div className="absolute bottom-4 right-4 z-10 bg-background/90 backdrop-blur-md p-3 rounded-lg shadow-lg border">
                    <p className="text-xs font-bold mb-2 text-foreground">{copy.riskLevel}</p>
                    <div className="flex flex-col gap-1.5">
                      {RISK_KEYS.map((riskKey) => (
                        <div key={riskKey} className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: IUCN_STYLE[riskKey].color }} />
                          <span className="text-[10px] text-foreground">{copy.risks[riskKey].level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <MapIcon className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm">{copy.emptyMap}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {predictionResult && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              {copy.riskAssessment}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {copy.riskIntro}{" "}
              <span className="font-medium text-foreground">
                {SPECIES_OPTIONS.find(s => s.value === predictionResult.species)?.label}
              </span>{" "}
              {copy.inYear} <span className="font-medium text-foreground">{predictionResult.year}</span>.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {RISK_KEYS.map((riskKey) => {
                const s = IUCN_STYLE[riskKey];
                const riskCopy = copy.risks[riskKey];
                const Icon = s.icon;
                return (
                  <div
                    key={riskKey}
                    className={`rounded-lg border ${s.borderColor} ${s.bgColor} p-4 transition-all hover:shadow-md`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="rounded-md p-1.5" style={{ backgroundColor: s.color }}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className={`text-sm font-bold ${s.textColor}`}>{riskCopy.level}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{copy.suitability}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{riskCopy.suitability}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">IUCN</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{s.iucnCategory}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{riskCopy.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {predictionResult && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle className="text-base">{copy.modelMetrics}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-8">
              {[
                { label: copy.metrics.auc, value: `0.${baseAcc + accMod + 2}`, status: copy.statuses.excellent },
                { label: copy.metrics.accuracy, value: `${baseAcc + accMod - 1}.4%`, status: copy.statuses.good },
                { label: copy.metrics.precision, value: `${baseAcc + accMod - 3}.1%`, status: copy.statuses.fair },
                { label: copy.metrics.samples, value: `24,500 ${copy.metrics.points}`, status: "Colab" },
              ].map((m) => (
                <div key={m.label} className="flex flex-col items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                  <span className="text-2xl font-bold text-foreground">{m.value}</span>
                  <Badge variant={m.status === copy.statuses.excellent ? "default" : "secondary"} className="text-[10px]">
                    {m.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 mt-2">
        <Button variant="outline" className="gap-2" disabled={!predictionResult}><Download className="h-4 w-4" /> GeoTIFF</Button>
        <Button variant="outline" className="gap-2" disabled={!predictionResult}><Download className="h-4 w-4" /> {copy.reportCsv}</Button>
        <Button variant="outline" className="gap-2" disabled={!predictionResult}><Download className="h-4 w-4" /> {copy.reportPdf}</Button>
      </div>
    </div>
  );
}

export default function Modeling() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ModelingContent />
    </Suspense>
  );
}
```

#### Komponen pendukung: `components/SDMMap.tsx`

Peta hasil SDM. Menerima props `species` & `year`, lalu menggambar "heatmap" zona kesesuaian sebagai kumpulan `circleMarker` Leaflet di sekitar pusat-pusat zona di Baluran. Kepadatan & sebaran titik dihitung dari `severityFactor` (semakin jauh tahun, semakin agresif), dan **deterministik** per kombinasi `species+year` lewat PRNG ber-seed (`hashCode` + `seededRandom`) sehingga hasil sama untuk input yang sama.


```tsx
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface SDMMapProps {
  species: string;
  year: string;
}

// IUCN-based suitability risk zones with their colors
const SUITABILITY_ZONES = {
  critical: { color: "#C62828", label: "Critical Risk" },
  high: { color: "#E65100", label: "High Risk" },
  medium: { color: "#F9A825", label: "Medium Risk" },
  low: { color: "#2E7D32", label: "Low Risk" },
};

// Seed-based pseudo-random for consistent results per species+year
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function SDMMap({ species, year }: SDMMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [-7.833, 114.366], // Baluran National Park
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Using satellite-style tiles or similar if available, but stick to standard OSM for reliability
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;
    
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update map layer when species or year changes
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    // Clear existing layers except the tile layer
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    const yearNum = parseInt(year);
    const severityFactor = Math.max(1, (yearNum - 2025) / 10);
    
    // Base centers of distribution zones
    const zoneCenters = [
      // Critical risk zones — core invasion centers
      { lat: -7.838, lng: 114.375, zone: "critical" as const },
      { lat: -7.805, lng: 114.355, zone: "critical" as const },
      // High risk zones — surrounding areas
      { lat: -7.842, lng: 114.391, zone: "high" as const },
      { lat: -7.840, lng: 114.360, zone: "high" as const },
      { lat: -7.855, lng: 114.410, zone: "high" as const },
      // Medium risk zones — transition areas
      { lat: -7.815, lng: 114.368, zone: "medium" as const },
      { lat: -7.845, lng: 114.395, zone: "medium" as const },
      { lat: -7.825, lng: 114.405, zone: "medium" as const },
      // Low risk zones — peripheral areas
      { lat: -7.820, lng: 114.385, zone: "low" as const },
      { lat: -7.810, lng: 114.415, zone: "low" as const },
      { lat: -7.860, lng: 114.370, zone: "low" as const },
    ];

    const seed = hashCode(`${species}-${year}`);
    const rng = seededRandom(seed);

    // Zone-specific configuration for point density and spread
    const zoneConfig = {
      critical: { points: Math.min(60, 8 + Math.floor(severityFactor * 8)), spread: 0.015, radius: 16, opacity: 0.20 },
      high: { points: Math.min(50, 6 + Math.floor(severityFactor * 6)), spread: 0.020, radius: 14, opacity: 0.16 },
      medium: { points: Math.min(40, 5 + Math.floor(severityFactor * 5)), spread: 0.025, radius: 12, opacity: 0.13 },
      low: { points: Math.min(30, 4 + Math.floor(severityFactor * 4)), spread: 0.030, radius: 10, opacity: 0.10 },
    };

    // Generate suitability heatmap zones
    zoneCenters.forEach((center) => {
      const config = zoneConfig[center.zone];
      const { color } = SUITABILITY_ZONES[center.zone];

      for (let i = 0; i < config.points; i++) {
        const latOffset = (rng() - 0.5) * config.spread * severityFactor * 0.5;
        const lngOffset = (rng() - 0.5) * config.spread * severityFactor * 0.5;

        L.circleMarker([center.lat + latOffset, center.lng + lngOffset], {
          radius: config.radius + (rng() * 6),
          fillColor: color,
          color: color,
          weight: 0,
          opacity: 0,
          fillOpacity: config.opacity,
        }).addTo(map);
      }
    });

  }, [species, year]);

  return (
    <div className="relative isolate h-full w-full">
      <div ref={mapRef} className="h-full w-full rounded-lg" />
    </div>
  );
}
```

### 5.5 `app/data/page.tsx` — Data Explorer

Tabel penjelajah catatan spesies dari database. Fitur:

- **Fetch berparametrer:** `GET /api/v1/plants` dengan query `search`, `family`, `limit`, `offset`; dipicu ulang tiap kali `search`, `familyFilter`, atau `page` berubah.
- **Pencarian + filter famili** (Fabaceae/Verbenaceae/Asteraceae) — mengubah filter mereset halaman ke 1.
- **Tabel** memakai komponen `Table` shadcn; baris bisa diklik → `\/species\/{slug}`.
- **Ekspor CSV** sisi-client (`handleExportCSV`) membentuk Blob dan memicu unduhan tanpa server.
- **Paginasi** Previous/Next berbasis `total` dari `meta`.

Normalisasi field API (camelCase vs snake_case) ditangani saat mapping respons.


```tsx
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
    a.download = "bio-inspector_plants_export.csv";
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
```

### 5.6 `app/species/[id]/page.tsx` — Detail Spesies

Halaman terbesar dan terkaya. `[id]` adalah slug nama ilmiah (mis. `lantana-camara`). Alur:

- **Pengambilan data:** slug → istilah pencarian → `GET /api/v1/plants?search=...`. Jika tidak ada hasil persis, mencoba pencarian dengan kata pertama (genus). Jika tetap kosong, memakai `FALLBACK_PLANTS` (data lokal untuk spesies yang belum masuk DB), barulah menampilkan error.
- **Tampilan baca:** kartu Deskripsi (botani, ekologi, dampak lingkungan — bilingual), Sketsa Herbarium (`aspect-ratio` dari `HERBARIUM_IMAGE_DIMENSIONS`), Sumber Gambar, Taksonomi, dan Sumber.
- **Taksonomi** ditentukan berlapis: data API → cadangan `localStorage` → tabel statis `TAXONOMY_DB`.
- **Mode admin:** jika `sessionStorage.biowatch_admin_auth` berperan admin, muncul tombol **Edit** yang membuka `Dialog` form lengkap (nama, famili, genus, deskripsi, upload sketsa via `POST /api/v1/plants/upload-sketch`, taksonomi, sumber). Submit memunculkan `AlertDialog` konfirmasi, lalu `PATCH /api/v1/plants/{id}`.
- **Terjemahan otomatis:** saat simpan, deskripsi diterjemahkan ke EN+ID via `translateSpeciesDescriptions` sebelum dikirim.
- **Persistensi tambahan:** taksonomi, teks sumber, dan sumber gambar dicadangkan ke `localStorage` (prefiks `biowatch_species_*`).


```tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Network, FileText, Image as ImageIcon, Loader2, Pencil } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getScientificNameWithAuthor } from "@/lib/plant/scientific-name-author";
import { type TranslateLanguage } from "@/lib/translation/client";
import { translateSpeciesDescriptions } from "@/lib/translation/species";

// Taxonomy data for the 5 invasive species
const TAXONOMY_DB: Record<string, { rank: string; value: string }[]> = {
  "vachellia nilotica": [
    { rank: "Kerajaan", value: "Plantae" },
    { rank: "Filum", value: "Tracheophyta" },
    { rank: "Kelas", value: "Magnoliopsida" },
    { rank: "Ordo", value: "Fabales" },
    { rank: "Famili", value: "Fabaceae" },
    { rank: "Genus", value: "Vachellia" },
    { rank: "Spesies", value: "V. nilotica" },
  ],
  "lantana camara": [
    { rank: "Kerajaan", value: "Plantae" },
    { rank: "Filum", value: "Tracheophyta" },
    { rank: "Kelas", value: "Magnoliopsida" },
    { rank: "Ordo", value: "Lamiales" },
    { rank: "Famili", value: "Verbenaceae" },
    { rank: "Genus", value: "Lantana" },
    { rank: "Spesies", value: "L. camara" },
  ],
  "merremia hederacea": [
    { rank: "Kerajaan", value: "Plantae" },
    { rank: "Filum", value: "Tracheophyta" },
    { rank: "Kelas", value: "Magnoliopsida" },
    { rank: "Ordo", value: "Solanales" },
    { rank: "Famili", value: "Convolvulaceae" },
    { rank: "Genus", value: "Merremia" },
    { rank: "Spesies", value: "M. hederacea" },
  ],
  "clitoria ternatea": [
    { rank: "Kerajaan", value: "Plantae" },
    { rank: "Filum", value: "Tracheophyta" },
    { rank: "Kelas", value: "Magnoliopsida" },
    { rank: "Ordo", value: "Fabales" },
    { rank: "Famili", value: "Fabaceae" },
    { rank: "Genus", value: "Clitoria" },
    { rank: "Spesies", value: "C. ternatea" },
  ],
  "ageratum conyzoides": [
    { rank: "Kerajaan", value: "Plantae" },
    { rank: "Filum", value: "Tracheophyta" },
    { rank: "Kelas", value: "Magnoliopsida" },
    { rank: "Ordo", value: "Asterales" },
    { rank: "Famili", value: "Asteraceae" },
    { rank: "Genus", value: "Ageratum" },
    { rank: "Spesies", value: "A. conyzoides" },
  ],
};

interface PlantData {
  id: number;
  commonName: string;
  scientificName: string;
  family: string;
  genus: string;
  botanicalDescription: string;
  botanicalDescriptionEn?: string;
  botanicalDescriptionId?: string;
  ecologicalInformation: string;
  ecologicalInformationEn?: string;
  ecologicalInformationId?: string;
  environmentalImpact: string;
  environmentalImpactEn?: string;
  environmentalImpactId?: string;
  imagePath: string;
  kingdom: string;
  phylum: string;
  taxClass: string;
  orderRank: string;
  taxSpecies: string;
  source?: string;
  imageSource?: string;
}

interface PlantApiRecord {
  id: number;
  commonName?: string;
  common_name?: string;
  scientificName?: string;
  scientific_name?: string;
  family?: string;
  genus?: string;
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
  orderRank?: string;
  order_rank?: string;
  taxSpecies?: string;
  tax_species?: string;
  source?: string;
  imageSource?: string;
  image_source?: string;
}

const SPECIES_SOURCE_STORAGE_PREFIX = "biowatch_species_source_";
const SPECIES_TAXONOMY_STORAGE_PREFIX = "biowatch_species_taxonomy_";

const readStoredSpeciesTaxonomy = (speciesId: number, scientificName: string): { kingdom: string; phylum: string; taxClass: string; order: string; taxSpecies: string } | null => {
  if (typeof window === "undefined") return null;
  try {
    const key = speciesId > 0
      ? `${SPECIES_TAXONOMY_STORAGE_PREFIX}${speciesId}`
      : `${SPECIES_TAXONOMY_STORAGE_PREFIX}tmp_${scientificName.trim().toLowerCase().replace(/\s+/g, "-")}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as { kingdom: string; phylum: string; taxClass: string; order: string; taxSpecies: string };
  } catch {
    return null;
  }
};

const createSpeciesSlug = (scientificName: string) =>
  scientificName.trim().toLowerCase().replace(/\s+/g, "-");

const getSpeciesSourceStorageKey = (speciesId: number, scientificName: string) =>
  speciesId > 0 ? `${SPECIES_SOURCE_STORAGE_PREFIX}${speciesId}` : `${SPECIES_SOURCE_STORAGE_PREFIX}tmp_${createSpeciesSlug(scientificName)}`;

const readStoredSpeciesSourceText = (speciesId: number, scientificName: string) => {
  if (typeof window === "undefined") return "";

  try {
    const primaryKey = getSpeciesSourceStorageKey(speciesId, scientificName);
    const fallbackKey = `${SPECIES_SOURCE_STORAGE_PREFIX}tmp_${createSpeciesSlug(scientificName)}`;
    const raw = localStorage.getItem(primaryKey) || localStorage.getItem(fallbackKey);
    if (!raw) return "";

    const parsed = JSON.parse(raw) as string;
    return typeof parsed === "string" ? parsed : raw;
  } catch {
    return "";
  }
};

const writeStoredSpeciesSourceText = (speciesId: number, scientificName: string, sourceText: string) => {
  if (typeof window === "undefined") return;

  const storageKey = getSpeciesSourceStorageKey(speciesId, scientificName);
  const fallbackKey = `${SPECIES_SOURCE_STORAGE_PREFIX}tmp_${createSpeciesSlug(scientificName)}`;
  const normalizedText = sourceText.trim();

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
  speciesId > 0 ? `${SPECIES_IMAGE_SOURCE_STORAGE_PREFIX}${speciesId}` : `${SPECIES_IMAGE_SOURCE_STORAGE_PREFIX}tmp_${createSpeciesSlug(scientificName)}`;

const readStoredSpeciesImageSourceText = (speciesId: number, scientificName: string) => {
  if (typeof window === "undefined") return "";

  try {
    const primaryKey = getSpeciesImageSourceStorageKey(speciesId, scientificName);
    const fallbackKey = `${SPECIES_IMAGE_SOURCE_STORAGE_PREFIX}tmp_${createSpeciesSlug(scientificName)}`;
    const raw = localStorage.getItem(primaryKey) || localStorage.getItem(fallbackKey);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as string;
    return typeof parsed === "string" ? parsed : raw;
  } catch {
    return "";
  }
};

const writeStoredSpeciesImageSourceText = (speciesId: number, scientificName: string, sourceText: string) => {
  if (typeof window === "undefined") return;

  const storageKey = getSpeciesImageSourceStorageKey(speciesId, scientificName);
  const fallbackKey = `${SPECIES_IMAGE_SOURCE_STORAGE_PREFIX}tmp_${createSpeciesSlug(scientificName)}`;
  const normalizedText = sourceText.trim();

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

const SPECIES_COPY = {
  en: {
    loading: "Loading species data...",
    notFound: "Species was not found in the database.",
    loadFailed: "Failed to load species data.",
    speciesMissing: "Species not found",
    back: "Back",
    cancel: "Cancel",
    saveSpecies: "Save Species",
    saving: "Saving...",
    confirmEditTitle: "Save species changes?",
    confirmEditDesc: "This will update this species record with the current form data.",
    confirmEditAction: "Save Changes",
    editSpecies: "Edit Species",
    updateDetails: "Update the details for",
    scientificName: "Scientific Name",
    commonName: "Common Name",
    family: "Family",
    genus: "Genus",
    descriptionTitle: "Species Description",
    botanicalDescription: "Botanical Description",
    ecologicalInformation: "Ecological Information",
    environmentalImpact: "Environmental Impact",
    source: "Source",
    herbariumSketch: "Herbarium Sketch",
    herbariumSketchUpload: "Click to upload JPG or PNG",
    herbariumSketchMaxSize: "Max 10 MB",
    herbariumSketchUploading: "Uploading...",
    herbariumSketchChange: "Change",
    herbariumSketchRemove: "Remove",
    imageSource: "Image Source",
    imageSourcePlaceholder: "Add the herbarium sketch source, credit, or link...",
    imageSourceEmpty: "No image source available.",
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
    herbariumAlt: "Herbarium sketch of",
    sourceEmpty: "No source available.",
    ranks: {
      Kerajaan: "Kingdom",
      Filum: "Phylum",
      Kelas: "Class",
      Ordo: "Order",
      Famili: "Family",
      Genus: "Genus",
      Spesies: "Species",
    },
  },
  id: {
    loading: "Memuat data spesies...",
    notFound: "Spesies tidak ditemukan dalam database.",
    loadFailed: "Gagal memuat data spesies.",
    speciesMissing: "Spesies tidak ditemukan",
    back: "Kembali",
    cancel: "Batal",
    saveSpecies: "Simpan Spesies",
    saving: "Menyimpan...",
    confirmEditTitle: "Simpan perubahan spesies?",
    confirmEditDesc: "Data spesies ini akan diperbarui dengan isi form saat ini.",
    confirmEditAction: "Simpan Perubahan",
    editSpecies: "Edit Spesies",
    updateDetails: "Perbarui detail untuk",
    scientificName: "Nama Ilmiah",
    commonName: "Nama Umum",
    family: "Famili",
    genus: "Genus",
    descriptionTitle: "Keterangan Spesies",
    botanicalDescription: "Deskripsi Botani",
    ecologicalInformation: "Informasi Ekologi",
    environmentalImpact: "Dampak Lingkungan",
    source: "Sumber",
    herbariumSketch: "Sketsa Herbarium",
    herbariumSketchUpload: "Klik untuk upload JPG atau PNG",
    herbariumSketchMaxSize: "Maks 10 MB",
    herbariumSketchUploading: "Mengupload...",
    herbariumSketchChange: "Ganti",
    herbariumSketchRemove: "Hapus",
    imageSource: "Sumber Gambar",
    imageSourcePlaceholder: "Tambahkan sumber, kredit, atau tautan sketsa herbarium...",
    imageSourceEmpty: "Sumber gambar tidak tersedia.",
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
    herbariumAlt: "Sketsa herbarium",
    sourceEmpty: "Sumber tidak tersedia.",
    ranks: {
      Kerajaan: "Kerajaan",
      Filum: "Filum",
      Kelas: "Kelas",
      Ordo: "Ordo",
      Famili: "Famili",
      Genus: "Genus",
      Spesies: "Spesies",
    },
  },
} as const;

const HERBARIUM_IMAGE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "/sketsa-herbarium-acacia-nilotica.gif": { width: 376, height: 563 },
  "/sketsa-herbarium-lantana-camara.jpg": { width: 1985, height: 2810 },
  "/sketsa-herbarium-merremia-hederacea.jpg": { width: 1985, height: 2810 },
  "/sketsa-herbarium-clitoria-ternatea.jpg": { width: 2474, height: 2029 },
  "/sketsa-herbarium-Ageratum-conyzoides.webp": { width: 850, height: 1109 },
};

// Fallback data for species not yet in the database
const FALLBACK_PLANTS: Record<string, PlantData> = {
  "merremia hederacea": {
    id: 901,
    commonName: "Kangkung Pagar",
    scientificName: "Merremia hederacea (Burm.f.) Hallier f.",
    family: "Convolvulaceae",
    genus: "Merremia",
    botanicalDescription: "Tanaman merambat herba tahunan dari keluarga Convolvulaceae. Daun berbentuk jantung hingga berlekuk 3-5 jari, tipis, dan berwarna hijau cerah. Bunga berbentuk corong berwarna kuning pucat hingga putih. Buah kapsul membulat berisi biji kecil.",
    botanicalDescriptionEn: "Merremia hederacea is an annual herbaceous climber in the Convolvulaceae family. It has thin bright-green leaves that are heart-shaped to 3-5 lobed, pale yellow to white funnel-shaped flowers, and rounded capsules containing small seeds.",
    botanicalDescriptionId: "Tanaman merambat herba tahunan dari keluarga Convolvulaceae. Daun berbentuk jantung hingga berlekuk 3-5 jari, tipis, dan berwarna hijau cerah. Bunga berbentuk corong berwarna kuning pucat hingga putih. Buah kapsul membulat berisi biji kecil.",
    ecologicalInformation: "Tumbuh agresif di tepi hutan, lahan terbuka, dan area terganggu di kawasan tropis. Merremia hederacea merambat cepat menutupi vegetasi bawah dan mampu memanjat pohon hingga menaungi tajuknya.",
    ecologicalInformationEn: "Grows aggressively along forest edges, open land, and disturbed tropical areas. Merremia hederacea spreads rapidly over understory vegetation and can climb trees, shading their crowns.",
    ecologicalInformationId: "Tumbuh agresif di tepi hutan, lahan terbuka, dan area terganggu di kawasan tropis. Merremia hederacea merambat cepat menutupi vegetasi bawah dan mampu memanjat pohon hingga menaungi tajuknya.",
    environmentalImpact: "Menutupi tanaman asli sehingga menghambat fotosintesis, menekan regenerasi alami hutan, dan mengubah struktur vegetasi di sabana dan tepi hutan Taman Nasional Baluran.",
    environmentalImpactEn: "Covers native plants and reduces photosynthesis, suppresses natural forest regeneration, and changes vegetation structure in savannas and forest edges of Baluran National Park.",
    environmentalImpactId: "Menutupi tanaman asli sehingga menghambat fotosintesis, menekan regenerasi alami hutan, dan mengubah struktur vegetasi di sabana dan tepi hutan Taman Nasional Baluran.",
    imagePath: "/sketsa-herbarium-merremia-hederacea.jpg",
    kingdom: "Plantae", phylum: "Tracheophyta", taxClass: "Magnoliopsida", orderRank: "Solanales", taxSpecies: "M. hederacea",
  },
  "clitoria ternatea": {
    id: 902,
    commonName: "Telang",
    scientificName: "Clitoria ternatea L.",
    family: "Fabaceae",
    genus: "Clitoria",
    botanicalDescription: "Tanaman merambat herba perennial dari keluarga Fabaceae. Daun majemuk menyirip ganjil dengan 5-7 anak daun. Bunga berbentuk kupu-kupu berwarna biru tua hingga ungu, kadang putih. Polong pipih berisi biji berbentuk ginjal.",
    botanicalDescriptionEn: "Clitoria ternatea is a perennial herbaceous climber in the Fabaceae family. It has odd-pinnate compound leaves with 5-7 leaflets, butterfly-shaped deep blue to purple flowers that are sometimes white, and flat pods with kidney-shaped seeds.",
    botanicalDescriptionId: "Tanaman merambat herba perennial dari keluarga Fabaceae. Daun majemuk menyirip ganjil dengan 5-7 anak daun. Bunga berbentuk kupu-kupu berwarna biru tua hingga ungu, kadang putih. Polong pipih berisi biji berbentuk ginjal.",
    ecologicalInformation: "Tumbuh di daerah tropis dan subtropis, toleran terhadap berbagai jenis tanah. Di Taman Nasional Baluran, tanaman ini menyebar di area sabana dan pinggiran hutan, bersaing dengan vegetasi asli untuk mendapatkan sinar matahari dan nutrisi.",
    ecologicalInformationEn: "Grows in tropical and subtropical areas and tolerates many soil types. In Baluran National Park, it spreads through savanna areas and forest margins, competing with native vegetation for sunlight and nutrients.",
    ecologicalInformationId: "Tumbuh di daerah tropis dan subtropis, toleran terhadap berbagai jenis tanah. Di Taman Nasional Baluran, tanaman ini menyebar di area sabana dan pinggiran hutan, bersaing dengan vegetasi asli untuk mendapatkan sinar matahari dan nutrisi.",
    environmentalImpact: "Mampu menekan pertumbuhan rumput asli melalui naungan yang padat, mengubah komposisi vegetasi sabana, dan mengganggu ketersediaan pakan bagi herbivora asli seperti Banteng Jawa.",
    environmentalImpactEn: "Can suppress native grasses through dense shading, alter savanna vegetation composition, and disrupt forage availability for native herbivores such as the Javan banteng.",
    environmentalImpactId: "Mampu menekan pertumbuhan rumput asli melalui naungan yang padat, mengubah komposisi vegetasi sabana, dan mengganggu ketersediaan pakan bagi herbivora asli seperti Banteng Jawa.",
    imagePath: "/sketsa-herbarium-clitoria-ternatea.jpg",
    kingdom: "Plantae", phylum: "Tracheophyta", taxClass: "Magnoliopsida", orderRank: "Fabales", taxSpecies: "C. ternatea",
  },
};

export default function SpeciesPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "lantana-camara";
  const { language } = useLanguage();
  const copy = SPECIES_COPY[language];

  const [plant, setPlant] = useState<PlantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isUploadingSketch, setIsUploadingSketch] = useState(false);
  const sketchFileInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState({
    scientificName: "",
    commonName: "",
    family: "",
    genus: "",
    botanicalDescription: "",
    ecologicalInformation: "",
    environmentalImpact: "",
    imagePath: "",
    imageSource: "",
    kingdom: "",
    phylum: "",
    taxClass: "",
    order: "",
    taxSpecies: "",
    source: "",
  });
  const [sourceText, setSourceText] = useState("");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("biowatch_admin_auth");
      if (!stored) {
        setIsAdmin(false);
        return;
      }

      const parsed = JSON.parse(stored) as { role?: string };
      setIsAdmin(Boolean(parsed.role && parsed.role.toLowerCase().includes("admin")));
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const mapPlantRecord = (record: PlantApiRecord): PlantData => ({
    id: record.id,
    commonName: record.commonName || record.common_name || "",
    scientificName: record.scientificName || record.scientific_name || "",
    family: record.family || "",
    genus: record.genus || "",
    botanicalDescription: record.botanicalDescription || record.botanical_description || "",
    botanicalDescriptionEn: record.botanicalDescriptionEn || record.botanical_description_en || "",
    botanicalDescriptionId: record.botanicalDescriptionId || record.botanical_description_id || "",
    ecologicalInformation: record.ecologicalInformation || record.ecological_information || "",
    ecologicalInformationEn: record.ecologicalInformationEn || record.ecological_information_en || "",
    ecologicalInformationId: record.ecologicalInformationId || record.ecological_information_id || "",
    environmentalImpact: record.environmentalImpact || record.environmental_impact || "",
    environmentalImpactEn: record.environmentalImpactEn || record.environmental_impact_en || "",
    environmentalImpactId: record.environmentalImpactId || record.environmental_impact_id || "",
    imagePath: record.imagePath || record.image_path || "",
    kingdom: record.kingdom || "",
    phylum: record.phylum || "",
    taxClass: record.taxClass || record.tax_class || "",
    orderRank: record.orderRank || record.order_rank || "",
    taxSpecies: record.taxSpecies || record.tax_species || "",
    source: record.source || "",
    imageSource: record.imageSource || record.image_source || "",
  });

  useEffect(() => {
    async function fetchPlant() {
      setIsLoading(true);
      setError(null);
      try {
        // Convert slug to search query (e.g. "acacia-nilotica" -> "Acacia nilotica")
        const searchTerm = id.replace(/-/g, " ").trim();
        let res = await fetch(`/api/v1/plants?search=${encodeURIComponent(searchTerm)}&limit=1`);
        let json = await res.json();

        // If no exact match, try a broader search with just the first word (usually the Genus)
        if (!(json.success && json.data && json.data.length > 0)) {
          const firstWord = searchTerm.split(" ")[0];
          if (firstWord && firstWord.length > 2) {
            res = await fetch(`/api/v1/plants?search=${encodeURIComponent(firstWord)}&limit=1`);
            json = await res.json();
          }
        }

        if (json.success && json.data && json.data.length > 0) {
          setPlant(mapPlantRecord(json.data[0]));
        } else {
          // Try fallback data for species not yet in the database
          const fallback = FALLBACK_PLANTS[searchTerm.toLowerCase()];
          if (fallback) {
            setPlant(fallback);
          } else {
            setError(copy.notFound);
          }
        }
      } catch (err) {
        console.error("Failed to fetch plant:", err);
        // Try fallback on network error too
        const searchTerm = id.replace(/-/g, " ").trim();
        const fallback = FALLBACK_PLANTS[searchTerm.toLowerCase()];
        if (fallback) {
          setPlant(fallback);
        } else {
          setError(copy.loadFailed);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlant();
  }, [copy.loadFailed, copy.notFound, id]);

  useEffect(() => {
    if (!plant || isEditing) return;
    const savedTaxonomy = readStoredSpeciesTaxonomy(plant.id, plant.scientificName);
    setDraft({
      scientificName: plant.scientificName,
      commonName: plant.commonName,
      family: plant.family,
      genus: plant.genus,
      botanicalDescription: language === "id"
        ? plant.botanicalDescriptionId || plant.botanicalDescription
        : plant.botanicalDescriptionEn || plant.botanicalDescription,
      ecologicalInformation: language === "id"
        ? plant.ecologicalInformationId || plant.ecologicalInformation
        : plant.ecologicalInformationEn || plant.ecologicalInformation,
      environmentalImpact: language === "id"
        ? plant.environmentalImpactId || plant.environmentalImpact
        : plant.environmentalImpactEn || plant.environmentalImpact,
      imagePath: plant.imagePath || "",
      imageSource: plant.imageSource || readStoredSpeciesImageSourceText(plant.id, plant.scientificName),
      kingdom: plant.kingdom || savedTaxonomy?.kingdom || "",
      phylum: plant.phylum || savedTaxonomy?.phylum || "",
      taxClass: plant.taxClass || savedTaxonomy?.taxClass || "",
      order: plant.orderRank || savedTaxonomy?.order || "",
      taxSpecies: plant.taxSpecies || savedTaxonomy?.taxSpecies || "",
      source: sourceText,
    });
  }, [language, isEditing, plant, sourceText]);

  useEffect(() => {
    if (!plant) {
      setSourceText("");
      return;
    }

    setSourceText(plant.source || readStoredSpeciesSourceText(plant.id, plant.scientificName));
  }, [plant]);

  const handleStartEditing = () => {
    if (!plant) return;
    const savedTaxonomy = readStoredSpeciesTaxonomy(plant.id, plant.scientificName);
    setDraft({
      scientificName: plant.scientificName,
      commonName: plant.commonName,
      family: plant.family,
      genus: plant.genus,
      botanicalDescription: language === "id"
        ? plant.botanicalDescriptionId || plant.botanicalDescription
        : plant.botanicalDescriptionEn || plant.botanicalDescription,
      ecologicalInformation: language === "id"
        ? plant.ecologicalInformationId || plant.ecologicalInformation
        : plant.ecologicalInformationEn || plant.ecologicalInformation,
      environmentalImpact: language === "id"
        ? plant.environmentalImpactId || plant.environmentalImpact
        : plant.environmentalImpactEn || plant.environmentalImpact,
      imagePath: plant.imagePath || "",
      imageSource: plant.imageSource || readStoredSpeciesImageSourceText(plant.id, plant.scientificName),
      kingdom: plant.kingdom || savedTaxonomy?.kingdom || "",
      phylum: plant.phylum || savedTaxonomy?.phylum || "",
      taxClass: plant.taxClass || savedTaxonomy?.taxClass || "",
      order: plant.orderRank || savedTaxonomy?.order || "",
      taxSpecies: plant.taxSpecies || savedTaxonomy?.taxSpecies || "",
      source: plant.source || readStoredSpeciesSourceText(plant.id, plant.scientificName),
    });
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    if (!plant) return;
    const savedTaxonomy = readStoredSpeciesTaxonomy(plant.id, plant.scientificName);
    setDraft({
      scientificName: plant.scientificName,
      commonName: plant.commonName,
      family: plant.family,
      genus: plant.genus,
      botanicalDescription: language === "id"
        ? plant.botanicalDescriptionId || plant.botanicalDescription
        : plant.botanicalDescriptionEn || plant.botanicalDescription,
      ecologicalInformation: language === "id"
        ? plant.ecologicalInformationId || plant.ecologicalInformation
        : plant.ecologicalInformationEn || plant.ecologicalInformation,
      environmentalImpact: language === "id"
        ? plant.environmentalImpactId || plant.environmentalImpact
        : plant.environmentalImpactEn || plant.environmentalImpact,
      imagePath: plant.imagePath || "",
      imageSource: plant.imageSource || readStoredSpeciesImageSourceText(plant.id, plant.scientificName),
      kingdom: plant.kingdom || savedTaxonomy?.kingdom || "",
      phylum: plant.phylum || savedTaxonomy?.phylum || "",
      taxClass: plant.taxClass || savedTaxonomy?.taxClass || "",
      order: plant.orderRank || savedTaxonomy?.order || "",
      taxSpecies: plant.taxSpecies || savedTaxonomy?.taxSpecies || "",
      source: sourceText,
    });
  };

  const handleSketchUpload = async (file: File) => {
    setIsUploadingSketch(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/v1/plants/upload-sketch", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok && json.success) {
        setDraft((prev) => ({ ...prev, imagePath: json.data.path }));
      } else {
        toast.error(json.error || (language === "id" ? "Upload gagal" : "Upload failed"));
      }
    } catch {
      toast.error(language === "id" ? "Upload gagal" : "Upload failed");
    } finally {
      setIsUploadingSketch(false);
    }
  };

  const handleSaveSpecies = async () => {
    if (!plant) return;

    setIsSaving(true);
    try {
      const scientificName = draft.scientificName.trim();
      const commonName = draft.commonName.trim();
      const family = draft.family.trim();
      const genus = draft.genus.trim();

      if (!scientificName || !family || !genus) {
        toast.error(language === "id" ? "Nama ilmiah, famili, dan genus wajib diisi" : "Scientific name, family, and genus are required");
        return;
      }

      const sourceLanguage = language as TranslateLanguage;
      const translatedFields = await translateSpeciesDescriptions({
        botanicalDescription: draft.botanicalDescription,
        ecologicalInformation: draft.ecologicalInformation,
        environmentalImpact: draft.environmentalImpact,
        sourceLanguage,
      });

      const payload = language === "id"
        ? {
            scientificName,
            commonName: commonName || scientificName,
            family,
            genus,
            botanicalDescription: draft.botanicalDescription,
            botanicalDescriptionEn: translatedFields.botanicalDescriptionEn,
            botanicalDescriptionId: translatedFields.botanicalDescriptionId,
            ecologicalInformation: draft.ecologicalInformation,
            ecologicalInformationEn: translatedFields.ecologicalInformationEn,
            ecologicalInformationId: translatedFields.ecologicalInformationId,
            environmentalImpact: draft.environmentalImpact,
            environmentalImpactEn: translatedFields.environmentalImpactEn,
            environmentalImpactId: translatedFields.environmentalImpactId,
            imagePath: draft.imagePath.trim(),
            imageSource: draft.imageSource.trim(),
            source: draft.source.trim(),
          }
        : {
            scientificName,
            commonName: commonName || scientificName,
            family,
            genus,
            botanicalDescription: draft.botanicalDescription,
            botanicalDescriptionEn: translatedFields.botanicalDescriptionEn,
            botanicalDescriptionId: translatedFields.botanicalDescriptionId,
            ecologicalInformation: draft.ecologicalInformation,
            ecologicalInformationEn: translatedFields.ecologicalInformationEn,
            ecologicalInformationId: translatedFields.ecologicalInformationId,
            environmentalImpact: draft.environmentalImpact,
            environmentalImpactEn: translatedFields.environmentalImpactEn,
            environmentalImpactId: translatedFields.environmentalImpactId,
            imagePath: draft.imagePath.trim(),
            imageSource: draft.imageSource.trim(),
            kingdom: draft.kingdom.trim(),
            phylum: draft.phylum.trim(),
            taxClass: draft.taxClass.trim(),
            orderRank: draft.order.trim(),
            taxSpecies: draft.taxSpecies.trim(),
            source: draft.source.trim(),
          };

      const response = await fetch(`/api/v1/plants/${plant.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || "Failed to update species");
      }

      const updatedPlant = mapPlantRecord(result.data);
      setPlant(updatedPlant);
      writeStoredSpeciesSourceText(plant.id, scientificName, draft.source);
      writeStoredSpeciesImageSourceText(plant.id, scientificName, draft.imageSource);

      // Persist taxonomy fields to localStorage
      const taxonomyKey = `${SPECIES_TAXONOMY_STORAGE_PREFIX}${plant.id}`;
      const taxonomy = { kingdom: draft.kingdom.trim(), phylum: draft.phylum.trim(), taxClass: draft.taxClass.trim(), order: draft.order.trim(), taxSpecies: draft.taxSpecies.trim() };
      if (Object.values(taxonomy).some((v) => v)) {
        localStorage.setItem(taxonomyKey, JSON.stringify(taxonomy));
      } else {
        localStorage.removeItem(taxonomyKey);
      }

      setSourceText(updatedPlant.source || draft.source.trim());
      setIsEditing(false);
      toast.success(language === "id" ? "Detail spesies berhasil diperbarui" : "Species details updated successfully");
    } catch (err) {
      console.error("Failed to update plant details:", err);
      toast.error(language === "id" ? "Gagal memperbarui detail spesies" : "Failed to update species details");
    } finally {
      setIsSaving(false);
    }
  };

  // Get taxonomy for the species — localStorage overrides TAXONOMY_DB
  const taxonomy = (() => {
    if (!plant) return [];
    const saved = readStoredSpeciesTaxonomy(plant.id, plant.scientificName);
    // API data takes priority; localStorage is a fallback for older records
    const apiHasTaxonomy = plant.kingdom || plant.phylum || plant.taxClass || plant.orderRank || plant.taxSpecies;
    if (apiHasTaxonomy) {
      return [
        { rank: "Kerajaan", value: plant.kingdom || "Plantae" },
        ...(plant.phylum ? [{ rank: "Filum", value: plant.phylum }] : []),
        ...(plant.taxClass ? [{ rank: "Kelas", value: plant.taxClass }] : []),
        ...(plant.orderRank ? [{ rank: "Ordo", value: plant.orderRank }] : []),
        { rank: "Famili", value: plant.family },
        { rank: "Genus", value: plant.genus },
        { rank: "Spesies", value: plant.taxSpecies || plant.scientificName },
      ];
    }
    if (saved && (saved.kingdom || saved.phylum || saved.taxClass || saved.order || saved.taxSpecies)) {
      return [
        { rank: "Kerajaan", value: saved.kingdom || "Plantae" },
        ...(saved.phylum ? [{ rank: "Filum", value: saved.phylum }] : []),
        ...(saved.taxClass ? [{ rank: "Kelas", value: saved.taxClass }] : []),
        ...(saved.order ? [{ rank: "Ordo", value: saved.order }] : []),
        { rank: "Famili", value: plant.family },
        { rank: "Genus", value: plant.genus },
        { rank: "Spesies", value: saved.taxSpecies || plant.scientificName },
      ];
    }
    return TAXONOMY_DB[plant.scientificName.toLowerCase()] || [
      { rank: "Kerajaan", value: "Plantae" },
      { rank: "Famili", value: plant.family },
      { rank: "Genus", value: plant.genus },
      { rank: "Spesies", value: plant.scientificName },
    ];
  })();
  const botanicalDescription = language === "id"
    ? plant?.botanicalDescriptionId || plant?.botanicalDescription
    : plant?.botanicalDescriptionEn || plant?.botanicalDescription;
  const ecologicalInformation = language === "id"
    ? plant?.ecologicalInformationId || plant?.ecologicalInformation
    : plant?.ecologicalInformationEn || plant?.ecologicalInformation;
  const environmentalImpact = language === "id"
    ? plant?.environmentalImpactId || plant?.environmentalImpact
    : plant?.environmentalImpactEn || plant?.environmentalImpact;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/20 p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !plant) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-muted/20 p-8">
        <p className="text-lg font-semibold text-muted-foreground">{error || copy.speciesMissing}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {copy.back}
        </button>
      </div>
    );
  }

  const displayScientificName = getScientificNameWithAuthor(plant.scientificName);
  const imageSourceText = plant.imageSource || readStoredSpeciesImageSourceText(plant.id, plant.scientificName);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-muted/20 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-background border shadow-sm hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold md:text-3xl italic">{displayScientificName}</h1>
          <p className="text-sm text-muted-foreground">{plant.commonName}</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <div className="flex flex-col gap-6">

          {/* Description */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b bg-muted/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">{copy.descriptionTitle}</h2>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleStartEditing}
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{copy.botanicalDescription}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{botanicalDescription}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{copy.ecologicalInformation}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{ecologicalInformation}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{copy.environmentalImpact}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{environmentalImpact}</p>
              </div>
            </div>
          </div>

          {/* Sketch */}
          {plant.imagePath && (
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
                <ImageIcon className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">{copy.herbariumSketch}</h2>
              </div>
              <div
                className="relative w-full overflow-hidden bg-white"
                style={{
                  aspectRatio: HERBARIUM_IMAGE_DIMENSIONS[plant.imagePath]
                    ? `${HERBARIUM_IMAGE_DIMENSIONS[plant.imagePath].width} / ${HERBARIUM_IMAGE_DIMENSIONS[plant.imagePath].height}`
                    : "4 / 5",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={plant.imagePath}
                  alt={`${copy.herbariumAlt} ${plant.scientificName}`}
                  className="block h-full w-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Image Source */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">{copy.imageSource}</h2>
            </div>
            <div className="p-4">
              <div className="rounded-lg border bg-background px-3 py-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {imageSourceText.trim() || copy.imageSourceEmpty}
                </p>
              </div>
            </div>
          </div>

          {/* Taxonomy */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
              <Network className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">{copy.taxonomy}</h2>
            </div>
            <div className="p-4">
              <div className="flex flex-col space-y-2">
                {taxonomy.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1 border-b last:border-0 border-muted">
                    <span className="text-muted-foreground">{copy.ranks[item.rank as keyof typeof copy.ranks] || item.rank}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Source */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">{copy.source}</h2>
            </div>
            <div className="p-4">
              <div className="rounded-lg border bg-background px-3 py-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {sourceText.trim() || copy.sourceEmpty}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isEditing} onOpenChange={(open) => (open ? handleStartEditing() : handleCancelEditing())}>
        <DialogContent className="w-[min(100vw-2rem,44rem)] max-w-none overflow-hidden rounded-lg p-0 shadow-2xl">
          <div className="border-b bg-muted/40 px-6 py-5">
            <DialogHeader className="space-y-1 pr-8 text-left">
              <DialogTitle className="text-xl font-semibold">{copy.editSpecies}</DialogTitle>
              <DialogDescription className="text-sm">
                {copy.updateDetails} <span className="italic">({plant.scientificName})</span>
              </DialogDescription>
            </DialogHeader>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.scientificName.trim() || !draft.family.trim() || !draft.genus.trim()) {
                toast.error(language === "id" ? "Nama ilmiah, famili, dan genus wajib diisi" : "Scientific name, family, and genus are required");
                return;
              }
              setShowSaveConfirm(true);
            }}
            className="max-h-[calc(90vh-6.5rem)] space-y-5 overflow-y-auto bg-card px-6 py-5"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-scientific-name">{copy.scientificName}</Label>
                <Input
                  id="edit-scientific-name"
                  value={draft.scientificName}
                  onChange={(event) => setDraft((current) => ({ ...current, scientificName: event.target.value }))}
                  className="italic"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-common-name">{copy.commonName}</Label>
                <Input
                  id="edit-common-name"
                  value={draft.commonName}
                  onChange={(event) => setDraft((current) => ({ ...current, commonName: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-family">{copy.family}</Label>
                <Input
                  id="edit-family"
                  value={draft.family}
                  onChange={(event) => setDraft((current) => ({ ...current, family: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-genus">{copy.genus}</Label>
                <Input
                  id="edit-genus"
                  value={draft.genus}
                  onChange={(event) => setDraft((current) => ({ ...current, genus: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-botanical-description" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {copy.botanicalDescription}
              </Label>
              <Textarea
                id="edit-botanical-description"
                value={draft.botanicalDescription}
                onChange={(event) => setDraft((current) => ({ ...current, botanicalDescription: event.target.value }))}
                rows={4}
                className="min-h-[112px] rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-ecological-information" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {copy.ecologicalInformation}
              </Label>
              <Textarea
                id="edit-ecological-information"
                value={draft.ecologicalInformation}
                onChange={(event) => setDraft((current) => ({ ...current, ecologicalInformation: event.target.value }))}
                rows={4}
                className="min-h-[112px] rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-environmental-impact" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {copy.environmentalImpact}
              </Label>
              <Textarea
                id="edit-environmental-impact"
                value={draft.environmentalImpact}
                onChange={(event) => setDraft((current) => ({ ...current, environmentalImpact: event.target.value }))}
                rows={4}
                className="min-h-[112px] rounded-xl"
              />
            </div>

            {/* Herbarium Sketch */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {copy.herbariumSketch}
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
              {draft.imagePath.trim() ? (
                <div className="relative rounded-xl border overflow-hidden bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={draft.imagePath.trim()}
                    alt="Herbarium preview"
                    className="max-h-56 w-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/40 px-3 py-2">
                    <span className="text-xs text-white truncate">{draft.imagePath.split("/").pop()}</span>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => sketchFileInputRef.current?.click()}
                        disabled={isUploadingSketch}
                        className="rounded-md bg-white/20 hover:bg-white/30 px-2.5 py-1 text-xs text-white font-medium transition-colors"
                      >
                        {isUploadingSketch ? copy.herbariumSketchUploading : copy.herbariumSketchChange}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraft((prev) => ({ ...prev, imagePath: "" }))}
                        className="rounded-md bg-destructive/80 hover:bg-destructive px-2.5 py-1 text-xs text-white font-medium transition-colors"
                      >
                        {copy.herbariumSketchRemove}
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
                    {isUploadingSketch ? copy.herbariumSketchUploading : copy.herbariumSketchUpload}
                  </span>
                  <span className="text-xs opacity-60">{copy.herbariumSketchMaxSize}</span>
                </button>
              )}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="edit-image-source" className="text-xs text-muted-foreground">
                  {copy.imageSource}
                </Label>
                <Textarea
                  id="edit-image-source"
                  value={draft.imageSource}
                  onChange={(event) => setDraft((current) => ({ ...current, imageSource: event.target.value }))}
                  placeholder={copy.imageSourcePlaceholder}
                  rows={2}
                  className="min-h-[72px] rounded-xl"
                />
              </div>
            </div>

            {/* Plant Taxonomy */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {copy.taxonomy}
              </Label>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-kingdom" className="text-xs text-muted-foreground">{copy.kingdom}</Label>
                  <Input
                    id="edit-kingdom"
                    value={draft.kingdom}
                    onChange={(e) => setDraft((prev) => ({ ...prev, kingdom: e.target.value }))}
                    placeholder={copy.kingdomPlaceholder}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-phylum" className="text-xs text-muted-foreground">{copy.phylum}</Label>
                  <Input
                    id="edit-phylum"
                    value={draft.phylum}
                    onChange={(e) => setDraft((prev) => ({ ...prev, phylum: e.target.value }))}
                    placeholder={copy.phylumPlaceholder}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-taxClass" className="text-xs text-muted-foreground">{copy.taxClass}</Label>
                  <Input
                    id="edit-taxClass"
                    value={draft.taxClass}
                    onChange={(e) => setDraft((prev) => ({ ...prev, taxClass: e.target.value }))}
                    placeholder={copy.classPaceholder}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-order" className="text-xs text-muted-foreground">{copy.order}</Label>
                  <Input
                    id="edit-order"
                    value={draft.order}
                    onChange={(e) => setDraft((prev) => ({ ...prev, order: e.target.value }))}
                    placeholder={copy.orderPlaceholder}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-taxFamily" className="text-xs text-muted-foreground">{copy.family}</Label>
                  <Input
                    id="edit-taxFamily"
                    value={draft.family}
                    onChange={(e) => setDraft((prev) => ({ ...prev, family: e.target.value }))}
                    placeholder="e.g., Asteraceae"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-taxGenus" className="text-xs text-muted-foreground">{copy.genus}</Label>
                  <Input
                    id="edit-taxGenus"
                    value={draft.genus}
                    onChange={(e) => setDraft((prev) => ({ ...prev, genus: e.target.value }))}
                    placeholder="e.g., Ageratum"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-taxSpecies" className="text-xs text-muted-foreground">{copy.taxSpecies}</Label>
                  <Input
                    id="edit-taxSpecies"
                    value={draft.taxSpecies}
                    onChange={(e) => setDraft((prev) => ({ ...prev, taxSpecies: e.target.value }))}
                    placeholder={copy.taxSpeciesPlaceholder}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-source" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {copy.source}
              </Label>
              <Textarea
                id="edit-source"
                value={draft.source}
                onChange={(event) => setDraft((current) => ({ ...current, source: event.target.value }))}
                rows={4}
                className="min-h-[112px] rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleCancelEditing} disabled={isSaving}>
                {copy.cancel}
              </Button>
              <Button type="submit" disabled={isSaving || !draft.scientificName.trim() || !draft.family.trim() || !draft.genus.trim()}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {copy.saving}
                  </>
                ) : (
                  copy.saveSpecies
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirmEditTitle}</AlertDialogTitle>
            <AlertDialogDescription>{copy.confirmEditDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSaving}
              onClick={() => {
                setShowSaveConfirm(false);
                void handleSaveSpecies();
              }}
            >
              {copy.confirmEditAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

### 5.7 `app/map/observations/[id]/page.tsx` — Detail Observasi

Menampilkan detail satu observasi dari peta. `id` dicocokkan ke `MAP_OBSERVATIONS` via `getMapObservationById`. Layout dua kolom (sticky image + panel detail): hasil deteksi (spesies + tautan ke halaman spesies, confidence, waktu), lokasi (lat/lng presisi, elevasi), dan info gambar (file, ukuran, sumber). Bila id tidak ditemukan, menampilkan pesan kosong + tombol kembali. Komponen kecil `DetailRow` dipakai ulang untuk tiap baris atribut.


```tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Image as ImageIcon, MapPin, Sprout } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getMapObservationById,
  getMapObservationSpeciesHref,
  MAP_SPECIES_COLOR,
} from "@/lib/map-observations";

const OBSERVATION_COPY = {
  en: {
    back: "Back",
    missing: "Observation not found",
    detectionResult: "Detection Result",
    detectedSpecies: "Detected Species",
    confidence: "Confidence",
    identifiedAt: "Identified At",
    location: "Location",
    latitude: "Latitude",
    longitude: "Longitude",
    elevation: "Elevation",
    source: "Source",
    imageInfo: "Image Info",
    file: "File",
    size: "Size",
    capturedLocation: "Captured Location",
  },
  id: {
    back: "Kembali",
    missing: "Observasi tidak ditemukan",
    detectionResult: "Hasil Deteksi",
    detectedSpecies: "Spesies Terdeteksi",
    confidence: "Kepercayaan",
    identifiedAt: "Diidentifikasi Pada",
    location: "Lokasi",
    latitude: "Latitude",
    longitude: "Longitude",
    elevation: "Elevasi",
    source: "Sumber",
    imageInfo: "Info Gambar",
    file: "File",
    size: "Ukuran",
    capturedLocation: "Lokasi Pengambilan",
  },
} as const;

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="border-b border-border/70 py-2.5 last:border-0 lg:py-3">
    <p className="mb-1 text-[10px] font-medium text-muted-foreground lg:text-[11px]">{label}</p>
    <div className="break-words text-xs font-semibold text-foreground lg:text-sm">{children}</div>
  </div>
);

export default function MapObservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const copy = OBSERVATION_COPY[language];
  const id = typeof params?.id === "string" ? params.id : "";
  const observation = getMapObservationById(id);

  if (!observation) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-4 bg-muted/30 p-6 text-center">
        <p className="text-lg font-semibold text-muted-foreground">{copy.missing}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {copy.back}
        </button>
      </div>
    );
  }

  const speciesColor = MAP_SPECIES_COLOR[observation.species] || "#2E7D32";
  const speciesHref = getMapObservationSpeciesHref(observation);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-muted/40">
      <div className="mx-auto grid w-full max-w-7xl gap-3 lg:my-6 lg:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.35fr)] lg:gap-6 lg:bg-transparent lg:px-6 xl:grid-cols-[minmax(430px,0.9fr)_minmax(0,1.4fr)]">
        <section className="relative h-60 overflow-hidden bg-white shadow-sm lg:sticky lg:top-6 lg:h-[calc(100vh-112px)] lg:min-h-[620px] lg:rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={observation.imagePath}
            alt={observation.species}
            className="h-full w-full object-cover lg:object-contain"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/75" />
          <button
            type="button"
            onClick={() => router.back()}
            aria-label={copy.back}
            className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white transition-colors hover:bg-black/50 lg:left-4 lg:top-4 lg:h-10 lg:w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="absolute inset-x-4 bottom-3 lg:bottom-4">
            <span
              className="inline-flex rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: speciesColor }}
            >
              {observation.confidence.toFixed(1)}% confidence
            </span>
            <h1 className="mt-1.5 text-xl font-semibold text-white lg:mt-2 lg:text-2xl">{observation.species}</h1>
            <p className="mt-1 hidden text-sm font-medium text-white/80 lg:block">{observation.location}</p>
          </div>
        </section>

        <main className="grid gap-3 px-4 py-1 pb-4 lg:grid-cols-2 lg:content-start lg:gap-4 lg:p-0">
          <section className="rounded-lg border bg-card p-3 shadow-sm lg:p-5">
            <div className="mb-2 flex items-center gap-2.5 lg:mb-4 lg:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary lg:h-9 lg:w-9">
                <Sprout className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold lg:text-base">{copy.detectionResult}</h2>
            </div>
            <DetailRow label={copy.detectedSpecies}>
              <Link
                href={speciesHref}
                className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
              >
                {observation.species}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </DetailRow>
            <DetailRow label={copy.confidence}>{observation.confidence.toFixed(1)}%</DetailRow>
            <DetailRow label={copy.identifiedAt}>{observation.identifiedAt}</DetailRow>
          </section>

          <section className="rounded-lg border bg-card p-3 shadow-sm lg:p-5">
            <div className="mb-2 flex items-center gap-2.5 lg:mb-4 lg:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary lg:h-9 lg:w-9">
                <MapPin className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold lg:text-base">{copy.location}</h2>
            </div>
            <DetailRow label={copy.latitude}>{observation.lat.toFixed(8)}</DetailRow>
            <DetailRow label={copy.longitude}>{observation.lng.toFixed(8)}</DetailRow>
            <div className="hidden lg:block">
              <DetailRow label={copy.elevation}>{observation.elevation} m dpl</DetailRow>
              <DetailRow label={copy.capturedLocation}>{observation.location}</DetailRow>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-3 shadow-sm lg:col-span-2 lg:p-5">
            <div className="mb-2 flex items-center gap-2.5 lg:mb-4 lg:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary lg:h-9 lg:w-9">
                <ImageIcon className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold lg:text-base">{copy.imageInfo}</h2>
            </div>
            <DetailRow label={copy.file}>{observation.imageFile}</DetailRow>
            <DetailRow label={copy.size}>{observation.imageSize}</DetailRow>
            <DetailRow label={copy.source}>{observation.source}</DetailRow>
          </section>
        </main>
      </div>
    </div>
  );
}
```

### 5.8 `app/not-found.tsx` — Halaman 404

Halaman fallback Next.js untuk rute tak dikenal. Mencatat path yang gagal ke console lalu menampilkan pesan 404 sederhana + tautan kembali ke beranda.


```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const NotFound = () => {
  const pathname = usePathname();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", pathname);
  }, [pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <Link href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
```

---

## 6. Utilitas & Data Frontend Bersama

### 6.1 `lib/map-observations.ts` — Data observasi demo

Sumber data statis untuk peta dan statistik beranda: array `MAP_OBSERVATIONS` (8 observasi dummy di Baluran), pemetaan warna `MAP_SPECIES_COLOR`, daftar spesies `MAP_SPECIES_LIST`, serta helper `getMapObservationById` dan `getMapObservationSpeciesHref`. Karena statis, peta & dashboard tetap hidup tanpa backend.


```ts
import { createScientificNameSlug } from "@/lib/plant/scientific-name-author";

export type MapObservation = {
  id: string;
  lat: number;
  lng: number;
  elevation: number;
  species: string;
  location: string;
  date: string;
  identifiedAt: string;
  source: string;
  confidence: number;
  imagePath: string;
  imageFile: string;
  imageSize: string;
};

export const MAP_OBSERVATIONS: MapObservation[] = [
  {
    id: "obs-vachellia-bekol-20251215",
    lat: -7.838,
    lng: 114.375,
    elevation: 78,
    species: "Vachellia nilotica (L.) P.J.H.Hurter & Mabb.",
    location: "Savana Bekol, Baluran",
    date: "2025-12-15",
    identifiedAt: "15 Dec 2025, 09:32",
    source: "Field Survey",
    confidence: 96,
    imagePath: "/sketsa-herbarium-acacia-nilotica.gif",
    imageFile: "obs-vachellia-bekol-20251215.gif",
    imageSize: "186.2 KB",
  },
  {
    id: "obs-lantana-bama-20251120",
    lat: -7.842,
    lng: 114.391,
    elevation: 14,
    species: "Lantana camara L.",
    location: "Pantai Bama, Baluran",
    date: "2025-11-20",
    identifiedAt: "20 Nov 2025, 08:14",
    source: "GBIF Import",
    confidence: 88,
    imagePath: "/sketsa-herbarium-lantana-camara.jpg",
    imageFile: "obs-lantana-bama-20251120.jpg",
    imageSize: "412.8 KB",
  },
  {
    id: "obs-merremia-baluran-20260105",
    lat: -7.815,
    lng: 114.368,
    elevation: 247,
    species: "Merremia hederacea (Burm.f.) Hallier f.",
    location: "Gunung Baluran, Baluran",
    date: "2026-01-05",
    identifiedAt: "05 Jan 2026, 10:47",
    source: "Citizen Science",
    confidence: 78,
    imagePath: "/sketsa-herbarium-merremia-hederacea.jpg",
    imageFile: "obs-merremia-baluran-20260105.jpg",
    imageSize: "398.4 KB",
  },
  {
    id: "obs-clitoria-forest-20260210",
    lat: -7.855,
    lng: 114.410,
    elevation: 22,
    species: "Clitoria ternatea L.",
    location: "Hutan Tropis, Baluran",
    date: "2026-02-10",
    identifiedAt: "10 Feb 2026, 06:28",
    source: "Remote Sensing",
    confidence: 95,
    imagePath: "/sketsa-herbarium-clitoria-ternatea.jpg",
    imageFile: "obs-clitoria-forest-20260210.jpg",
    imageSize: "524.1 KB",
  },
  {
    id: "obs-ageratum-sumber-batang-20260128",
    lat: -7.820,
    lng: 114.385,
    elevation: 61,
    species: "Ageratum conyzoides L.",
    location: "Pos Sumber Batang, Baluran",
    date: "2026-01-28",
    identifiedAt: "28 Jan 2026, 14:05",
    source: "Field Survey",
    confidence: 75,
    imagePath: "/sketsa-herbarium-ageratum-conyzoides-1.jpg",
    imageFile: "obs-ageratum-sumber-batang-20260128.jpg",
    imageSize: "624.9 KB",
  },
  {
    id: "obs-lantana-bekol-20251014",
    lat: -7.805,
    lng: 114.355,
    elevation: 132,
    species: "Lantana camara L.",
    location: "Savana Bekol, Baluran",
    date: "2025-10-14",
    identifiedAt: "14 Oct 2025, 16:42",
    source: "GBIF Import",
    confidence: 91,
    imagePath: "/sketsa-herbarium-lantana-camara.jpg",
    imageFile: "obs-lantana-bekol-20251014.jpg",
    imageSize: "417.3 KB",
  },
  {
    id: "obs-vachellia-baluran-20250903",
    lat: -7.840,
    lng: 114.360,
    elevation: 214,
    species: "Vachellia nilotica (L.) P.J.H.Hurter & Mabb.",
    location: "Gunung Baluran, Baluran",
    date: "2025-09-03",
    identifiedAt: "03 Sep 2025, 07:55",
    source: "Field Survey",
    confidence: 92,
    imagePath: "/sketsa-herbarium-acacia-nilotica.gif",
    imageFile: "obs-vachellia-baluran-20250903.gif",
    imageSize: "184.7 KB",
  },
  {
    id: "obs-clitoria-bama-20260220",
    lat: -7.845,
    lng: 114.395,
    elevation: 33,
    species: "Clitoria ternatea L.",
    location: "Kawasan Bama, Baluran",
    date: "2026-02-20",
    identifiedAt: "20 Feb 2026, 11:18",
    source: "Citizen Science",
    confidence: 84,
    imagePath: "/sketsa-herbarium-clitoria-ternatea.jpg",
    imageFile: "obs-clitoria-bama-20260220.jpg",
    imageSize: "521.6 KB",
  },
];

export const MAP_SPECIES_COLOR: Record<string, string> = {
  "Vachellia nilotica (L.) P.J.H.Hurter & Mabb.": "#2E7D32",
  "Lantana camara L.": "#1565C0",
  "Merremia hederacea (Burm.f.) Hallier f.": "#6A1B9A",
  "Clitoria ternatea L.": "#E65100",
  "Ageratum conyzoides L.": "#00838F",
};

export const MAP_SPECIES_LIST = Object.keys(MAP_SPECIES_COLOR);

export const getMapObservationById = (id: string) =>
  MAP_OBSERVATIONS.find((observation) => observation.id === id);

export const getMapObservationSpeciesHref = (observation: MapObservation) =>
  `/species/${createScientificNameSlug(observation.species)}`;
```

### 6.2 `lib/plant/scientific-name-author.ts` — Nama ilmiah & slug

Tiga helper kunci yang dipakai lintas halaman:

- `getBinomialName` — ambil dua kata pertama (genus + spesies).
- `getScientificNameWithAuthor` — lengkapi nama dengan author dari tabel `SCIENTIFIC_NAME_WITH_AUTHOR`.
- `createScientificNameSlug` — ubah nama menjadi slug URL (mis. `Lantana camara L.` → `lantana-camara`). Inilah jembatan antara pencarian/tabel/peta dengan rute `/species/[id]`.

```ts
export const getBinomialName = (scientificName: string) =>
  scientificName.trim().split(/\s+/).slice(0, 2).join(" ");

export const getScientificNameWithAuthor = (scientificName: string) => {
  const binomialName = getBinomialName(scientificName).toLowerCase();
  return SCIENTIFIC_NAME_WITH_AUTHOR[binomialName] || scientificName;
};

export const createScientificNameSlug = (scientificName: string) =>
  getBinomialName(scientificName).toLowerCase().replace(/\s+/g, "-");
```

---

## 7. Konvensi & Pola yang Konsisten

1. **`"use client"`** dipasang di hampir semua halaman karena memakai hook interaktif (`useState`, `useEffect`, `useParams`, dll.). Satu-satunya server component utama adalah `app/layout.tsx`.
2. **i18n manual** lewat objek `COPY`/`*_COPY` + `useLanguage()`. Setiap teks baru wajib ditambahkan ke kedua bahasa.
3. **Styling Tailwind + variabel tema.** Warna memakai token semantik (`bg-card`, `text-muted-foreground`, `border`, `text-primary`) yang didefinisikan sebagai CSS variable di `app/globals.css`, bukan warna mentah — memudahkan theming/dark mode.
4. **shadcn/ui** untuk komponen reusable (`Button`, `Input`, `Select`, `Table`, `Dialog`, `AlertDialog`, `Badge`, `Card`, `Textarea`, `Label`) yang berada di `components/ui/`.
5. **Komponen berat di-`dynamic({ ssr: false })`** bila bergantung pada `window` (Leaflet: `GISMap`, `SDMMap`).
6. **Slug-based routing** untuk spesies; selalu lewat `createScientificNameSlug` agar konsisten.
7. **Normalisasi respons API** (camelCase vs snake_case) dilakukan di mapping tiap halaman yang fetch data.
8. **`localStorage`/`sessionStorage`** dipakai untuk preferensi bahasa, status admin, dan cadangan field editor — selalu dibungkus `typeof window !== "undefined"` + `try/catch` agar aman saat SSR.

---

## 8. Cara Menjalankan (Frontend)

```bash
cd FE
npm install
npm run dev      # http://localhost:3000
```

Build & jalankan produksi:

```bash
npm run build
npm run start
```

> Halaman yang melakukan `fetch` ke `\/api/v1/*` membutuhkan backend (atau mock) agar data dinamis tampil; namun peta dan beranda tetap berfungsi dengan data demo statis bila API tidak tersedia (mekanisme fallback).

---

Sub-Sistem Admin & Integrasi API

## Bagian A — Sub-Sistem `/admin/*`

### A.1 Arsitektur Admin

Sub-sistem admin punya tiga karakteristik penting yang berbeda dari halaman publik:

1. **Gerbang autentikasi (auth gate).** Semua rute `/admin/*` dibungkus `app/admin/layout.tsx`, yang memasang `AuthProvider` lalu `AdminGate`. Gate akan menampilkan loader saat memeriksa sesi, menampilkan `AdminLoginPage` jika belum login, dan baru merender konten bila terautentikasi. Pengecualian: `/admin/reset-password` boleh diakses tanpa login (karena dipakai dari link email).

2. **Satu komponen, banyak tab.** File `app/admin/page.tsx` adalah satu komponen besar (`AdminPage`) yang menampilkan salah satu dari 4 tab berdasarkan URL: **users**, **species**, **logs**, **annotation**. Pemetaan dilakukan `getAdminTabFromPath(pathname)`.

3. **Sub-rute = re-export.** Keempat file `app/admin/{users,species,annotation,logs}/page.tsx` isinya identik — hanya me-`export default` ulang `AdminPage`. Jadi URL menentukan tab yang aktif, bukan komponen yang berbeda:

```tsx
// app/admin/users/page.tsx (sama untuk species, annotation, logs)
"use client";
import AdminPage from "../page";
export default AdminPage;
```

#### Diagram alur autentikasi admin

```
Permintaan ke /admin/*
   │
   ▼
app/admin/layout.tsx → <AuthProvider>
   │
   ▼
<AdminGate>
   ├─ isLoading?  ──► tampilkan <Loader2/> ("Memuat...")
   ├─ path == /admin/reset-password? ──► render anak (tanpa auth)
   ├─ !isAuthenticated? ──► render <AdminLoginPage/>
   └─ terautentikasi ──► render <AdminPage/> (tab sesuai URL)
```

#### `app/admin/layout.tsx`


```tsx
"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminLoginPage } from "@/components/AdminLoginPage";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

function AdminGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const { language } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{language === "id" ? "Memuat..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  // Allow access to reset-password page without authentication
  if (pathname === "/admin/reset-password") {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return <AdminLoginPage />;
  }

  return <>{children}</>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminGate>{children}</AdminGate>
    </AuthProvider>
  );
}
```

### A.2 `contexts/AuthContext.tsx` — Autentikasi & Sesi

Provider auth menyimpan `isAuthenticated`, `user`, dan `isLoading`, serta menyediakan fungsi `login`, `logout`, `registerUser`, `updatePassword`. Strategi kuncinya adalah **"DB-first dengan fallback lokal"** agar panel admin tetap bisa dipakai meski backend belum siap:

- **`login(email, password)`** → coba `POST /api/v1/auth/login` dulu. Jika sukses, sesi disimpan ke `sessionStorage` (`biowatch_admin_auth`). Jika API gagal/tidak tersedia, jatuh ke pengecekan kredensial lokal (`FALLBACK_CREDENTIALS` + user terdaftar di `localStorage`). Inilah sumber status admin yang dibaca halaman lain (mis. tombol Edit di halaman spesies membaca `sessionStorage.biowatch_admin_auth`).
- **`updatePassword`** → coba `POST /api/v1/auth/change-password`; bila route tidak ada (404/405) atau jaringan error, jatuh ke update lokal.
- **Sesi disimpan di `sessionStorage`** (bukan `localStorage`) sehingga sesi berakhir saat tab ditutup. Pengecekan saat mount memulihkan sesi yang masih ada.

> **Catatan keamanan untuk tim:** `FALLBACK_CREDENTIALS` memuat kredensial hardcoded (`admin/admin123`) yang ditujukan untuk demo/offline. Untuk produksi, jalur fallback ini sebaiknya dimatikan dan autentikasi sepenuhnya mengandalkan API + cookie/token httpOnly, bukan `sessionStorage`.


```tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthUser {
  id?: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  registerUser: (email: string, password: string, name: string, role: string) => void;
  updatePassword: (email: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "biowatch_admin_auth";
const REGISTERED_USERS_KEY = "biowatch_registered_users";

const getAuthStorage = () => sessionStorage;

/* ─── Hardcoded fallback credentials (used when DB auth fails) ─── */
const FALLBACK_CREDENTIALS = [
  { email: "admin", password: "admin123", name: "Admin", role: "Super Admin" },
  { email: "admin@biowatch.id", password: "admin123", name: "Admin", role: "Super Admin" },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to get all credentials (hardcoded + dynamically registered)
  const getAllLocalCredentials = () => {
    try {
      const stored = localStorage.getItem(REGISTERED_USERS_KEY);
      const registered = stored ? JSON.parse(stored) : [];
      return [...FALLBACK_CREDENTIALS, ...registered];
    } catch {
      return FALLBACK_CREDENTIALS;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    try {
      const stored = getAuthStorage().getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setIsAuthenticated(true);
      }
    } catch {
      getAuthStorage().removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Try DB auth first via API
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          const userData: AuthUser = {
            id: json.user.id,
            name: json.user.name,
            email: json.user.email,
            role: json.user.role,
          };
          setUser(userData);
          setIsAuthenticated(true);
          getAuthStorage().setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
          localStorage.removeItem(AUTH_STORAGE_KEY);
          return true;
        }
      }
    } catch (err) {
      console.warn("DB auth unavailable, falling back to local auth:", err);
    }

    // Fallback: local credential check
    await new Promise((resolve) => setTimeout(resolve, 300));

    const allCredentials = getAllLocalCredentials();
    const found = allCredentials.find(
      (cred) => cred.email === email && cred.password === password
    );

    if (found) {
      const userData = { name: found.name, email: found.email, role: found.role };
      setUser(userData);
      setIsAuthenticated(true);
      getAuthStorage().setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return true;
    }

    return false;
  };

  const registerUser = (email: string, password: string, name: string, role: string) => {
    try {
      const stored = localStorage.getItem(REGISTERED_USERS_KEY);
      const registered = stored ? JSON.parse(stored) : [];
      registered.push({ email, password, name, role });
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registered));
    } catch {
      // Silently fail for mock
    }
  };

  const updatePassword = async (email: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    // Try backend API first (for users authenticated via DB)
    try {
      const res = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword, newPassword }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return true;
        // API responded but rejected (e.g., wrong password)
        return false;
      }
      // API route exists but returned error (not 404/network)
      if (res.status !== 404 && res.status !== 405) {
        return false;
      }
    } catch {
      // Network error or API unavailable — fall through to local check
    }

    // Fallback: local credential check (for fallback/offline logins)
    try {
      // Check registered users in localStorage
      const stored = localStorage.getItem(REGISTERED_USERS_KEY);
      const registered: Array<{ email: string; password: string; name: string; role: string }> = stored ? JSON.parse(stored) : [];
      const userIdx = registered.findIndex(
        (cred) => cred.email === email && cred.password === currentPassword
      );
      if (userIdx !== -1) {
        registered[userIdx].password = newPassword;
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registered));
        return true;
      }

      // Check fallback credentials
      const fallbackIdx = FALLBACK_CREDENTIALS.findIndex(
        (cred) => cred.email === email && cred.password === currentPassword
      );
      if (fallbackIdx !== -1) {
        FALLBACK_CREDENTIALS[fallbackIdx].password = newPassword;
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    getAuthStorage().removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, registerUser, updatePassword, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

### A.3 `components/AdminLoginPage.tsx` — Halaman Login

Form login yang dirender oleh `AdminGate` saat belum terautentikasi. Fitur:

- Submit memanggil `login()` dari `useAuth()`.
- **Proteksi brute-force:** mengunci form selama 1 menit setelah 5 percobaan gagal (state percobaan + countdown).
- **Lupa password:** dialog terpisah yang memanggil `POST /api/v1/auth/forgot-password`, lalu menampilkan layar konfirmasi "cek email Anda".
- Toggle tampil/sembunyi password, indikator loading, dan pesan error bilingual via `LOGIN_COPY`.


```tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Leaf, Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const LOGIN_COPY = {
  en: {
    subtitle: "Sign in to access the administration panel",
    emailLabel: "Email Address",
    emailPlaceholder: "Enter your email address",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    locked: "Locked",
    signingIn: "Signing in...",
    signIn: "Sign In to Admin Panel",
    forgot: "Forgot password?",
    footer: "Protected area - authorized personnel only",
    lockout: "Account locked after 5 incorrect password attempts. Please wait 1 minute.",
    invalid: (left: number) => `Invalid email or password. Attempts left: ${left}`,
    forgotSendError: "An error occurred while sending the email.",
    forgotNetworkError: "Connection error. Please try again.",
    checkEmail: "Check Your Email",
    resetSent: (email: string) => <>A password reset link has been sent to <strong>{email}</strong>. Please check your inbox or spam folder.</>,
    backLogin: "Back to Login",
    forgotTitle: "Forgot Password",
    forgotDesc: "Enter your email address and we will send a link to reset your password.",
    sending: "Sending...",
    sendReset: "Send Reset Link",
  },
  id: {
    subtitle: "Masuk untuk mengakses panel administrasi",
    emailLabel: "Alamat Email",
    emailPlaceholder: "Masukkan alamat email",
    passwordLabel: "Password",
    passwordPlaceholder: "Masukkan password",
    locked: "Terkunci",
    signingIn: "Masuk...",
    signIn: "Masuk ke Panel Admin",
    forgot: "Lupa password?",
    footer: "Area terlindungi - hanya untuk personel berwenang",
    lockout: "Akun terkunci karena 5 kali salah password. Silakan tunggu 1 menit.",
    invalid: (left: number) => `Email atau password tidak valid. Kesempatan tersisa: ${left}`,
    forgotSendError: "Terjadi kesalahan saat mengirim email.",
    forgotNetworkError: "Terjadi kesalahan koneksi. Silakan coba lagi.",
    checkEmail: "Cek Email Anda",
    resetSent: (email: string) => <>Link reset password telah dikirim ke <strong>{email}</strong>. Silakan cek inbox atau folder spam Anda.</>,
    backLogin: "Kembali ke Login",
    forgotTitle: "Lupa Password",
    forgotDesc: "Masukkan alamat email Anda dan kami akan mengirimkan link untuk mereset password.",
    sending: "Mengirim...",
    sendReset: "Kirim Link Reset",
  },
} as const;

export function AdminLoginPage() {
  const { login } = useAuth();
  const { language } = useLanguage();
  const copy = LOGIN_COPY[language];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (lockoutUntil) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          setLockoutUntil(null);
          setTimeLeft(0);
          setFailedAttempts(0);
          setError("");
          clearInterval(interval);
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil && Date.now() < lockoutUntil) return;

    setError("");
    setIsSubmitting(true);

    const success = await login(email, password);

    if (!success) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      
      if (newAttempts >= 5) {
        const lockoutEnd = Date.now() + 60000;
        setLockoutUntil(lockoutEnd);
        setTimeLeft(60);
        setError(copy.lockout);
      } else {
        setError(copy.invalid(5 - newAttempts));
      }
      
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } else {
      setFailedAttempts(0);
    }

    setIsSubmitting(false);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSubmitting(true);

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setForgotError(data.error?.message || copy.forgotSendError);
      } else {
        setForgotSuccess(true);
      }
    } catch {
      setForgotError(copy.forgotNetworkError);
    } finally {
      setForgotSubmitting(false);
    }
  };

  const openForgot = () => {
    setForgotEmail("");
    setForgotSuccess(false);
    setForgotError("");
    setShowForgot(true);
  };

  return (
    <div className="admin-login-wrapper">
      {/* Animated background */}
      <div className="admin-login-bg">
        <div className="admin-login-gradient-orb admin-login-orb-1" />
        <div className="admin-login-gradient-orb admin-login-orb-2" />
        <div className="admin-login-gradient-orb admin-login-orb-3" />
      </div>

      <div className={`admin-login-card ${shake ? "admin-login-shake" : ""}`}>
        {/* Logo + Header */}
        <div className="admin-login-header">
          <div className="admin-login-logo">
            <div className="admin-login-logo-icon">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <div className="admin-login-logo-ring" />
          </div>
          <h1 className="admin-login-title">Bio-Inspector Admin</h1>
          <p className="admin-login-subtitle">
            {copy.subtitle}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="admin-login-error">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-login-field">
            <label htmlFor="admin-email" className="admin-login-label">
              {copy.emailLabel}
            </label>
            <div className="admin-login-input-wrapper">
              <Mail className="admin-login-input-icon" />
              <input
                id="admin-email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={copy.emailPlaceholder}
                required
                autoComplete="email"
                className="admin-login-input"
                disabled={isSubmitting || !!lockoutUntil}
              />
            </div>
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-password" className="admin-login-label">
              {copy.passwordLabel}
            </label>
            <div className="admin-login-input-wrapper">
              <Lock className="admin-login-input-icon" />
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={copy.passwordPlaceholder}
                required
                autoComplete="current-password"
                className="admin-login-input admin-login-input-password"
                disabled={isSubmitting || !!lockoutUntil}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="admin-login-eye-btn"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email || !password || !!lockoutUntil}
            className="admin-login-submit"
          >
            {lockoutUntil ? (
              <>
                <Lock className="h-4 w-4" />
                {copy.locked} ({timeLeft}s)
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {copy.signingIn}
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                {copy.signIn}
              </>
            )}
          </button>

          <div className="admin-login-forgot-row">
            <button
              type="button"
              onClick={openForgot}
              className="admin-login-forgot-link"
            >
              {copy.forgot}
            </button>
          </div>

        </form>

        {/* Footer hint */}
        <div className="admin-login-footer">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{copy.footer}</span>
        </div>
      </div>

      <style jsx>{`
        .admin-login-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - var(--navbar-height, 64px));
          padding: 2rem;
          overflow: hidden;
        }

        .admin-login-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
        }

        .admin-login-gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.25;
        }

        .admin-login-orb-1 {
          width: 500px;
          height: 500px;
          background: hsl(122 46% 33%);
          top: -150px;
          right: -100px;
          animation: admin-float-1 8s ease-in-out infinite;
        }
        .admin-login-orb-2 {
          width: 400px;
          height: 400px;
          background: hsl(212 79% 42%);
          bottom: -100px;
          left: -100px;
          animation: admin-float-2 10s ease-in-out infinite;
        }
        .admin-login-orb-3 {
          width: 300px;
          height: 300px;
          background: hsl(150 30% 17%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: admin-float-3 12s ease-in-out infinite;
        }

        @keyframes admin-float-1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 30px); }
        }
        @keyframes admin-float-2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -20px); }
        }
        @keyframes admin-float-3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.15); }
        }

        .admin-login-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          padding: 2.5rem;
          background: hsl(var(--card) / 0.85);
          backdrop-filter: blur(24px) saturate(1.5);
          border: 1px solid hsl(var(--border));
          border-radius: 1.25rem;
          box-shadow:
            0 4px 6px -1px rgba(0,0,0,0.05),
            0 20px 50px -12px rgba(0,0,0,0.15);
          animation: admin-card-enter 0.5s ease-out;
        }

        @keyframes admin-card-enter {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .admin-login-shake {
          animation: admin-shake 0.5s ease-in-out;
        }

        @keyframes admin-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }

        .admin-login-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
        }

        .admin-login-logo {
          position: relative;
          margin-bottom: 1.25rem;
        }

        .admin-login-logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 1rem;
          background: linear-gradient(135deg, hsl(122 46% 33%), hsl(122 46% 45%));
          box-shadow: 0 4px 12px hsl(122 46% 33% / 0.35);
        }

        .admin-login-logo-ring {
          position: absolute;
          inset: -6px;
          border-radius: 1.2rem;
          border: 2px solid hsl(122 46% 33% / 0.2);
          animation: admin-ring-pulse 2.5s ease-in-out infinite;
        }

        @keyframes admin-ring-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }

        .admin-login-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: hsl(var(--foreground));
          letter-spacing: -0.02em;
        }

        .admin-login-subtitle {
          margin-top: 0.375rem;
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
        }

        .admin-login-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          margin-bottom: 1.25rem;
          border-radius: 0.75rem;
          background: hsl(0 66% 47% / 0.08);
          border: 1px solid hsl(0 66% 47% / 0.2);
          color: hsl(0 66% 47%);
          font-size: 0.8125rem;
          animation: admin-error-enter 0.3s ease-out;
        }

        @keyframes admin-error-enter {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .admin-login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .admin-login-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .admin-login-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: hsl(var(--foreground));
        }

        .admin-login-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .admin-login-input-icon {
          position: absolute;
          left: 0.875rem;
          width: 1rem;
          height: 1rem;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }

        .admin-login-input {
          width: 100%;
          height: 2.75rem;
          padding: 0 0.875rem 0 2.75rem;
          border-radius: 0.75rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }

        .admin-login-input:focus {
          border-color: hsl(122 46% 33%);
          box-shadow: 0 0 0 3px hsl(122 46% 33% / 0.12);
        }

        .admin-login-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .admin-login-input::placeholder {
          color: hsl(var(--muted-foreground) / 0.6);
        }

        .admin-login-input-password {
          padding-right: 2.75rem;
        }

        .admin-login-eye-btn {
          position: absolute;
          right: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: 0.375rem;
          color: hsl(var(--muted-foreground));
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
        }

        .admin-login-eye-btn:hover {
          color: hsl(var(--foreground));
        }



        .admin-login-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          height: 2.75rem;
          margin-top: 0.5rem;
          border-radius: 0.75rem;
          border: none;
          background: linear-gradient(135deg, hsl(122 46% 33%), hsl(122 46% 40%));
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px hsl(122 46% 33% / 0.3);
        }

        .admin-login-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, hsl(122 46% 30%), hsl(122 46% 37%));
          box-shadow: 0 4px 16px hsl(122 46% 33% / 0.4);
          transform: translateY(-1px);
        }

        .admin-login-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .admin-login-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .admin-login-forgot-row {
          display: flex;
          justify-content: center;
          margin-top: 0.25rem;
        }

        .admin-login-forgot-link {
          background: none;
          border: none;
          font-size: 0.8125rem;
          color: hsl(122 46% 33%);
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0;
        }

        .admin-login-forgot-link:hover {
          color: hsl(122 46% 25%);
          text-decoration: underline;
        }

        .admin-login-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          margin-top: 1.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid hsl(var(--border));
          font-size: 0.75rem;
          color: hsl(var(--muted-foreground));
        }

        .admin-forgot-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          animation: admin-fade-in 0.2s ease-out;
        }

        @keyframes admin-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .admin-forgot-card {
          width: 100%;
          max-width: 420px;
          margin: 1rem;
          padding: 2rem;
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: 1.25rem;
          box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.2);
          animation: admin-modal-enter 0.25s ease-out;
        }

        @keyframes admin-modal-enter {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .admin-forgot-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .admin-forgot-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: hsl(var(--foreground));
          margin-bottom: 0.5rem;
        }

        .admin-forgot-desc {
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
          line-height: 1.5;
        }

        .admin-forgot-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .admin-forgot-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          height: 2.75rem;
          border-radius: 0.75rem;
          border: none;
          background: linear-gradient(135deg, hsl(122 46% 33%), hsl(122 46% 40%));
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px hsl(122 46% 33% / 0.3);
        }

        .admin-forgot-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, hsl(122 46% 30%), hsl(122 46% 37%));
          box-shadow: 0 4px 16px hsl(122 46% 33% / 0.4);
          transform: translateY(-1px);
        }

        .admin-forgot-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .admin-forgot-back {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 2.5rem;
          border-radius: 0.75rem;
          border: 1px solid hsl(var(--border));
          background: transparent;
          color: hsl(var(--muted-foreground));
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .admin-forgot-back:hover {
          background: hsl(var(--muted));
          color: hsl(var(--foreground));
        }

        .admin-forgot-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1rem;
        }

        .admin-forgot-success-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, hsl(122 46% 33%), hsl(122 46% 45%));
          box-shadow: 0 4px 12px hsl(122 46% 33% / 0.35);
        }
      `}</style>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="admin-forgot-overlay">
          <div className="admin-forgot-card">
            {forgotSuccess ? (
              <div className="admin-forgot-success">
                <div className="admin-forgot-success-icon">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <h2 className="admin-forgot-title">{copy.checkEmail}</h2>
                <p className="admin-forgot-desc">
                  {copy.resetSent(forgotEmail)}
                </p>
                <button
                  onClick={() => setShowForgot(false)}
                  className="admin-forgot-submit"
                >
                  {copy.backLogin}
                </button>
              </div>
            ) : (
              <>
                <div className="admin-forgot-header">
                  <h2 className="admin-forgot-title">{copy.forgotTitle}</h2>
                  <p className="admin-forgot-desc">
                    {copy.forgotDesc}
                  </p>
                </div>
                {forgotError && (
                  <div className="admin-login-error">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}
                <form onSubmit={handleForgotSubmit} className="admin-forgot-form">
                  <div className="admin-login-field">
                    <label htmlFor="forgot-email" className="admin-login-label">
                      {copy.emailLabel}
                    </label>
                    <div className="admin-login-input-wrapper">
                      <Mail className="admin-login-input-icon" />
                      <input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder={copy.emailPlaceholder}
                        required
                        autoComplete="email"
                        className="admin-login-input"
                        disabled={forgotSubmitting}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={forgotSubmitting || !forgotEmail}
                    className="admin-forgot-submit"
                  >
                    {forgotSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {copy.sending}
                      </>
                    ) : (
                      <>{copy.sendReset}</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="admin-forgot-back"
                  >
                    {copy.backLogin}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### A.4 `app/admin/reset-password/page.tsx` — Reset Password

Halaman yang dibuka dari link email reset. Membaca `?token=` via `useSearchParams` (dibungkus `<Suspense>`). Alur:

1. **Saat mount**, validasi token: `GET /api/v1/auth/reset-password?token=...` → set `isValidToken`.
2. Jika token invalid/kedaluwarsa → tampilkan layar "Link Tidak Valid".
3. Form password baru memvalidasi panjang minimal 8 karakter dan kecocokan konfirmasi, lalu `POST /api/v1/auth/reset-password` dengan `{ token, password }`.
4. Sukses → layar konfirmasi + tombol "Login Sekarang".

Halaman ini sengaja dikecualikan dari auth gate (lihat A.1) karena pengguna belum login saat mereset password.


```tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { KeyRound, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const RESET_COPY = {
  en: {
    minPassword: "Password must be at least 8 characters",
    mismatch: "Passwords do not match",
    resetFailed: "Failed to reset password",
    genericError: "Something went wrong. Please try again.",
    validating: "Validating link...",
    wait: "Please wait a moment",
    invalidTitle: "Invalid Link",
    invalidDesc: "The password reset link is invalid or has expired. Please request a new one from the login page.",
    backLogin: "Back to Login",
    successTitle: "Password Reset Successfully!",
    successDesc: "Your password has been updated. Please log in with your new password.",
    loginNow: "Login Now",
    title: "Reset Password",
    desc: "Enter a new password for your account.",
    newPassword: "New Password",
    minPlaceholder: "At least 8 characters",
    confirmPassword: "Confirm Password",
    confirmPlaceholder: "Repeat new password",
    processing: "Processing...",
    loading: "Loading...",
  },
  id: {
    minPassword: "Password minimal 8 karakter",
    mismatch: "Password tidak cocok",
    resetFailed: "Gagal mereset password",
    genericError: "Terjadi kesalahan. Coba lagi.",
    validating: "Memvalidasi link...",
    wait: "Mohon tunggu sebentar",
    invalidTitle: "Link Tidak Valid",
    invalidDesc: "Link reset password tidak valid atau sudah kedaluwarsa. Silakan request ulang dari halaman login.",
    backLogin: "Kembali ke Login",
    successTitle: "Password Berhasil Direset!",
    successDesc: "Password Anda telah diperbarui. Silakan login dengan password baru.",
    loginNow: "Login Sekarang",
    title: "Reset Password",
    desc: "Masukkan password baru untuk akun Anda.",
    newPassword: "Password Baru",
    minPlaceholder: "Minimal 8 karakter",
    confirmPassword: "Konfirmasi Password",
    confirmPlaceholder: "Ulangi password baru",
    processing: "Memproses...",
    loading: "Loading...",
  },
} as const;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const { language } = useLanguage();
  const copy = RESET_COPY[language];

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(() => (token ? null : false));

  // Validate token on mount
  useEffect(() => {
    if (!token) return;
    fetch(`/api/v1/auth/reset-password?token=${token}`)
      .then((res) => res.json())
      .then((data) => setIsValidToken(data.valid === true))
      .catch(() => setIsValidToken(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(copy.minPassword);
      return;
    }
    if (password !== confirmPassword) {
      setError(copy.mismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || copy.resetFailed);
      } else {
        setSuccess(true);
      }
    } catch {
      setError(copy.genericError);
    }
    setIsSubmitting(false);
  };

  // Loading state
  if (isValidToken === null) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.iconWrapper}>
            <Loader2 className="animate-spin" style={{ width: 40, height: 40, color: "#1a5632" }} />
          </div>
          <h2 style={styles.title}>{copy.validating}</h2>
          <p style={styles.desc}>{copy.wait}</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (!isValidToken) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ ...styles.iconWrapper, background: "#fef2f2" }}>
            <AlertCircle style={{ width: 40, height: 40, color: "#dc2626" }} />
          </div>
          <h2 style={styles.title}>{copy.invalidTitle}</h2>
          <p style={styles.desc}>
            {copy.invalidDesc}
          </p>
          <button onClick={() => router.push("/admin")} style={styles.btn}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
            {copy.backLogin}
          </button>
        </div>
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ ...styles.iconWrapper, background: "#f0fdf4" }}>
            <CheckCircle2 style={{ width: 40, height: 40, color: "#16a34a" }} />
          </div>
          <h2 style={styles.title}>{copy.successTitle}</h2>
          <p style={styles.desc}>
            {copy.successDesc}
          </p>
          <button onClick={() => router.push("/admin")} style={styles.btn}>
            {copy.loginNow}
          </button>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconWrapper}>
          <KeyRound style={{ width: 40, height: 40, color: "#1a5632" }} />
        </div>
        <h2 style={styles.title}>{copy.title}</h2>
        <p style={styles.desc}>{copy.desc}</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>{copy.newPassword}</label>
            <div style={styles.inputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={copy.minPlaceholder}
                required
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>{copy.confirmPassword}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={copy.confirmPlaceholder}
              required
              style={styles.input}
            />
          </div>

          {error && (
            <div style={styles.error}>
              <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
              {error}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} style={{ ...styles.btn, opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
                {copy.processing}
              </>
            ) : (
              copy.title
            )}
          </button>
        </form>

        <button onClick={() => router.push("/admin")} style={styles.backLink}>
          <ArrowLeft style={{ width: 14, height: 14 }} />
          {copy.backLogin}
        </button>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { language } = useLanguage();
  const copy = RESET_COPY[language];

  return (
    <Suspense fallback={
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.iconWrapper}>
            <Loader2 className="animate-spin" style={{ width: 40, height: 40, color: "#1a5632" }} />
          </div>
          <h2 style={styles.title}>{copy.loading}</h2>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f4f7f6 0%, #e8f0ec 100%)",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    borderRadius: 16,
    padding: "40px 36px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    textAlign: "center" as const,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "#f0faf4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  title: {
    margin: "0 0 8px",
    fontSize: 22,
    fontWeight: 700,
    color: "#1a1a1a",
  },
  desc: {
    margin: "0 0 24px",
    fontSize: 14,
    color: "#666",
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
    textAlign: "left" as const,
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#333",
  },
  inputWrapper: {
    position: "relative" as const,
  },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 8,
    border: "1px solid #ddd",
    padding: "0 16px",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  eyeBtn: {
    position: "absolute" as const,
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#999",
    padding: 4,
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    height: 44,
    borderRadius: 8,
    background: "#1a5632",
    color: "#fff",
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
  },
  error: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 8,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    fontSize: 13,
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    color: "#1a5632",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 20,
  },
};
```

### A.5 `app/admin/page.tsx` — Komponen Admin Utama (4 Tab)

Ini komponen terbesar di seluruh frontend. Satu `AdminPage` merender empat tab berdasarkan `getAdminTabFromPath(pathname)`:

#### Tab **Users** (`/admin` & `/admin/users`)
- Memuat data: `GET /api/v1/roles` dan `GET /api/v1/users?limit=100` (paralel).
- **Tambah user** → `POST /api/v1/users`; setelah dibuat, kredensial bisa disalin (`handleCopyCredentials`).
- **Ubah peran** → `PATCH /api/v1/users/{id}`.
- **Hapus user** → `DELETE /api/v1/users/{id}` (dengan `AlertDialog` konfirmasi).
- Pencarian + filter peran, plus panel profil admin (ubah profil & ganti password via `useAuth().updatePassword`).

#### Tab **Species** (`/admin/species`)
- Memuat: `GET /api/v1/plants?limit=100`.
- **Tambah/Ubah spesies** → `POST /api/v1/plants` atau `PATCH /api/v1/plants/{id}`. Deskripsi diterjemahkan EN↔ID otomatis via `translateSpeciesDescriptions` sebelum dikirim (lihat Bagian B.5).
- **Upload sketsa herbarium** → `POST /api/v1/plants/upload-sketch` (multipart).
- **Hapus** → `DELETE /api/v1/plants/{id}`.

#### Tab **Logs** (`/admin/logs`)
- Menampilkan `systemLogs` (saat ini dari `MOCK_LOGS`) dengan filter level (info/warning/error) bilingual.

#### Tab **Annotation** (`/admin/annotation`)
- Merender komponen `AdminDataAnnotationPanel` (lihat A.6) dan menerima callback `onLog` untuk mencatat aktivitas ke log.

Semua teks lewat objek `ADMIN_COPY` (EN/ID). Tipe `ApiUser`/`ApiPlant` mendefinisikan bentuk respons mentah (camelCase + snake_case) yang dinormalkan ke `DisplayUser`/`DisplaySpecies`.


```tsx
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
import { type TranslateLanguage } from "@/lib/translation/client";
import { translateSpeciesDescriptions } from "@/lib/translation/species";

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
  orderRank?: string;
  order_rank?: string;
  taxSpecies?: string;
  tax_species?: string;
  source?: string;
  imageSource?: string;
  image_source?: string;
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
            lastLogin: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString(language === "id" ? "id-ID" : "en-US", {
              dateStyle: 'medium',
              timeStyle: 'short'
            }) : "-",
          };
        }));
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
          taxClass: p.taxClass || p.tax_class || "",
          orderRank: p.orderRank || p.order_rank || "",
          taxSpecies: p.taxSpecies || p.tax_species || "",
          source: p.source || "",
          imageSource: p.imageSource || p.image_source || "",
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
        alert(json.error || "Upload failed");
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
    const sourceLanguage = language as TranslateLanguage;
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
      const translatedFields = await translateSpeciesDescriptions({
        botanicalDescription,
        ecologicalInformation,
        environmentalImpact,
        sourceLanguage,
      });

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
            botanicalDescription,
            botanicalDescriptionEn: translatedFields.botanicalDescriptionEn,
            botanicalDescriptionId: translatedFields.botanicalDescriptionId,
            ecologicalInformation,
            ecologicalInformationEn: translatedFields.ecologicalInformationEn,
            ecologicalInformationId: translatedFields.ecologicalInformationId,
            environmentalImpact,
            environmentalImpactEn: translatedFields.environmentalImpactEn,
            environmentalImpactId: translatedFields.environmentalImpactId,
            imagePath: speciesForm.imagePath.trim(),
            kingdom: speciesForm.kingdom.trim(),
            phylum: speciesForm.phylum.trim(),
            taxClass: speciesForm.taxClass.trim(),
            orderRank: speciesForm.order.trim(),
            taxSpecies: speciesForm.taxSpecies.trim(),
            source: sourceText,
            imageSource: imageSourceText,
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
            botanicalDescription,
            botanicalDescriptionEn: translatedFields.botanicalDescriptionEn,
            botanicalDescriptionId: translatedFields.botanicalDescriptionId,
            ecologicalInformation,
            ecologicalInformationEn: translatedFields.ecologicalInformationEn,
            ecologicalInformationId: translatedFields.ecologicalInformationId,
            environmentalImpact,
            environmentalImpactEn: translatedFields.environmentalImpactEn,
            environmentalImpactId: translatedFields.environmentalImpactId,
            imagePath: speciesForm.imagePath.trim(),
            kingdom: speciesForm.kingdom.trim(),
            phylum: speciesForm.phylum.trim(),
            taxClass: speciesForm.taxClass.trim(),
            orderRank: speciesForm.order.trim(),
            taxSpecies: speciesForm.taxSpecies.trim(),
            source: sourceText,
            imageSource: imageSourceText,
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
      logout();
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
```

### A.6 `components/AdminDataAnnotationPanel.tsx` — Anotasi Data + Deteksi AI

Tool anotasi citra untuk menyiapkan dataset pelatihan. Fitur utama:

- **Unggah banyak gambar** (drag & drop / file picker) menjadi daftar `AnnotationItem` berstatus `pending → annotated → validated`.
- **Deteksi AI otomatis:** `detectPlant()` mengambil blob gambar (`fetch(item.src)`), mengirimnya ke `POST /api/v1/plants/detect`, lalu menempatkan bounding box + label spesies dari hasil model (kelas dibatasi `SPECIES_CLASSES`).
- **Editor bounding box manual:** mode `draw`/`select` di atas `<canvas>`, dengan pemilihan kelas spesies per kotak.
- **Ekspor dataset** (mis. format berbasis ZIP via `jszip`) untuk pipeline pelatihan AI.
- Mencatat aktivitas balik ke log admin melalui prop `onLog`.


```tsx
"use client";

import { ChangeEvent, MouseEvent, useCallback, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Loader2,
  PencilRuler,
  Plus,
  ScanSearch,
  SquareDashedMousePointer,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const SPECIES_CLASSES = [
  "Vachellia nilotica (L.) P.J.H.Hurter & Mabb.",
  "Ageratum conyzoides L.",
  "Clitoria ternatea L.",
  "Lantana camara L.",
  "Merremia hederacea (Burm.f.) Hallier f.",
  "Unknown",
];

const getBinomialName = (name: string) =>
  name.trim().toLowerCase().split(/\s+/).slice(0, 2).join(" ");

const findSpeciesClass = (name: string) => {
  const normalizedName = name.trim().toLowerCase();
  const binomialName = getBinomialName(name);

  return SPECIES_CLASSES.find((cls) => {
    const normalizedClass = cls.toLowerCase();
    return normalizedClass === normalizedName || getBinomialName(cls) === binomialName;
  });
};

type ItemStatus = "pending" | "annotated" | "validated";
type EditorMode = "draw" | "select";

interface BoundingBox {
  id: number;
  className: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectionResult {
  name: string;
  confidence: number;
  box?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
  } | null;
}

interface AnnotationItem {
  id: number;
  filename: string;
  src: string;
  file?: File;
  imageWidth: number;
  imageHeight: number;
  boxes: BoundingBox[];
  status: ItemStatus;
  validatedBy?: string;
  validatedAt?: string;
  aiDetected?: boolean;
  aiSpecies?: string;
  aiConfidence?: number;
}

interface AnnotationBatch {
  id: number;
  name: string;
  period: string;
  items: AnnotationItem[];
}

interface DraftBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface Props {
  adminName: string;
  onLog?: (level: "info" | "warning" | "error" | "success", source: string, message: string) => void;
}

interface SuccessNotice {
  title: string;
  message: string;
  buttonLabel: string;
}

const statusStyles: Record<ItemStatus, string> = {
  pending: "bg-gray-100 text-gray-700",
  annotated: "bg-blue-100 text-blue-700",
  validated: "bg-green-100 text-green-700",
};

const ANNOTATION_COPY = {
  en: {
    stats: {
      totalBatch: "Total Batch",
      pending: "Pending Annotation",
      validated: "Validated Ready",
    },
    quickTitle: "Quick Guide",
    quickDesc: "Follow the sequence below so annotations stay easy to read and review.",
    steps: [
      "1. Choose the batch and image you want to work on.",
      "2. Draw a box around a clearly visible object.",
      "3. Click Save Annotation to save changes.",
      "4. Click Validate when the data is correct.",
    ],
    batchTitle: "Dataset Batch",
    batchDesc: "Choose a batch, then continue annotation.",
    exporting: "Exporting...",
    exportYolo: "Export YOLO",
    imageCount: "image",
    validatedCount: "validated",
    uploadImages: "Upload Images to Batch",
    images: "Images",
    box: "box",
    emptyBatch: "There are no images in this batch yet.",
    editorTitle: "Interactive Bounding Box Editor",
    editorDesc: "1) Choose a mode. 2) Draw a box. 3) Save. 4) Validate.",
    draw: "Draw",
    selectEdit: "Select/Edit",
    saveAnnotation: "Save Annotation",
    validate: "Validate",
    emptyEditorTitle: "Choose an image on the left to start annotation.",
    emptyEditorDesc: "After selecting an image, draw a box around the object and press Save Annotation.",
    aiDetecting: "AI is detecting plants...",
    contactingAi: "Contacting AI detection service",
    confidence: "confidence",
    deleteAiPrediction: "Delete AI prediction",
    boxProperties: "Box Properties",
    boxHelp: "Select a bounding box to edit coordinates, class, or delete the box.",
    class: "Class",
    itemStatus: "Item status",
    validatedBy: "validated by",
    deleteBox: "Delete Box",
    status: { pending: "pending", annotated: "annotated", validated: "validated" },
    detectionFailed: "AI detection failed. Please try again.",
    noValidated: "No validated items with bounding boxes yet.",
    exportFailed: "Failed to export ZIP. Please try again.",
    savedTitle: "Annotation Saved Successfully",
    savedMessage: (filename: string) => `Changes for ${filename} have been saved. You can continue drawing boxes or choose another image.`,
    savedButton: "Continue Annotation",
    validatedTitle: "Annotation Validated Successfully",
    validatedMessage: (filename: string) => `Data for ${filename} has been validated and is ready to export.`,
    done: "Done",
    logs: {
      aiSource: "AI Detection",
      annotationSource: "Annotation",
      verificationSource: "Verification",
      detected: (name: string, confidence: number, filename: string) => `Detected ${name} (${confidence}%) in ${filename}`,
      noPlant: (filename: string) => `No plant detected in ${filename}`,
      failed: (filename: string) => `Detection failed for ${filename}`,
      cleared: "Cleared AI prediction for item",
      saved: (filename: string) => `Saved annotation for image ${filename}`,
      validated: (filename: string) => `Validated annotation for image ${filename}`,
    },
  },
  id: {
    stats: {
      totalBatch: "Total Batch",
      pending: "Pending Anotasi",
      validated: "Siap Divalidasi",
    },
    quickTitle: "Panduan Cepat",
    quickDesc: "Ikuti urutan di bawah agar anotasi lebih mudah dibaca dan tidak membingungkan.",
    steps: [
      "1. Pilih batch dan image yang ingin dikerjakan.",
      "2. Gambar kotak pada objek yang terlihat jelas.",
      "3. Klik Save Annotation untuk menyimpan perubahan.",
      "4. Klik Validate jika data sudah benar.",
    ],
    batchTitle: "Batch Dataset",
    batchDesc: "Pilih batch lalu lanjutkan anotasi.",
    exporting: "Mengekspor...",
    exportYolo: "Export YOLO",
    imageCount: "image",
    validatedCount: "validated",
    uploadImages: "Unggah Image ke Batch",
    images: "Images",
    box: "box",
    emptyBatch: "Belum ada image di batch ini.",
    editorTitle: "Interactive Bounding Box Editor",
    editorDesc: "1) Pilih mode. 2) Gambar box. 3) Simpan. 4) Validasi.",
    draw: "Gambar",
    selectEdit: "Pilih/Edit",
    saveAnnotation: "Simpan Anotasi",
    validate: "Validasi",
    emptyEditorTitle: "Pilih image di sisi kiri untuk mulai anotasi.",
    emptyEditorDesc: "Setelah image dipilih, gambar kotak pada objek lalu tekan Simpan Anotasi.",
    aiDetecting: "AI sedang mendeteksi tanaman...",
    contactingAi: "Menghubungi layanan deteksi AI",
    confidence: "keyakinan",
    deleteAiPrediction: "Hapus prediksi AI",
    boxProperties: "Properti Box",
    boxHelp: "Pilih bounding box untuk mengedit koordinat, class, atau hapus box.",
    class: "Class",
    itemStatus: "Status item",
    validatedBy: "divalidasi oleh",
    deleteBox: "Hapus Box",
    status: { pending: "pending", annotated: "annotated", validated: "validated" },
    detectionFailed: "AI detection gagal. Silakan coba lagi.",
    noValidated: "Belum ada item validated dengan bounding box.",
    exportFailed: "Gagal export ZIP. Coba ulangi lagi.",
    savedTitle: "Annotation Berhasil Disimpan",
    savedMessage: (filename: string) => `Perubahan untuk ${filename} sudah disimpan. Anda bisa lanjut menggambar box atau pilih image lain.`,
    savedButton: "Lanjut Anotasi",
    validatedTitle: "Annotation Berhasil Divalidasi",
    validatedMessage: (filename: string) => `Data untuk ${filename} sudah divalidasi dan siap diexport.`,
    done: "Selesai",
    logs: {
      aiSource: "AI Detection",
      annotationSource: "Annotation",
      verificationSource: "Verification",
      detected: (name: string, confidence: number, filename: string) => `Terdeteksi ${name} (${confidence}%) pada ${filename}`,
      noPlant: (filename: string) => `Tidak ada tanaman terdeteksi pada ${filename}`,
      failed: (filename: string) => `Deteksi gagal untuk ${filename}`,
      cleared: "Prediksi AI dihapus dari item",
      saved: (filename: string) => `Anotasi disimpan untuk image ${filename}`,
      validated: (filename: string) => `Anotasi divalidasi untuk image ${filename}`,
    },
  },
} as const;

const toDateLabel = () => new Date().toISOString().split("T")[0];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const getBaseName = (filename: string) => {
  const dot = filename.lastIndexOf(".");
  return dot > 0 ? filename.slice(0, dot) : filename;
};

const buildYoloLine = (box: BoundingBox, width: number, height: number) => {
  const classId = SPECIES_CLASSES.indexOf(box.className);
  const centerX = (box.x + box.width / 2) / width;
  const centerY = (box.y + box.height / 2) / height;
  const normalizedWidth = box.width / width;
  const normalizedHeight = box.height / height;

  const safeClassId = classId >= 0 ? classId : SPECIES_CLASSES.length - 1;

  return [
    safeClassId,
    centerX.toFixed(6),
    centerY.toFixed(6),
    normalizedWidth.toFixed(6),
    normalizedHeight.toFixed(6),
  ].join(" ");
};

const normalizeDetectedBox = (
  box: DetectionResult["box"],
  imageWidth: number,
  imageHeight: number,
) => {
  if (!box) return null;

  const x1 = Number.isFinite(box.x1) ? box.x1 : 0;
  const y1 = Number.isFinite(box.y1) ? box.y1 : 0;
  const x2 = Number.isFinite(box.x2) ? box.x2 : x1 + box.width;
  const y2 = Number.isFinite(box.y2) ? box.y2 : y1 + box.height;
  const left = clamp(Math.min(x1, x2), 0, Math.max(imageWidth - 1, 0));
  const top = clamp(Math.min(y1, y2), 0, Math.max(imageHeight - 1, 0));
  const right = clamp(Math.max(x1, x2), left + 1, imageWidth);
  const bottom = clamp(Math.max(y1, y2), top + 1, imageHeight);

  if (right <= left || bottom <= top) return null;

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
};

const constrainBoxToImage = (
  box: BoundingBox,
  imageWidth: number,
  imageHeight: number,
): BoundingBox => {
  const x = clamp(box.x, 0, Math.max(imageWidth - 1, 0));
  const y = clamp(box.y, 0, Math.max(imageHeight - 1, 0));

  return {
    ...box,
    x,
    y,
    width: clamp(box.width, 1, Math.max(imageWidth - x, 1)),
    height: clamp(box.height, 1, Math.max(imageHeight - y, 1)),
  };
};

const readImageSize = (url: string) =>
  new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
    img.onerror = () => resolve({ width: 1280, height: 720 });
    img.src = url;
  });

export function AdminDataAnnotationPanel({ adminName, onLog }: Props) {
  const { language } = useLanguage();
  const copy = ANNOTATION_COPY[language];
  const [batches, setBatches] = useState<AnnotationBatch[]>([
    {
      id: 1,
      name: "Batch Q2 2026",
      period: "Apr-Jun 2026",
      items: [],
    },
    {
      id: 2,
      name: "Batch Q1 2026",
      period: "Jan-Mar 2026",
      items: [],
    },
  ]);
  const [activeBatchId, setActiveBatchId] = useState<number>(1);
  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>(SPECIES_CLASSES[0]);
  const [mode, setMode] = useState<EditorMode>("draw");
  const [draftBox, setDraftBox] = useState<DraftBox | null>(null);
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<SuccessNotice | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeBatch = useMemo(
    () => batches.find((batch) => batch.id === activeBatchId) ?? batches[0],
    [batches, activeBatchId],
  );

  const activeItem = useMemo(() => {
    if (!activeBatch || activeItemId === null) return null;
    return activeBatch.items.find((item) => item.id === activeItemId) ?? null;
  }, [activeBatch, activeItemId]);

  const selectedBox = useMemo(() => {
    if (!activeItem || selectedBoxId === null) return null;
    return activeItem.boxes.find((box) => box.id === selectedBoxId) ?? null;
  }, [activeItem, selectedBoxId]);

  const totalPending = useMemo(
    () => batches.reduce((sum, batch) => sum + batch.items.filter((item) => item.status === "pending").length, 0),
    [batches],
  );
  const totalValidated = useMemo(
    () => batches.reduce((sum, batch) => sum + batch.items.filter((item) => item.status === "validated").length, 0),
    [batches],
  );

  const getScale = () => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || !activeItem) {
      return {
        scaleX: 1,
        scaleY: 1,
        imageFrame: { left: 0, top: 0, width: 1, height: 1 },
      };
    }

    const stageRatio = rect.width / rect.height;
    const imageRatio = activeItem.imageWidth / activeItem.imageHeight;
    const imageFrame = stageRatio > imageRatio
      ? {
        width: rect.height * imageRatio,
        height: rect.height,
        left: (rect.width - rect.height * imageRatio) / 2,
        top: 0,
      }
      : {
        width: rect.width,
        height: rect.width / imageRatio,
        left: 0,
        top: (rect.height - rect.width / imageRatio) / 2,
      };

    return {
      scaleX: imageFrame.width / activeItem.imageWidth,
      scaleY: imageFrame.height / activeItem.imageHeight,
      imageFrame,
    };
  };

  const toStagePoint = (event: MouseEvent<HTMLDivElement>, clampToImage = true) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const { imageFrame } = getScale();
    const stageX = event.clientX - rect.left;
    const stageY = event.clientY - rect.top;
    const isOutsideImage =
      stageX < imageFrame.left ||
      stageX > imageFrame.left + imageFrame.width ||
      stageY < imageFrame.top ||
      stageY > imageFrame.top + imageFrame.height;

    if (isOutsideImage && !clampToImage) return null;

    return {
      x: clamp(stageX - imageFrame.left, 0, imageFrame.width),
      y: clamp(stageY - imageFrame.top, 0, imageFrame.height),
    };
  };

  const setItemValue = useCallback((
    itemId: number,
    updater: (item: AnnotationItem) => AnnotationItem,
  ) => {
    setBatches((prev) =>
      prev.map((batch) => {
        if (batch.id !== activeBatchId) return batch;
        return {
          ...batch,
          items: batch.items.map((item) => (item.id === itemId ? updater(item) : item)),
        };
      }),
    );
  }, [activeBatchId]);

  // AI Detection function — sends image to /api/v1/plants/detect
  const detectPlant = useCallback(async (item: AnnotationItem) => {
    // Skip if already detected
    if (item.aiDetected) return;

    setIsDetecting(true);
    setDetectionError(null);

    try {
      let blob: Blob;

      if (item.file) {
        blob = item.file;
      } else {
        const response = await fetch(item.src);
        blob = await response.blob();
      }

      const formData = new FormData();
      formData.append("image", blob, item.filename);

      const res = await fetch("/api/v1/plants/detect", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (json.success && json.data?.plants?.length > 0) {
        const detections: DetectionResult[] = json.data.plants;
        const topDetection = detections[0];

        // Create bounding boxes only for detections with a valid box
        const newBoxes: BoundingBox[] = detections
          .map((det, idx) => {
            const normalizedBox = normalizeDetectedBox(det.box, item.imageWidth, item.imageHeight);
            if (!normalizedBox) return null;

            // Map detected name to one of the known SPECIES_CLASSES
            const matchedClass = findSpeciesClass(det.name) || det.name;

            return {
              id: Date.now() + idx,
              className: matchedClass,
              ...normalizedBox,
            };
          })
          .filter((box): box is BoundingBox => box !== null);

        const matchedTopClass = findSpeciesClass(topDetection.name);

        // Update the item with AI detection results
        setItemValue(item.id, (prev) => ({
          ...prev,
          boxes: newBoxes.length > 0 ? newBoxes : prev.boxes,
          aiDetected: true,
          aiSpecies: matchedTopClass || topDetection.name,
          aiConfidence: topDetection.confidence,
          status: newBoxes.length > 0 ? "annotated" : prev.status,
        }));

        // Auto-select detected species in class dropdown
        if (matchedTopClass) {
          setSelectedClass(matchedTopClass);
        }

        if (newBoxes.length > 0) {
          setSelectedBoxId(newBoxes[0].id);
        }

        onLog?.("info", copy.logs.aiSource, copy.logs.detected(topDetection.name, Math.round(topDetection.confidence * 100), item.filename));
      } else {
        // No detection — mark as detected but with no results
        setItemValue(item.id, (prev) => ({
          ...prev,
          aiDetected: true,
          aiSpecies: undefined,
          aiConfidence: undefined,
        }));
        onLog?.("warning", copy.logs.aiSource, copy.logs.noPlant(item.filename));
      }
    } catch (err) {
      console.error("AI detection failed:", err);
      setDetectionError(copy.detectionFailed);
      onLog?.("error", copy.logs.aiSource, copy.logs.failed(item.filename));
    } finally {
      setIsDetecting(false);
    }
  }, [copy, onLog, setItemValue]);

  // Clear AI prediction — removes all AI-generated boxes and resets detection state
  const clearAiPrediction = (itemId: number) => {
    setItemValue(itemId, (item) => ({
      ...item,
      boxes: [],
      aiDetected: false,
      aiSpecies: undefined,
      aiConfidence: undefined,
      status: "pending",
    }));
    setSelectedBoxId(null);
    setDetectionError(null);
    onLog?.("info", copy.logs.annotationSource, copy.logs.cleared);
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const newItems: AnnotationItem[] = await Promise.all(
      files.map(async (file) => {
        const src = URL.createObjectURL(file);
        const size = await readImageSize(src);

        return {
          id: Date.now() + Math.floor(Math.random() * 10000),
          filename: file.name,
          src,
          file,
          imageWidth: size.width,
          imageHeight: size.height,
          boxes: [],
          status: "pending" as ItemStatus,
          aiDetected: false,
        };
      }),
    );

    setBatches((prev) =>
      prev.map((batch) => {
        if (batch.id !== activeBatchId) return batch;
        return { ...batch, items: [...batch.items, ...newItems] };
      }),
    );

    if (newItems.length > 0) {
      setActiveItemId(newItems[0].id);
      setSelectedBoxId(null);
      // Auto-detect the first uploaded image
      detectPlant(newItems[0]);
    }

    event.target.value = "";
  };

  const startDraw = (event: MouseEvent<HTMLDivElement>) => {
    if (!activeItem || mode !== "draw") return;
    const point = toStagePoint(event, false);
    if (!point) return;

    setSelectedBoxId(null);
    setDraftBox({
      startX: point.x,
      startY: point.y,
      currentX: point.x,
      currentY: point.y,
    });
  };

  const moveDraw = (event: MouseEvent<HTMLDivElement>) => {
    if (!draftBox) return;
    const point = toStagePoint(event);
    if (!point) return;

    setDraftBox((prev) => (prev ? { ...prev, currentX: point.x, currentY: point.y } : prev));
  };

  const finishDraw = () => {
    if (!activeItem || !draftBox) return;

    const { scaleX, scaleY } = getScale();
    const left = Math.min(draftBox.startX, draftBox.currentX);
    const top = Math.min(draftBox.startY, draftBox.currentY);
    const width = Math.abs(draftBox.currentX - draftBox.startX);
    const height = Math.abs(draftBox.currentY - draftBox.startY);

    if (width < 8 || height < 8) {
      setDraftBox(null);
      return;
    }

    const box: BoundingBox = {
      id: Date.now(),
      className: selectedClass,
      x: left / scaleX,
      y: top / scaleY,
      width: width / scaleX,
      height: height / scaleY,
    };

    setItemValue(activeItem.id, (item) => {
      const nextBoxes = [...item.boxes, box];
      return {
        ...item,
        boxes: nextBoxes,
        status: nextBoxes.length > 0 ? "annotated" : "pending",
      };
    });

    setSelectedBoxId(box.id);
    setDraftBox(null);
  };

  const updateSelectedBoxValue = (field: keyof BoundingBox, value: number | string) => {
    if (!activeItem || selectedBoxId === null) return;

    setItemValue(activeItem.id, (item) => {
      const updated = item.boxes.map((box) => {
        if (box.id !== selectedBoxId) return box;
        if (field === "className") {
          return { ...box, className: value as string };
        }

        const numeric = Number(value);
        if (Number.isNaN(numeric)) return box;

        if (field === "x") {
          return { ...box, x: clamp(numeric, 0, item.imageWidth - box.width) };
        }
        if (field === "y") {
          return { ...box, y: clamp(numeric, 0, item.imageHeight - box.height) };
        }
        if (field === "width") {
          return { ...box, width: clamp(numeric, 1, item.imageWidth - box.x) };
        }
        if (field === "height") {
          return { ...box, height: clamp(numeric, 1, item.imageHeight - box.y) };
        }

        return box;
      });

      return { ...item, boxes: updated };
    });
  };

  const deleteSelectedBox = () => {
    if (!activeItem || selectedBoxId === null) return;

    setItemValue(activeItem.id, (item) => {
      const nextBoxes = item.boxes.filter((box) => box.id !== selectedBoxId);
      return {
        ...item,
        boxes: nextBoxes,
        status: nextBoxes.length === 0 ? "pending" : item.status === "validated" ? "annotated" : item.status,
      };
    });

    setSelectedBoxId(null);
  };

  const saveAnnotation = () => {
    if (!activeItem) return;

    setItemValue(activeItem.id, (item) => ({
      ...item,
      status: item.boxes.length > 0 ? "annotated" : "pending",
      validatedBy: undefined,
      validatedAt: undefined,
    }));

    onLog?.("success", copy.logs.annotationSource, copy.logs.saved(activeItem.filename));
    setSuccessNotice({
      title: copy.savedTitle,
      message: copy.savedMessage(activeItem.filename),
      buttonLabel: copy.savedButton,
    });
  };

  const validateAnnotation = () => {
    if (!activeItem || activeItem.boxes.length === 0) return;

    setItemValue(activeItem.id, (item) => ({
      ...item,
      status: "validated",
      validatedBy: adminName,
      validatedAt: toDateLabel(),
    }));

    onLog?.("success", copy.logs.verificationSource, copy.logs.validated(activeItem.filename));
    setSuccessNotice({
      title: copy.validatedTitle,
      message: copy.validatedMessage(activeItem.filename),
      buttonLabel: copy.done,
    });
  };

  const exportBatchYoloZip = async () => {
    if (!activeBatch) return;

    const exportItems = activeBatch.items.filter((item) => item.status === "validated" && item.boxes.length > 0);
    if (!exportItems.length) {
      window.alert(copy.noValidated);
      return;
    }

    try {
      setIsExporting(true);
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const imageFolder = zip.folder("images");
      const labelFolder = zip.folder("labels");

      for (const item of exportItems) {
        const labelText = item.boxes
          .map((box) => buildYoloLine(box, item.imageWidth, item.imageHeight))
          .join("\n");

        labelFolder?.file(`${getBaseName(item.filename)}.txt`, labelText);

        if (item.file) {
          imageFolder?.file(item.filename, item.file);
          continue;
        }

        const response = await fetch(item.src);
        const blob = await response.blob();
        imageFolder?.file(item.filename, blob);
      }

      const yamlLines = [
        "path: ./",
        "train: images",
        "val: images",
        `nc: ${SPECIES_CLASSES.length}`,
        "names:",
        ...SPECIES_CLASSES.map((name, index) => `  ${index}: ${name}`),
      ];
      zip.file("data.yaml", yamlLines.join("\n"));

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${activeBatch.name.replace(/\s+/g, "_").toLowerCase()}_yolo.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      window.alert(copy.exportFailed);
    } finally {
      setIsExporting(false);
    }
  };

  const draftStyle = useMemo(() => {
    if (!draftBox) return null;

    const left = Math.min(draftBox.startX, draftBox.currentX);
    const top = Math.min(draftBox.startY, draftBox.currentY);
    const width = Math.abs(draftBox.currentX - draftBox.startX);
    const height = Math.abs(draftBox.currentY - draftBox.startY);

    return { left, top, width, height };
  }, [draftBox]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {successNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-inner">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">{successNotice.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{successNotice.message}</p>
            <button
              type="button"
              onClick={() => setSuccessNotice(null)}
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
            >
              {successNotice.buttonLabel}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">{copy.stats.totalBatch}</p>
          <p className="text-2xl font-bold mt-1">{batches.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">{copy.stats.pending}</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{totalPending}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">{copy.stats.validated}</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{totalValidated}</p>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-base font-semibold text-blue-950">{copy.quickTitle}</p>
            <p className="mt-1 text-sm text-blue-800">
              {copy.quickDesc}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          {copy.steps.map((step) => (
            <div key={step} className="rounded-lg border bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm">
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">{copy.batchTitle}</h3>
                <p className="text-xs text-muted-foreground">{copy.batchDesc}</p>
              </div>
              <button
                onClick={exportBatchYoloZip}
                disabled={isExporting || !activeBatch}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {isExporting ? copy.exporting : copy.exportYolo}
              </button>
            </div>
          </div>

          <div className="border-b p-4 space-y-3">
            {batches.map((batch) => {
              const countValidated = batch.items.filter((item) => item.status === "validated").length;
              const isActive = batch.id === activeBatchId;
              return (
                <button
                  key={batch.id}
                  onClick={() => {
                    setActiveBatchId(batch.id);
                    setActiveItemId(batch.items[0]?.id ?? null);
                    setSelectedBoxId(null);
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${isActive ? "border-primary bg-primary/5" : "hover:bg-muted"
                    }`}
                >
                  <p className="text-sm font-semibold">{batch.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{batch.period}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{batch.items.length} {copy.imageCount} • {countValidated} {copy.validatedCount}</p>
                </button>
              );
            })}
          </div>

          <div className="p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Upload className="h-4 w-4" />
              {copy.uploadImages}
            </button>
          </div>

          <div className="border-t px-4 py-4 max-h-80 overflow-y-auto">
            <p className="mb-3 text-sm font-semibold text-muted-foreground">{copy.images}</p>
            <div className="space-y-3">
              {activeBatch?.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveItemId(item.id);
                    setSelectedBoxId(null);
                    setDraftBox(null);
                    // Auto-detect when selecting an image that hasn't been detected
                    if (!item.aiDetected) {
                      detectPlant(item);
                    }
                  }}
                  className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition-colors ${activeItemId === item.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                    }`}
                >
                  <p className="font-semibold truncate">{item.filename}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[item.status]}`}>
                      {copy.status[item.status]}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.boxes.length} {copy.box}</span>
                  </div>
                  {item.aiDetected && item.aiSpecies && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                      <ScanSearch className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium text-primary truncate">{item.aiSpecies}</span>
                      <span className="text-muted-foreground">{Math.round((item.aiConfidence ?? 0) * 100)}%</span>
                    </div>
                  )}
                </button>
              ))}
              {!activeBatch?.items.length && (
                <p className="text-sm text-muted-foreground">{copy.emptyBatch}</p>
              )}
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex flex-col gap-4 border-b px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-base font-semibold">{copy.editorTitle}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {copy.editorDesc}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setMode("draw")}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium ${mode === "draw" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                >
                  <SquareDashedMousePointer className="h-4 w-4" />
                  {copy.draw}
                </button>
                <button
                  onClick={() => setMode("select")}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium ${mode === "select" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                >
                  <PencilRuler className="h-4 w-4" />
                  {copy.selectEdit}
                </button>
                <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={selectedClass}
                    onChange={(event) => setSelectedClass(event.target.value)}
                    className="h-9 rounded-lg border bg-background px-3 text-sm"
                  >
                    {SPECIES_CLASSES.map((label) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={saveAnnotation}
                  disabled={!activeItem}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {copy.saveAnnotation}
                </button>
                <button
                  onClick={validateAnnotation}
                  disabled={!activeItem || activeItem.boxes.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {copy.validate}
                </button>
              </div>
            </div>

            <div className="p-5">
              {!activeItem && (
                <div className="flex h-[520px] items-center justify-center rounded-xl border border-dashed bg-muted/20">
                  <div className="max-w-md text-center text-muted-foreground">
                    <ImageIcon className="mx-auto mb-3 h-12 w-12" />
                    <p className="text-base font-medium text-foreground">{copy.emptyEditorTitle}</p>
                    <p className="mt-2 text-sm leading-relaxed">
                      {copy.emptyEditorDesc}
                    </p>
                  </div>
                </div>
              )}

              {activeItem && (
                <div
                  ref={stageRef}
                  className="relative h-[520px] w-full overflow-hidden rounded-xl border bg-black/5 select-none"
                  onMouseDown={startDraw}
                  onMouseMove={moveDraw}
                  onMouseUp={finishDraw}
                  onMouseLeave={finishDraw}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeItem.src}
                    alt={activeItem.filename}
                    className="h-full w-full object-contain"
                    draggable={false}
                  />

                  {/* AI Detection overlay */}
                  {isDetecting && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-20">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                      <span className="text-sm font-medium animate-pulse">{copy.aiDetecting}</span>
                      <span className="text-xs text-muted-foreground mt-1">{copy.contactingAi}</span>
                    </div>
                  )}

                  {/* AI Detection result badge */}
                  {activeItem.aiDetected && activeItem.aiSpecies && !isDetecting && (
                    <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-xl border bg-background/90 px-3 py-2 shadow-lg backdrop-blur-md">
                      <ScanSearch className="h-4 w-4 text-primary" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{activeItem.aiSpecies}</span>
                        <span className="text-xs text-muted-foreground">{Math.round((activeItem.aiConfidence ?? 0) * 100)}% {copy.confidence}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearAiPrediction(activeItem.id);
                        }}
                        className="ml-1 rounded-full p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title={copy.deleteAiPrediction}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Detection error */}
                  {detectionError && !isDetecting && (
                    <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-destructive">{detectionError}</span>
                    </div>
                  )}

                  {activeItem.boxes.map((box) => {
                    const { scaleX, scaleY, imageFrame } = getScale();
                    const safeBox = constrainBoxToImage(box, activeItem.imageWidth, activeItem.imageHeight);
                    const isSelected = selectedBoxId === box.id;

                    return (
                      <button
                        key={box.id}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedBoxId(box.id);
                          setMode("select");
                          setSelectedClass(box.className);
                        }}
                        className={`absolute border-2 text-left ${isSelected ? "border-yellow-400" : "border-lime-400"
                          } bg-lime-400/15`}
                        style={{
                          left: imageFrame.left + safeBox.x * scaleX,
                          top: imageFrame.top + safeBox.y * scaleY,
                          width: safeBox.width * scaleX,
                          height: safeBox.height * scaleY,
                        }}
                      >
                        <span
                          className="absolute left-0 rounded bg-black/75 px-1.5 py-0.5 text-[10px] text-white"
                          style={{ top: safeBox.y * scaleY < 22 ? 2 : -20 }}
                        >
                          {box.className}
                        </span>
                      </button>
                    );
                  })}

                  {draftStyle && (
                    (() => {
                      const { imageFrame } = getScale();

                      return (
                        <div
                          className="absolute border-2 border-cyan-400 bg-cyan-300/20"
                          style={{
                            left: imageFrame.left + draftStyle.left,
                            top: imageFrame.top + draftStyle.top,
                            width: draftStyle.width,
                            height: draftStyle.height,
                          }}
                        />
                      );
                    })()
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-card shadow-sm p-4">
            <h4 className="text-base font-semibold">{copy.boxProperties}</h4>
            {!selectedBox && (
              <p className="mt-2 text-sm text-muted-foreground">
                {copy.boxHelp}
              </p>
            )}

            {selectedBox && activeItem && (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{copy.class}</label>
                  <select
                    value={selectedBox.className}
                    onChange={(event) => updateSelectedBoxValue("className", event.target.value)}
                    className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-base"
                  >
                    {SPECIES_CLASSES.map((label) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                {([
                  ["x", selectedBox.x],
                  ["y", selectedBox.y],
                  ["width", selectedBox.width],
                  ["height", selectedBox.height],
                ] as const).map(([field, value]) => (
                  <div key={field}>
                    <label className="text-sm font-medium text-muted-foreground capitalize">{field}</label>
                    <input
                      type="number"
                      min={0}
                      value={Math.round(value)}
                      onChange={(event) => updateSelectedBoxValue(field, Number(event.target.value))}
                      className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-base"
                    />
                  </div>
                ))}

                <div className="md:col-span-5 flex flex-col gap-3 rounded-xl bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {copy.itemStatus}: <span className="font-medium text-foreground">{copy.status[activeItem.status]}</span>
                    {activeItem.validatedBy && activeItem.validatedAt && (
                      <span> • {copy.validatedBy} {activeItem.validatedBy} ({activeItem.validatedAt})</span>
                    )}
                  </p>
                  <button
                    onClick={deleteSelectedBox}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {copy.deleteBox}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### A.7 `app/admin/upload/page.tsx` — Unggah File Data

Halaman unggah file dataset (CSV/Excel/GeoJSON/PDF) dengan area drag-and-drop dan tabel "unggahan terbaru". Saat ini bersifat **UI/mock** — area drop dan tabel riwayat (`RECENT_UPLOADS`) belum terhubung ke endpoint unggah; ini titik integrasi yang perlu dilengkapi tim backend. Catatan: halaman ini tidak tertaut di sidebar utama (lihat `AppSidebar` di Bagian 1), jadi diakses langsung via URL `/admin/upload`.


```tsx
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
```

---

## Bagian B — Integrasi API Backend ↔ Frontend

### B.1 Pola Integrasi Umum

Frontend **tidak memakai SDK atau wrapper HTTP khusus** — semua komunikasi memakai `fetch` native, dipanggil langsung di dalam `useEffect` (untuk load awal) atau di event handler (untuk aksi). Pola yang berulang:

```tsx
async function fetchData() {
  setIsLoading(true);
  try {
    const res = await fetch(`/api/v1/plants?${params}`);
    const json = await res.json();
    if (json.success && json.data) {
      // map respons → state
    }
  } catch (err) {
    console.error("Failed to fetch:", err);
    // sebagian halaman memakai data fallback di sini
  } finally {
    setIsLoading(false);
  }
}
```

Karakteristik penting:

- **Base path relatif `\/api/v1/...`** — frontend dan API di-deploy satu origin (Next.js), jadi tidak ada konfigurasi base URL.
- **Tanpa header Authorization eksplisit.** Sesi admin disimpan di `sessionStorage` sisi-client; endpoint mutasi belum mengirim token bearer (titik perbaikan untuk produksi).
- **`Content-Type: application/json`** untuk body JSON; **`FormData`** (tanpa header manual) untuk unggah file.
- **Degradasi anggun (graceful degradation):** beberapa fitur punya fallback bila API gagal — daftar spesies beranda (`fallbackSpecies`), detail spesies (`FALLBACK_PLANTS`), dan login (`FALLBACK_CREDENTIALS`).

### B.2 Kontrak Respons (Envelope) Standar

Frontend mengasumsikan semua endpoint mengembalikan amplop seragam. Tipe yang relevan di sisi shared (`lib/api/`):

```ts
// lib/api/api-response.ts
export type ApiResponse<T> = {
  data: T;
  meta?: ApiMeta;
};

// lib/api/api-meta.ts
export type ApiMeta = {
  page?: number;
  limit?: number;
  total?: number;
  hasNextPage?: boolean;
};
```

Dalam praktiknya, payload yang dibaca frontend berbentuk:

```jsonc
// Sukses (list)
{ "success": true, "data": [ /* ... */ ], "meta": { "total": 42, "limit": 20 } }

// Sukses (auth)
{ "success": true, "user": { "id": 1, "name": "Admin", "email": "...", "role": "Super Admin" } }

// Gagal
{ "success": false, "error": { "message": "Pesan error untuk ditampilkan" } }
```

Konvensi yang konsisten di frontend: cek `json.success` dulu, baca `json.data`/`json.meta`, dan tampilkan `json.error?.message` saat gagal. Paginasi `Data Explorer` mengandalkan `meta.total`.

### B.3 Tabel Endpoint yang Dikonsumsi Frontend

| Endpoint | Method | Dipakai di | Tujuan |
|---|---|---|---|
| `/api/v1/auth/login` | POST | `AuthContext.login` | Login admin (DB-first) |
| `/api/v1/auth/change-password` | POST | `AuthContext.updatePassword` | Ganti password user login |
| `/api/v1/auth/forgot-password` | POST | `AdminLoginPage` | Kirim link reset ke email |
| `/api/v1/auth/reset-password` | GET | `admin/reset-password` | Validasi token reset |
| `/api/v1/auth/reset-password` | POST | `admin/reset-password` | Set password baru via token |
| `/api/v1/roles` | GET | `admin` (tab users) | Daftar peran untuk dropdown |
| `/api/v1/users` | GET | `admin` (tab users) | Daftar user |
| `/api/v1/users` | POST | `admin` (tab users) | Buat user baru |
| `/api/v1/users/{id}` | PATCH | `admin` (tab users) | Ubah peran user |
| `/api/v1/users/{id}` | DELETE | `admin` (tab users) | Hapus user |
| `/api/v1/plants` | GET | beranda, `data`, `species/[id]`, `admin` | List/cari spesies (`search`, `family`, `limit`, `offset`) |
| `/api/v1/plants` | POST | `admin` (tab species) | Tambah spesies |
| `/api/v1/plants/{id}` | PATCH | `species/[id]`, `admin` | Perbarui spesies |
| `/api/v1/plants/{id}` | DELETE | `admin` (tab species) | Hapus spesies |
| `/api/v1/plants/upload-sketch` | POST | `species/[id]`, `admin` | Unggah sketsa herbarium (multipart) |
| `/api/v1/plants/detect` | POST | `CameraSearchDialog`, `AdminDataAnnotationPanel` | Deteksi spesies dari gambar (AI) |
| `/api/v1/translate` | POST | `lib/translation/client` | Terjemahan teks EN↔ID |

### B.4 Normalisasi Field (camelCase ↔ snake_case)

Respons API bisa datang dalam dua gaya penamaan, sehingga setiap halaman yang memetakan data spesies/user melakukan normalisasi defensif. Pola yang dipakai (contoh dari beberapa halaman):

```tsx
scientificName: p.scientificName || p.scientific_name || "",
botanicalDescription: p.botanicalDescription || p.botanical_description || "",
imagePath: p.imagePath || p.image_path || "",
updatedAt: p.updatedAt || p.updated_at || "",
```

Ini membuat frontend tahan terhadap perbedaan serializer backend. Tim disarankan menstandarkan satu gaya (camelCase) agar mapping ini bisa disederhanakan ke depannya.

### B.5 Integrasi Terjemahan — `lib/translation/`

Satu-satunya "klien API" terstruktur di sisi frontend. Dipakai halaman/komponen spesies saat menyimpan: deskripsi dalam satu bahasa otomatis diterjemahkan ke bahasa lain sebelum dikirim ke `PATCH/POST /api/v1/plants`.

- **`client.ts`** — `translateText(text, source, target)` memanggil `POST /api/v1/translate`; melempar error bila `!response.ok || !result.success`.
- **`species.ts`** — `translateSpeciesDescriptions(...)` menerjemahkan tiga field (botani, ekologi, dampak) secara paralel (`Promise.all`) dan mengembalikan pasangan `*En`/`*Id` siap simpan.


```ts
export type TranslateLanguage = "en" | "id";

export async function translateText(
  text: string,
  sourceLanguage: TranslateLanguage,
  targetLanguage: TranslateLanguage,
) {
  const normalizedText = text.trim();
  if (!normalizedText || sourceLanguage === targetLanguage) return normalizedText;

  const response = await fetch("/api/v1/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: normalizedText,
      sourceLanguage,
      targetLanguage,
    }),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || "Failed to translate text");
  }

  return String(result.data?.translatedText || normalizedText).trim();
}
```



```ts
import { translateText, type TranslateLanguage } from "./client";

interface SpeciesDescriptionInput {
  botanicalDescription: string;
  ecologicalInformation: string;
  environmentalImpact: string;
  sourceLanguage: TranslateLanguage;
}

export async function translateSpeciesDescriptions({
  botanicalDescription,
  ecologicalInformation,
  environmentalImpact,
  sourceLanguage,
}: SpeciesDescriptionInput) {
  const targetLanguage: TranslateLanguage = sourceLanguage === "id" ? "en" : "id";
  const [
    translatedDescription,
    translatedEcology,
    translatedImpact,
  ] = await Promise.all([
    translateText(botanicalDescription, sourceLanguage, targetLanguage),
    translateText(ecologicalInformation, sourceLanguage, targetLanguage),
    translateText(environmentalImpact, sourceLanguage, targetLanguage),
  ]);

  return {
    botanicalDescriptionEn: sourceLanguage === "en" ? botanicalDescription : translatedDescription,
    botanicalDescriptionId: sourceLanguage === "id" ? botanicalDescription : translatedDescription,
    ecologicalInformationEn: sourceLanguage === "en" ? ecologicalInformation : translatedEcology,
    ecologicalInformationId: sourceLanguage === "id" ? ecologicalInformation : translatedEcology,
    environmentalImpactEn: sourceLanguage === "en" ? environmentalImpact : translatedImpact,
    environmentalImpactId: sourceLanguage === "id" ? environmentalImpact : translatedImpact,
  };
}
```

### B.6 Integrasi Deteksi AI — `components/CameraSearchDialog.tsx`

Komponen pencarian-via-gambar (dipicu tombol kamera di beranda). Mengintegrasikan kamera perangkat dengan endpoint deteksi AI:

- **Tiga view** (`menu` → `camera` → `result`).
- **Akses kamera** via `navigator.mediaDevices.getUserMedia` (dengan penanganan izin ditolak), menggambar frame ke `<canvas>` untuk mengambil snapshot, atau unggah file.
- **Deteksi** → `POST /api/v1/plants/detect` mengirim gambar; hasil berupa daftar `DetectionResult` (nama, confidence, bounding box, `link` ke halaman spesies).
- Hasil teratas bisa langsung diarahkan ke `/species/{slug}` atau `/map`/`/modeling` terkait.

Endpoint `\/api/v1/plants/detect` yang sama juga dipakai `AdminDataAnnotationPanel` (A.6), sehingga logika deteksi konsisten antara pengguna publik dan alur anotasi admin.


```tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Upload, X, ScanSearch, CheckCircle2, AlertCircle, Video, CircleDot, SwitchCamera, ArrowLeft, Map as MapIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface DetectionResult {
  name: string;
  confidence: number;
  box?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
  } | null;
  link: string;
}

interface CameraSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DialogView = "menu" | "camera" | "result";

const CAMERA_COPY = {
  en: {
    titles: { menu: "Search by Image", camera: "Take Photo", result: "Detection Result" },
    descriptions: {
      menu: "Identify invasive alien species by analyzing a photo.",
      camera: "Point the camera at a plant and capture a photo.",
      result: "Analyzing your image for invasive alien species.",
    },
    cameraDenied: "Camera access was denied. Please allow camera access in your browser settings.",
    cameraMissing: "No camera was found. Make sure your device has a camera.",
    cameraFailed: "Could not access the camera. Please try again.",
    analysisFailed: "Could not analyze the image. Please try again.",
    uploadImage: "Upload Image",
    takePhoto: "Take Photo",
    cameraError: "Camera Error",
    back: "Back",
    loadingCamera: "Loading camera...",
    capturePhoto: "Capture Photo",
    capturedAlt: "Captured image",
    analyzing: "Analyzing image...",
    contacting: "Contacting AI detection service",
    error: "Error",
    notDetected: "Not Detected",
    noDetection: "No invasive plant was detected in this image.",
    identified: "Identified",
    confidence: "confidence score",
    otherDetections: "Other detections:",
    clear: "Clear",
    viewDetails: "View Details",
    viewSdmMap: "View SDM Map",
  },
  id: {
    titles: { menu: "Cari dengan Gambar", camera: "Ambil Foto", result: "Hasil Deteksi" },
    descriptions: {
      menu: "Identifikasi spesies asing invasif dengan menganalisis foto.",
      camera: "Arahkan kamera ke tanaman lalu ambil foto.",
      result: "Menganalisis gambar untuk spesies asing invasif.",
    },
    cameraDenied: "Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.",
    cameraMissing: "Kamera tidak ditemukan. Pastikan perangkat Anda memiliki kamera.",
    cameraFailed: "Gagal mengakses kamera. Silakan coba lagi.",
    analysisFailed: "Gagal menganalisis gambar. Silakan coba lagi.",
    uploadImage: "Unggah Gambar",
    takePhoto: "Ambil Foto",
    cameraError: "Kesalahan Kamera",
    back: "Kembali",
    loadingCamera: "Memuat kamera...",
    capturePhoto: "Ambil Foto",
    capturedAlt: "Gambar yang diambil",
    analyzing: "Menganalisis gambar...",
    contacting: "Menghubungi layanan deteksi AI",
    error: "Error",
    notDetected: "Tidak Terdeteksi",
    noDetection: "Tidak ada tanaman invasif yang terdeteksi pada gambar ini.",
    identified: "Teridentifikasi",
    confidence: "skor keyakinan",
    otherDetections: "Deteksi lainnya:",
    clear: "Bersihkan",
    viewDetails: "Lihat Detail",
    viewSdmMap: "Lihat Peta SDM",
  },
} as const;

export function CameraSearchDialog({ open, onOpenChange }: CameraSearchDialogProps) {
  const [view, setView] = useState<DialogView>("menu");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionResults, setDetectionResults] = useState<DetectionResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const router = useRouter();
  const { language } = useLanguage();
  const copy = CAMERA_COPY[language];
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (facing: "user" | "environment" = facingMode) => {
    setCameraError(null);
    setIsCameraReady(false);

    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraReady(true);
        };
      }
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      const errorName = err instanceof DOMException ? err.name : "";
      if (errorName === "NotAllowedError") {
        setCameraError(copy.cameraDenied);
      } else if (errorName === "NotFoundError") {
        setCameraError(copy.cameraMissing);
      } else {
        setCameraError(copy.cameraFailed);
      }
    }
  }, [copy.cameraDenied, copy.cameraFailed, copy.cameraMissing, facingMode]);

  // Handle switching camera facing mode
  const switchCamera = useCallback(async () => {
    const newFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacing);
    await startCamera(newFacing);
  }, [facingMode, startCamera]);

  const startAnalysis = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setDetectionResults(null);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/v1/plants/detect", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (json.success && json.data?.plants?.length > 0) {
        setDetectionResults(json.data.plants);
      } else {
        setDetectionResults([]);
      }
    } catch (err) {
      console.error("Detection failed:", err);
      setError(copy.analysisFailed);
    } finally {
      setIsAnalyzing(false);
    }
  }, [copy.analysisFailed]);

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror the image if using front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to data URL and File
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setImageSrc(dataUrl);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          stopCamera();
          setView("result");
          startAnalysis(file);
        }
      },
      "image/jpeg",
      0.9
    );
  }, [facingMode, startAnalysis, stopCamera]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setView("result");
      startAnalysis(file);
    }
  };

  const resetDialog = () => {
    stopCamera();
    setView("menu");
    setImageSrc(null);
    setIsAnalyzing(false);
    setDetectionResults(null);
    setError(null);
    setCameraError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetDialog();
    }
    onOpenChange(newOpen);
  };

  const handleViewDetails = (plantName: string) => {
    handleOpenChange(false);
    const id = plantName.toLowerCase().replace(/\s+/g, '-');
    router.push(`/species/${id}`);
  };

  const handleViewSDM = (plantName: string) => {
    handleOpenChange(false);
    const speciesSlug = plantName.toLowerCase().replace(/\s+/g, '-');
    router.push(`/modeling?species=${speciesSlug}`);
  };

  const handleTakePhotoClick = () => {
    cameraInputRef.current?.click();
  };

  // Cleanup camera on unmount or dialog close
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Stop camera when dialog closes
  useEffect(() => {
    if (!open) {
      stopCamera();
    }
  }, [open, stopCamera]);

  // Get the top detection result
  const topResult = detectionResults && detectionResults.length > 0 ? detectionResults[0] : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {copy.titles[view]}
          </DialogTitle>
          <DialogDescription>
            {copy.descriptions[view]}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          {/* ========== MENU VIEW ========== */}
          {view === "menu" && (
            <div className="grid w-full grid-cols-2 gap-4">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={cameraInputRef}
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                className="flex h-24 flex-col gap-2 bg-muted/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 text-primary" />
                <span>{copy.uploadImage}</span>
              </Button>

              <Button
                variant="outline"
                className="flex h-24 flex-col gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20"
                onClick={handleTakePhotoClick}
              >
                <Camera className="h-6 w-6 text-primary" />
                <span>{copy.takePhoto}</span>
              </Button>
            </div>
          )}

          {/* ========== CAMERA VIEW ========== */}
          {view === "camera" && (
            <div className="flex w-full flex-col items-center space-y-4">
              {cameraError ? (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="w-full flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                    <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-destructive">{copy.cameraError}</span>
                      <span className="text-xs text-destructive/80">{cameraError}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { resetDialog(); }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {copy.back}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative w-full overflow-hidden rounded-lg border-2 border-primary/20 bg-black" style={{ aspectRatio: "4/3" }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full object-cover"
                      style={facingMode === "user" ? { transform: "scaleX(-1)" } : undefined}
                    />
                    {/* Hidden canvas for capturing */}
                    <canvas ref={canvasRef} className="hidden" />

                    {!isCameraReady && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                        <Video className="h-8 w-8 animate-pulse text-primary mb-2" />
                        <span className="text-sm text-white animate-pulse">{copy.loadingCamera}</span>
                      </div>
                    )}

                    {/* Camera viewfinder corners */}
                    {isCameraReady && (
                      <div className="absolute inset-4 pointer-events-none">
                        {/* Top-left corner */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/70 rounded-tl-sm" />
                        {/* Top-right corner */}
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/70 rounded-tr-sm" />
                        {/* Bottom-left corner */}
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/70 rounded-bl-sm" />
                        {/* Bottom-right corner */}
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/70 rounded-br-sm" />
                      </div>
                    )}
                  </div>

                  <div className="flex w-full items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => { resetDialog(); }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <Button
                      size="lg"
                      className="flex-1 bg-primary hover:bg-primary/90 gap-2"
                      onClick={capturePhoto}
                      disabled={!isCameraReady}
                    >
                      <CircleDot className="h-5 w-5" />
                      {copy.capturePhoto}
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={switchCamera}
                      disabled={!isCameraReady}
                    >
                      <SwitchCamera className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ========== RESULT VIEW ========== */}
          {view === "result" && imageSrc && (
            <div className="flex w-full flex-col items-center space-y-4">
              <div className="relative flex h-64 w-full items-center justify-center overflow-hidden rounded-md border bg-muted p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt={copy.capturedAlt}
                  className="h-full w-full object-contain"
                />
                
                {isAnalyzing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                    <ScanSearch className="h-8 w-8 animate-pulse text-primary mb-2" />
                    <span className="text-sm font-medium animate-pulse">{copy.analyzing}</span>
                    <span className="text-xs text-muted-foreground mt-1">{copy.contacting}</span>
                  </div>
                )}
              </div>

              {/* Error state */}
              {error && (
                <div className="w-full flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-destructive">{copy.error}</span>
                    <span className="text-xs text-destructive/80">{error}</span>
                  </div>
                </div>
              )}

              {/* No results */}
              {detectionResults && detectionResults.length === 0 && !error && (
                <div className="w-full flex items-start gap-3 rounded-lg border bg-muted p-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{copy.notDetected}</span>
                    <span className="text-xs text-muted-foreground">{copy.noDetection}</span>
                  </div>
                </div>
              )}

              {/* Detection results */}
              {topResult && (
                <div className="w-full flex items-start gap-3 rounded-lg border border-success/20 bg-success p-4 text-success-foreground shadow-md transition-all">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-success-foreground mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{copy.identified}</span>
                    <span className="text-lg font-bold">{topResult.name}</span>
                    <span className="text-xs opacity-80">{Math.round(topResult.confidence * 100)}% {copy.confidence}</span>
                  </div>
                </div>
              )}

              {/* Multiple detections */}
              {detectionResults && detectionResults.length > 1 && (
                <div className="w-full space-y-1">
                  <span className="text-xs text-muted-foreground">{copy.otherDetections}</span>
                  {detectionResults.slice(1, 4).map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleViewDetails(result.name)}
                      className="w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <span className="font-medium">{result.name}</span>
                      <span className="text-xs text-muted-foreground">{Math.round(result.confidence * 100)}%</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex w-full flex-col gap-2">
                <div className="flex w-full gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={resetDialog}
                    disabled={isAnalyzing}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {copy.clear}
                  </Button>
                  {topResult && (
                    <Button className="w-full bg-primary" onClick={() => handleViewDetails(topResult.name)}>
                      {copy.viewDetails}
                    </Button>
                  )}
                </div>
                {topResult && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => handleViewSDM(topResult.name)}
                  >
                    <MapIcon className="h-4 w-4" />
                    {copy.viewSdmMap}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---