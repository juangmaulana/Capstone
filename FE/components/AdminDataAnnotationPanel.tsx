"use client";

import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  ListFilter,
  Loader2,
  PencilRuler,
  Plus,
  ScanSearch,
  SquareDashedMousePointer,
  Tag,
  Trash2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const UNKNOWN_SPECIES_CLASS = "Unknown";

type PlantRecord = {
  id: number;
  scientificName?: string;
  scientific_name?: string;
};

const getPlantLabel = (plant: PlantRecord) =>
  plant.scientificName || plant.scientific_name || `Species #${plant.id}`;

const fetchPlantRecords = async (): Promise<PlantRecord[]> => {
  const response = await fetch("/api/v1/plants?limit=100");
  if (!response.ok) return [];

  const json = await response.json();
  return Array.isArray(json.data) ? json.data : [];
};

const getBinomialName = (name: string) =>
  name.trim().toLowerCase().split(/\s+/).slice(0, 2).join(" ");

const findSpeciesClass = (speciesClasses: string[], name: string) => {
  const normalizedName = name.trim().toLowerCase();
  const binomialName = getBinomialName(name);

  return speciesClasses.find((cls) => {
    const normalizedClass = cls.toLowerCase();
    return normalizedClass === normalizedName || getBinomialName(cls) === binomialName;
  });
};

type ItemStatus = "pending" | "annotated" | "validated";
type EditorMode = "draw" | "select";
type ValidationFilter = "none" | "ranger" | "admin";

const VALIDATION_FILTERS: ValidationFilter[] = ["none", "ranger", "admin"];

const VALIDATION_FILTER_STATUS: Record<ValidationFilter, ItemStatus> = {
  none: "pending",
  ranger: "annotated",
  admin: "validated",
};

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

interface ApiIdentification {
  id: number;
  confidence?: number;
  aiResponse?: string;
  isSuccess?: boolean;
  notes?: string | null;
  identifiedAt?: string;
  ranger?: {
    id?: number;
    name?: string;
  };
  admin?: {
    id?: number;
    name?: string;
    email?: string;
  };
  image?: {
    id?: number;
    name?: string;
    path?: string;
    size?: number;
    uploadedAt?: string;
  };
  plant?: {
    id?: number;
    name?: string;
  };
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
  isDetecting?: boolean;
  notes?: string;
  sourceIdentificationId?: number;
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
  adminId?: number;
  canDelete?: boolean;
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
      totalBatch: "Total Observations",
      pending: "Ranger Validation",
      validated: "Admin Validation",
    },
    quickTitle: "Quick Guide",
    quickDesc: "Follow the sequence below so annotations stay easy to read and review.",
    steps: [
      "1. Choose the batch and image you want to work on.",
      "2. Draw a box around a clearly visible object.",
      "3. Click Save Annotation to save changes.",
      "4. Click Validate when the data is correct.",
    ],
    batchTitle: "Dataset",
    images: "Observations",
    pagination: { previous: "Previous", next: "Next", page: "Page", of: "of" },
    box: "box",
    emptyBatch: "There are no images in this batch yet.",
    loadingBatch: "Loading observations from API...",
    loadBatchFailed: "Failed to load observations from API.",
    editorTitle: "Interactive Bounding Box Editor",
    editorDesc: "1) Choose a mode. 2) Draw a box. 3) Save. 4) Validate.",
    draw: "Draw",
    selectEdit: "Select/Edit",
    saveAnnotation: "Save Annotation",
    validate: "Validate",
    deleteAnnotation: "Delete",
    emptyEditorTitle: "Choose an image on the left to start annotation.",
    emptyEditorDesc: "After selecting an image, draw a box around the object and press Save Annotation.",
    aiDetecting: "AI is detecting plants...",
    contactingAi: "Contacting AI detection service",
    boxProperties: "Box Properties",
    boxHelp: "Select a bounding box to edit coordinates, class, or delete the box.",
    class: "Class",
    validateFailed: "Failed to validate annotation. Please try again.",
    deleteItemFailed: "Failed to delete observation. Please try again.",
    itemStatus: "Item status",
    validatedBy: "validated by",
    deleteBox: "Delete Box",
    status: { pending: "pending", annotated: "annotated", validated: "validated" },
    filterNone: "None",
    filterRanger: "Ranger",
    filterAdmin: "Admin",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    deleteSelected: "Delete",
    deleteSelectedConfirm: (count: number) => `Delete ${count} selected image${count === 1 ? "" : "s"}? This cannot be undone.`,
    deleteItemConfirm: (filename: string) => `Delete ${filename}? This cannot be undone.`,
    deleteFailed: "Failed to delete selected image.",
    validateSelected: (count: number) => `Validate ${count} Selected`,
    selectedCount: (count: number) => `${count} selected`,
    detectionFailed: "AI detection failed. Please try again.",
    savedTitle: "Annotation Saved Successfully",
    savedMessage: (filename: string) => `Changes for ${filename} have been saved. You can continue drawing boxes or choose another image.`,
    savedButton: "Continue Annotation",
    validatedTitle: "Annotation Validated Successfully",
    validatedMessage: (filename: string) => `Data for ${filename} has been validated and is ready for review.`,
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
      deleted: (count: number) => `Deleted ${count} image${count === 1 ? "" : "s"}`,
    },
  },
  id: {
    stats: {
      totalBatch: "Total Observasi",
      pending: "Ranger Validation",
      validated: "Admin Validation",
    },
    quickTitle: "Panduan Cepat",
    quickDesc: "Ikuti urutan di bawah agar anotasi lebih mudah dibaca dan tidak membingungkan.",
    steps: [
      "1. Pilih batch dan image yang ingin dikerjakan.",
      "2. Gambar kotak pada objek yang terlihat jelas.",
      "3. Klik Save Annotation untuk menyimpan perubahan.",
      "4. Klik Validate jika data sudah benar.",
    ],
    batchTitle: "Dataset",
    images: "Observasi",
    pagination: { previous: "Sebelumnya", next: "Selanjutnya", page: "Halaman", of: "dari" },
    box: "box",
    emptyBatch: "Belum ada image di batch ini.",
    loadingBatch: "Memuat observasi dari API...",
    loadBatchFailed: "Gagal memuat observasi dari API.",
    editorTitle: "Interactive Bounding Box Editor",
    editorDesc: "1) Pilih mode. 2) Gambar box. 3) Simpan. 4) Validasi.",
    draw: "Gambar",
    selectEdit: "Pilih/Edit",
    saveAnnotation: "Simpan Anotasi",
    validate: "Validasi",
    deleteAnnotation: "Hapus",
    emptyEditorTitle: "Pilih image di sisi kiri untuk mulai anotasi.",
    emptyEditorDesc: "Setelah image dipilih, gambar kotak pada objek lalu tekan Simpan Anotasi.",
    aiDetecting: "AI sedang mendeteksi tanaman...",
    contactingAi: "Menghubungi layanan deteksi AI",
    boxProperties: "Properti Box",
    boxHelp: "Pilih bounding box untuk mengedit koordinat, class, atau hapus box.",
    class: "Class",
    validateFailed: "Gagal memvalidasi anotasi. Silakan coba lagi.",
    deleteItemFailed: "Gagal menghapus observasi. Silakan coba lagi.",
    itemStatus: "Status item",
    validatedBy: "divalidasi oleh",
    deleteBox: "Hapus Box",
    status: { pending: "pending", annotated: "annotated", validated: "validated" },
    filterNone: "None",
    filterRanger: "Ranger",
    filterAdmin: "Admin",
    selectAll: "Pilih Semua",
    deselectAll: "Batal Pilih",
    deleteSelected: "Hapus",
    deleteSelectedConfirm: (count: number) => `Hapus ${count} image yang dipilih? Tindakan ini tidak dapat dibatalkan.`,
    deleteItemConfirm: (filename: string) => `Hapus ${filename}? Tindakan ini tidak dapat dibatalkan.`,
    deleteFailed: "Gagal menghapus image yang dipilih.",
    validateSelected: (count: number) => `Validasi ${count} Item`,
    selectedCount: (count: number) => `${count} dipilih`,
    detectionFailed: "AI detection gagal. Silakan coba lagi.",
    savedTitle: "Annotation Berhasil Disimpan",
    savedMessage: (filename: string) => `Perubahan untuk ${filename} sudah disimpan. Anda bisa lanjut menggambar box atau pilih image lain.`,
    savedButton: "Lanjut Anotasi",
    validatedTitle: "Annotation Berhasil Divalidasi",
    validatedMessage: (filename: string) => `Data untuk ${filename} sudah divalidasi dan siap ditinjau.`,
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
      deleted: (count: number) => `${count} image dihapus`,
    },
  },
} as const;

const ITEMS_PER_PAGE = 10;

const PaginationControls = ({
  page,
  totalPages,
  onPageChange,
  copy,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  copy: { previous: string; next: string; page: string; of: string };
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
        {copy.previous}
      </button>
      <span className="text-sm text-muted-foreground">
        {copy.page} {page} {copy.of} {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        {copy.next}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

const toDateLabel = () => new Date().toISOString().split("T")[0];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

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

export function AdminDataAnnotationPanel({ adminName, adminId, canDelete = false, onLog }: Props) {
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
  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [speciesClasses, setSpeciesClasses] = useState<string[]>([UNKNOWN_SPECIES_CLASS]);
  const [selectedClass, setSelectedClass] = useState<string>(UNKNOWN_SPECIES_CLASS);
  const [mode, setMode] = useState<EditorMode>("draw");
  const [draftBox, setDraftBox] = useState<DraftBox | null>(null);
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<SuccessNotice | null>(null);
  const [statusFilter, setStatusFilter] = useState<ValidationFilter>("none");
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [observationsPage, setObservationsPage] = useState(1);
  const [isLoadingIdentifications, setIsLoadingIdentifications] = useState(true);
  const [identificationLoadError, setIdentificationLoadError] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const nextAnnotationIdRef = useRef(1);
  const detectingItemIdsRef = useRef<Set<number>>(new Set());
  const [stageSize, setStageSize] = useState({ width: 1, height: 1 });

  const getNextAnnotationId = useCallback(() => {
    const nextId = nextAnnotationIdRef.current;
    nextAnnotationIdRef.current += 1;
    return nextId;
  }, []);

  const allItems = useMemo(
    () => batches.flatMap((batch) => batch.items),
    [batches],
  );

  const activeItem = useMemo(() => {
    if (activeItemId === null) return null;
    return allItems.find((item) => item.id === activeItemId) ?? null;
  }, [allItems, activeItemId]);

  const selectedBox = useMemo(() => {
    if (!activeItem || selectedBoxId === null) return null;
    return activeItem.boxes.find((box) => box.id === selectedBoxId) ?? null;
  }, [activeItem, selectedBoxId]);

  const totalObservations = useMemo(
    () => batches.reduce((sum, batch) => sum + batch.items.length, 0),
    [batches],
  );
  const totalAnnotated = useMemo(
    () => batches.reduce((sum, batch) => sum + batch.items.filter((item) => item.status === "annotated").length, 0),
    [batches],
  );
  const totalValidated = useMemo(
    () => batches.reduce((sum, batch) => sum + batch.items.filter((item) => item.status === "validated").length, 0),
    [batches],
  );

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => item.status === VALIDATION_FILTER_STATUS[statusFilter]);
  }, [allItems, statusFilter]);

  const observationsTotalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = filteredItems.slice(
    (observationsPage - 1) * ITEMS_PER_PAGE,
    observationsPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setObservationsPage(1);
  }, [statusFilter]);

  useEffect(() => {
    setObservationsPage((page) => Math.min(page, Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE))));
  }, [filteredItems.length]);

  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedItemIds.has(item.id));
  const selectedCount = filteredItems.filter((item) => selectedItemIds.has(item.id)).length;
  const bulkValidatableCount = filteredItems.filter(
    (item) => selectedItemIds.has(item.id) && item.boxes.length > 0 && item.status !== "validated",
  ).length;

  const toggleSelectItem = (itemId: number) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredItems.forEach((item) => next.delete(item.id));
      } else {
        filteredItems.forEach((item) => next.add(item.id));
      }
      return next;
    });
  };

  const deleteSelectedImages = async () => {
    const toDelete = filteredItems.filter((item) => selectedItemIds.has(item.id));
    if (toDelete.length === 0) return;
    if (!window.confirm(copy.deleteSelectedConfirm(toDelete.length))) return;

    // Delete server-backed items individually so a single failure doesn't
    // block removing the ones that did succeed. Local-only items (no
    // sourceIdentificationId) have nothing to delete server-side.
    const results = await Promise.all(
      toDelete.map(async (item) => {
        if (!item.sourceIdentificationId) return { item, deleted: true };
        try {
          await deleteIdentification(item.sourceIdentificationId);
          return { item, deleted: true };
        } catch (error) {
          console.error(`Failed to delete identification ${item.sourceIdentificationId}:`, error);
          return { item, deleted: false };
        }
      }),
    );

    const deletedItems = results.filter((r) => r.deleted).map((r) => r.item);
    const failedCount = results.length - deletedItems.length;

    if (deletedItems.length > 0) {
      deletedItems.forEach((item) => {
        if (item.src.startsWith("blob:")) {
          URL.revokeObjectURL(item.src);
        }
      });

      const ids = new Set(deletedItems.map((item) => item.id));
      setBatches((prev) =>
        prev.map((batch) => ({
          ...batch,
          items: batch.items.filter((item) => !ids.has(item.id)),
        })),
      );
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      setSelectedBoxId(null);
      setActiveItemId((current) => {
        if (current === null || !ids.has(current)) return current;
        return allItems.find((item) => !ids.has(item.id))?.id ?? null;
      });
      onLog?.("success", copy.logs.annotationSource, copy.logs.deleted(deletedItems.length));
    }

    if (failedCount > 0) {
      setDetectionError(copy.deleteFailed);
    }
  };

  const bulkValidate = () => {
    const toValidate = filteredItems.filter(
      (item) => selectedItemIds.has(item.id) && item.boxes.length > 0 && item.status !== "validated",
    );
    if (toValidate.length === 0) return;

    const ids = new Set(toValidate.map((item) => item.id));
    setBatches((prev) =>
      prev.map((batch) => ({
        ...batch,
        items: batch.items.map((item) =>
          ids.has(item.id)
            ? { ...item, status: "validated" as ItemStatus, validatedBy: adminName, validatedAt: toDateLabel() }
            : item,
        ),
      })),
    );
    setSelectedItemIds(new Set());
    if (adminId) {
      toValidate
        .filter((item) => item.sourceIdentificationId)
        .forEach((item) => {
          void updateIdentification(item.sourceIdentificationId!, { adminId });
        });
    }
    onLog?.("success", copy.logs.verificationSource, copy.logs.validated(`${toValidate.length} items`));
  };

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateStageSize = () => {
      const rect = stage.getBoundingClientRect();
      setStageSize({
        width: Math.max(rect.width, 1),
        height: Math.max(rect.height, 1),
      });
    };

    updateStageSize();
    const resizeObserver = new ResizeObserver(updateStageSize);
    resizeObserver.observe(stage);

    return () => resizeObserver.disconnect();
  }, [activeItem?.id]);

  const getImageScale = useCallback((stageWidth: number, stageHeight: number) => {
    if (!activeItem) {
      return {
        scaleX: 1,
        scaleY: 1,
        imageFrame: { left: 0, top: 0, width: 1, height: 1 },
      };
    }

    const stageRatio = stageWidth / stageHeight;
    const imageRatio = activeItem.imageWidth / activeItem.imageHeight;
    const imageFrame = stageRatio > imageRatio
      ? {
        width: stageHeight * imageRatio,
        height: stageHeight,
        left: (stageWidth - stageHeight * imageRatio) / 2,
        top: 0,
      }
      : {
        width: stageWidth,
        height: stageWidth / imageRatio,
        left: 0,
        top: (stageHeight - stageWidth / imageRatio) / 2,
      };

    return {
      scaleX: imageFrame.width / activeItem.imageWidth,
      scaleY: imageFrame.height / activeItem.imageHeight,
      imageFrame,
    };
  }, [activeItem]);

  const renderScale = useMemo(
    () => getImageScale(stageSize.width, stageSize.height),
    [getImageScale, stageSize.height, stageSize.width],
  );

  const getScale = () => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) {
      return renderScale;
    }

    return getImageScale(rect.width, rect.height);
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
      prev.map((batch) => ({
        ...batch,
        items: batch.items.map((item) => (item.id === itemId ? updater(item) : item)),
      })),
    );
  }, []);

  const updateIdentification = useCallback(async (
    identificationId: number,
    input: {
      adminId: number;
    },
  ) => {
    const response = await fetch(`/api/v1/identifications/${identificationId}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to update identification");
    }

    return json.data as ApiIdentification;
  }, []);

  const updateBoundingBox = useCallback(async (
    identificationId: number,
    box: { x1: number; y1: number; x2: number; y2: number },
  ) => {
    const response = await fetch(`/api/v1/identifications/${identificationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(box),
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to update bounding box");
    }

    return json.data as ApiIdentification;
  }, []);

  const deleteIdentification = useCallback(async (identificationId: number) => {
    const response = await fetch(`/api/v1/identifications/${identificationId}`, {
      method: "DELETE",
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to delete identification");
    }

    return json.data as ApiIdentification;
  }, []);

  // AI Detection function — sends image to /api/v1/plants/detect
  // Runs per-item so multiple images can be detected concurrently after bulk upload
  const detectPlant = useCallback(async (item: AnnotationItem) => {
    if (item.aiDetected || item.isDetecting || detectingItemIdsRef.current.has(item.id)) return;

    detectingItemIdsRef.current.add(item.id);

    setItemValue(item.id, (prev) => ({ ...prev, isDetecting: true }));

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

        const newBoxes: BoundingBox[] = [topDetection]
          .map((det) => {
            const normalizedBox = normalizeDetectedBox(det.box, item.imageWidth, item.imageHeight);
            if (!normalizedBox) return null;
            const matchedClass = findSpeciesClass(speciesClasses, det.name) || det.name;
            return { id: getNextAnnotationId(), className: matchedClass, ...normalizedBox };
          })
          .filter((box): box is BoundingBox => box !== null);

        const matchedTopClass = findSpeciesClass(speciesClasses, topDetection.name);

        setItemValue(item.id, (prev) => ({
          ...prev,
          isDetecting: false,
          boxes: newBoxes.length > 0 ? newBoxes : prev.boxes,
          aiDetected: true,
          aiSpecies: matchedTopClass || topDetection.name,
          aiConfidence: topDetection.confidence,
          status: newBoxes.length > 0 ? "annotated" : prev.status,
        }));

        onLog?.("info", copy.logs.aiSource, copy.logs.detected(topDetection.name, Math.round(topDetection.confidence * 100), item.filename));
      } else {
        setItemValue(item.id, (prev) => ({
          ...prev,
          isDetecting: false,
          aiDetected: true,
          aiSpecies: undefined,
          aiConfidence: undefined,
        }));
        onLog?.("warning", copy.logs.aiSource, copy.logs.noPlant(item.filename));
      }
    } catch (err) {
      console.error("AI detection failed:", err);
      setItemValue(item.id, (prev) => ({ ...prev, isDetecting: false, aiDetected: true }));
      setDetectionError(copy.detectionFailed);
      onLog?.("error", copy.logs.aiSource, copy.logs.failed(item.filename));
    } finally {
      detectingItemIdsRef.current.delete(item.id);
    }
  }, [copy, getNextAnnotationId, onLog, setItemValue, speciesClasses]);

  useEffect(() => {
    let isCancelled = false;

    const loadApiIdentifications = async () => {
      setIsLoadingIdentifications(true);
      setIdentificationLoadError(null);

      try {
        const res = await fetch("/api/v1/identifications?limit=100");
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

        const json = await res.json();
        if (!json.success || !Array.isArray(json.data)) {
          throw new Error("Invalid identifications response");
        }

        const identifications = json.data as ApiIdentification[];

        const apiItems = await Promise.all(
          identifications
            .filter((identification) => identification.image?.path)
            .map(async (identification) => {
              const src = identification.image!.path!;
              const size = await readImageSize(src);
              const plantName = identification.plant?.name;
              const detectedName = plantName || identification.aiResponse || undefined;
              const isAdminValidated = identification.admin != null;
              const isRangerValidated = identification.ranger != null;
              return {
                id: getNextAnnotationId(),
                filename: identification.image?.name || `identification-${identification.id}`,
                src,
                imageWidth: size.width,
                imageHeight: size.height,
                boxes: [],
                status: isAdminValidated
                  ? "validated" as ItemStatus
                  : isRangerValidated
                    ? "annotated" as ItemStatus
                    : "pending" as ItemStatus,
                aiDetected: true,
                aiSpecies: detectedName ? findSpeciesClass(speciesClasses, detectedName) || detectedName : undefined,
                aiConfidence: identification.confidence,
                notes: identification.notes ?? "",
                validatedBy: identification.admin?.name || identification.ranger?.name,
                validatedAt: undefined,
                sourceIdentificationId: identification.id,
              };
            }),
        );

        if (isCancelled) return;

        setBatches((prev) =>
          prev.map((batch) =>
            batch.id === 1
              ? {
                ...batch,
                name: "API Identifications",
                period: "api/v1/identifications",
                items: apiItems,
              }
              : { ...batch, items: [] },
          ),
        );

        setSelectedItemIds(new Set());
        setSelectedBoxId(null);
        setActiveItemId(apiItems[0]?.id ?? null);
      } catch (error) {
        console.error("Failed to load API identifications:", error);
        if (!isCancelled) {
          setIdentificationLoadError(copy.loadBatchFailed);
          setBatches((prev) => prev.map((batch) => ({ ...batch, items: [] })));
          setActiveItemId(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingIdentifications(false);
        }
      }
    };

    loadApiIdentifications();

    return () => {
      isCancelled = true;
    };
  }, [copy.loadBatchFailed, getNextAnnotationId, speciesClasses]);

  useEffect(() => {
    let isCancelled = false;

    fetchPlantRecords().then((plants) => {
      if (isCancelled) return;
      const names = plants
        .map(getPlantLabel)
        .filter((name) => !name.startsWith("Species #"))
        .sort((a, b) => a.localeCompare(b));

      if (names.length === 0) return;

      const nextSpeciesClasses = [...names, UNKNOWN_SPECIES_CLASS];
      setSpeciesClasses(nextSpeciesClasses);
      setSelectedClass((current) => (current === UNKNOWN_SPECIES_CLASS ? nextSpeciesClasses[0] : current));
    }).catch((error) => {
      console.error("Failed to load species list:", error);
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    allItems.forEach((item) => {
      if (!item.aiDetected && !item.isDetecting) {
        void detectPlant(item);
      }
    });
  }, [allItems, detectPlant]);

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
      id: getNextAnnotationId(),
      className: selectedClass,
      x: left / scaleX,
      y: top / scaleY,
      width: width / scaleX,
      height: height / scaleY,
    };

    setItemValue(activeItem.id, (item) => ({
      ...item,
      boxes: [box],
      status: "annotated",
    }));

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

    const nextStatus: ItemStatus = activeItem.boxes.length > 0 ? "annotated" : "pending";

    if (activeItem.sourceIdentificationId) {
      const box = activeItem.boxes[0];
      if (box) {
        void updateBoundingBox(activeItem.sourceIdentificationId, {
          x1: box.x,
          y1: box.y,
          x2: box.x + box.width,
          y2: box.y + box.height,
        });
      }
    }

    setItemValue(activeItem.id, (item) => ({
      ...item,
      status: nextStatus,
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

  const validateAnnotation = async () => {
    if (!activeItem || activeItem.boxes.length === 0) return;

    try {
      if (activeItem.sourceIdentificationId && adminId) {
        await updateIdentification(activeItem.sourceIdentificationId, { adminId });
      }

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
    } catch (error) {
      console.error("Failed to validate annotation:", error);
      setDetectionError(copy.validateFailed);
    }
  };

  const deleteActiveAnnotation = async () => {
    if (!activeItem) return;
    if (!window.confirm(copy.deleteItemConfirm(activeItem.filename))) return;

    try {
      if (activeItem.sourceIdentificationId) {
        await deleteIdentification(activeItem.sourceIdentificationId);
      }

      if (activeItem.src.startsWith("blob:")) {
        URL.revokeObjectURL(activeItem.src);
      }

      const deletedId = activeItem.id;
      setBatches((prev) =>
        prev.map((batch) => ({
          ...batch,
          items: batch.items.filter((item) => item.id !== deletedId),
        })),
      );
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        next.delete(deletedId);
        return next;
      });
      setSelectedBoxId(null);
      setActiveItemId(allItems.find((item) => item.id !== deletedId)?.id ?? null);
      onLog?.("success", copy.logs.annotationSource, copy.logs.deleted(1));
    } catch (error) {
      console.error("Failed to delete annotation:", error);
      setDetectionError(copy.deleteItemFailed);
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
          <p className="text-2xl font-bold mt-1">{totalObservations}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">{copy.stats.pending}</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{totalAnnotated}</p>
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
              </div>
            </div>
          </div>

          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <ListFilter className="h-4 w-4" />
                {copy.images}
              </div>
              <div className="flex items-center gap-2">
                {canDelete && (
                  <button
                    onClick={deleteSelectedImages}
                    disabled={selectedCount === 0}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:pointer-events-none disabled:text-muted-foreground/50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {copy.deleteSelected}
                  </button>
                )}
                <button
                  onClick={toggleSelectAll}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {allFilteredSelected ? copy.deselectAll : copy.selectAll}
                </button>
              </div>
            </div>

            <div className="flex gap-1 flex-wrap mb-3">
              {VALIDATION_FILTERS.map((f) => {
                const filterLabel = f === "none" ? copy.filterNone : f === "ranger" ? copy.filterRanger : copy.filterAdmin;
                return (
                  <button
                    key={f}
                    onClick={() => { setStatusFilter(f); setSelectedItemIds(new Set()); }}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${statusFilter === f ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted border-transparent"}`}
                  >
                    {filterLabel}
                  </button>
                );
              })}
            </div>

            {selectedCount > 0 && (
              <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                <span className="text-xs font-medium text-primary">{copy.selectedCount(selectedCount)}</span>
                {bulkValidatableCount > 0 && (
                  <button
                    onClick={bulkValidate}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {copy.validateSelected(bulkValidatableCount)}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="px-4 pb-4 max-h-72 overflow-y-auto">
            <div className="space-y-2">
              {isLoadingIdentifications && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{copy.loadingBatch}</span>
                </div>
              )}
              {!isLoadingIdentifications && identificationLoadError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive">
                  {identificationLoadError}
                </div>
              )}
              {paginatedItems.map((item) => {
                const isSelected = selectedItemIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`relative flex items-start gap-2 rounded-xl border text-sm transition-colors ${activeItemId === item.id ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
                  >
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => {
                          setActiveItemId(item.id);
                          setSelectedBoxId(null);
                          setDraftBox(null);
                          setDetectionError(null);
                          if (!item.aiDetected && !item.isDetecting) detectPlant(item);
                        }}
                        className="w-full px-3 pt-3 pb-2 text-left"
                      >
                        <p className="font-semibold truncate pr-6">{item.filename}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[item.status]}`}>
                            {copy.status[item.status]}
                          </span>
                          <span className="text-xs text-muted-foreground">{item.boxes.length} {copy.box}</span>
                        </div>
                        {item.isDetecting && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>{copy.aiDetecting}</span>
                          </div>
                        )}
                        {!item.isDetecting && item.aiDetected && item.aiSpecies && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs">
                            <ScanSearch className="h-3.5 w-3.5 text-primary" />
                            <span className="font-medium text-primary truncate">{item.aiSpecies}</span>
                            <span className="text-muted-foreground">{Math.round((item.aiConfidence ?? 0) * 100)}%</span>
                          </div>
                        )}
                      </button>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelectItem(item.id); }}
                      className={`absolute right-3 top-3 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/40 hover:border-primary"}`}
                      aria-label={isSelected ? "Deselect" : "Select"}
                    >
                      {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                    </button>
                  </div>
                );
              })}
              {!isLoadingIdentifications && !identificationLoadError && filteredItems.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">{copy.emptyBatch}</p>
              )}
            </div>
          </div>
          <PaginationControls
            page={observationsPage}
            totalPages={observationsTotalPages}
            onPageChange={setObservationsPage}
            copy={copy.pagination}
          />
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
                    {speciesClasses.map((label) => (
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
                <button
                  onClick={deleteActiveAnnotation}
                  disabled={!activeItem}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {copy.deleteAnnotation}
                </button>
              </div>
            </div>

            <div className="p-5">
              {activeItem && detectionError && !activeItem.isDetecting && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{detectionError}</span>
                </div>
              )}

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
                  {activeItem.isDetecting && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-20">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                      <span className="text-sm font-medium animate-pulse">{copy.aiDetecting}</span>
                      <span className="text-xs text-muted-foreground mt-1">{copy.contactingAi}</span>
                    </div>
                  )}

                  {activeItem.boxes.map((box) => {
                    const { scaleX, scaleY, imageFrame } = renderScale;
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
                    <div
                      className="absolute border-2 border-cyan-400 bg-cyan-300/20"
                      style={{
                        left: renderScale.imageFrame.left + draftStyle.left,
                        top: renderScale.imageFrame.top + draftStyle.top,
                        width: draftStyle.width,
                        height: draftStyle.height,
                      }}
                    />
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
                    {speciesClasses.map((label) => (
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
