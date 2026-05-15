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
  X,
} from "lucide-react";

const SPECIES_CLASSES = [
  "Vachellia nilotica",
  "Ageratum conyzoides",
  "Clitoria ternatea",
  "Lantana camara",
  "Merremia hederacea",
  "Unknown",
];

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

const readImageSize = (url: string) =>
  new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
    img.onerror = () => resolve({ width: 1280, height: 720 });
    img.src = url;
  });

export function AdminDataAnnotationPanel({ adminName, onLog }: Props) {
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
      return { scaleX: 1, scaleY: 1, stageWidth: 1, stageHeight: 1 };
    }

    return {
      scaleX: rect.width / activeItem.imageWidth,
      scaleY: rect.height / activeItem.imageHeight,
      stageWidth: rect.width,
      stageHeight: rect.height,
    };
  };

  const toStagePoint = (event: MouseEvent<HTMLDivElement>) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return null;

    return {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height),
    };
  };

  const setItemValue = (
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
  };

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
          .filter(
            (det) =>
              det.box &&
              det.box.width > 0 &&
              det.box.height > 0
          )
          .map((det, idx) => {
            // Map detected name to one of the known SPECIES_CLASSES
            const matchedClass = SPECIES_CLASSES.find(
              (cls) => cls.toLowerCase() === det.name.toLowerCase()
            ) || det.name;

            return {
              id: Date.now() + idx,
              className: matchedClass,
              x: det.box.x1,
              y: det.box.y1,
              width: det.box.width,
              height: det.box.height,
            };
          });

        // Update the item with AI detection results
        setItemValue(item.id, (prev) => ({
          ...prev,
          boxes: newBoxes.length > 0 ? newBoxes : prev.boxes,
          aiDetected: true,
          aiSpecies: topDetection.name,
          aiConfidence: topDetection.confidence,
          status: newBoxes.length > 0 ? "annotated" : prev.status,
        }));

        // Auto-select detected species in class dropdown
        const matchedTopClass = SPECIES_CLASSES.find(
          (cls) => cls.toLowerCase() === topDetection.name.toLowerCase()
        );
        if (matchedTopClass) {
          setSelectedClass(matchedTopClass);
        }

        if (newBoxes.length > 0) {
          setSelectedBoxId(newBoxes[0].id);
        }

        onLog?.("info", "AI Detection", `Detected ${topDetection.name} (${Math.round(topDetection.confidence * 100)}%) in ${item.filename}`);
      } else {
        // No detection — mark as detected but with no results
        setItemValue(item.id, (prev) => ({
          ...prev,
          aiDetected: true,
          aiSpecies: undefined,
          aiConfidence: undefined,
        }));
        onLog?.("warning", "AI Detection", `No plant detected in ${item.filename}`);
      }
    } catch (err) {
      console.error("AI detection failed:", err);
      setDetectionError("AI detection gagal. Silakan coba lagi.");
      onLog?.("error", "AI Detection", `Detection failed for ${item.filename}`);
    } finally {
      setIsDetecting(false);
    }
  }, [onLog, setItemValue]);

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
    onLog?.("info", "Annotation", `Cleared AI prediction for item`);
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
    const point = toStagePoint(event);
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

    onLog?.("success", "Annotation", `Saved annotation for image ${activeItem.filename}`);
    setSuccessNotice({
      title: "Annotation Berhasil Disimpan",
      message: `Perubahan untuk ${activeItem.filename} sudah disimpan. Anda bisa lanjut menggambar box atau pilih image lain.`,
      buttonLabel: "Lanjut Anotasi",
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

    onLog?.("success", "Verification", `Validated annotation for image ${activeItem.filename}`);
    setSuccessNotice({
      title: "Annotation Berhasil Divalidasi",
      message: `Data untuk ${activeItem.filename} sudah divalidasi dan siap diexport.`,
      buttonLabel: "Selesai",
    });
  };

  const exportBatchYoloZip = async () => {
    if (!activeBatch) return;

    const exportItems = activeBatch.items.filter((item) => item.status === "validated" && item.boxes.length > 0);
    if (!exportItems.length) {
      window.alert("Belum ada item validated dengan bounding box.");
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
      window.alert("Gagal export ZIP. Coba ulangi lagi.");
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
          <p className="text-sm text-muted-foreground">Total Batch</p>
          <p className="text-2xl font-bold mt-1">{batches.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Pending Annotation</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{totalPending}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Validated Ready</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{totalValidated}</p>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-base font-semibold text-blue-950">Panduan cepat</p>
            <p className="mt-1 text-sm text-blue-800">
              Ikuti urutan di bawah agar anotasi lebih mudah dibaca dan tidak membingungkan.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            "1. Pilih batch dan image yang ingin dikerjakan.",
            "2. Gambar kotak pada objek yang terlihat jelas.",
            "3. Klik Save Annotation untuk menyimpan perubahan.",
            "4. Klik Validate jika data sudah benar.",
          ].map((step) => (
            <div key={step} className="rounded-lg border bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm">
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Batch Dataset</h3>
                <p className="text-xs text-muted-foreground">Pilih batch lalu lanjutkan anotasi.</p>
              </div>
              <button
                onClick={exportBatchYoloZip}
                disabled={isExporting || !activeBatch}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Exporting..." : "Export YOLO"}
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
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                    isActive ? "border-primary bg-primary/5" : "hover:bg-muted"
                  }`}
                >
                  <p className="text-sm font-semibold">{batch.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{batch.period}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{batch.items.length} image • {countValidated} validated</p>
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
              Upload Images to Batch
            </button>
          </div>

          <div className="border-t px-4 py-4 max-h-80 overflow-y-auto">
            <p className="mb-3 text-sm font-semibold text-muted-foreground">Images</p>
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
                  className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                    activeItemId === item.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                  }`}
                >
                  <p className="font-semibold truncate">{item.filename}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[item.status]}`}>
                      {item.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.boxes.length} box</span>
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
                <p className="text-sm text-muted-foreground">Belum ada image di batch ini.</p>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-4">
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex flex-col gap-4 border-b px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-base font-semibold">Interactive Bounding Box Editor</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  1) Pilih mode. 2) Gambar box. 3) Simpan. 4) Validasi.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setMode("draw")}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium ${
                    mode === "draw" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <SquareDashedMousePointer className="h-4 w-4" />
                  Draw
                </button>
                <button
                  onClick={() => setMode("select")}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium ${
                    mode === "select" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <PencilRuler className="h-4 w-4" />
                  Select/Edit
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
                  Save Annotation
                </button>
                <button
                  onClick={validateAnnotation}
                  disabled={!activeItem || activeItem.boxes.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Validate
                </button>
              </div>
            </div>

            <div className="p-5">
              {!activeItem && (
                <div className="flex h-[520px] items-center justify-center rounded-xl border border-dashed bg-muted/20">
                  <div className="max-w-md text-center text-muted-foreground">
                    <ImageIcon className="mx-auto mb-3 h-12 w-12" />
                    <p className="text-base font-medium text-foreground">Pilih image di sisi kiri untuk mulai anotasi.</p>
                    <p className="mt-2 text-sm leading-relaxed">
                      Setelah image dipilih, gambar kotak pada objek lalu tekan Save Annotation.
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
                      <span className="text-sm font-medium animate-pulse">AI sedang mendeteksi tanaman...</span>
                      <span className="text-xs text-muted-foreground mt-1">Menghubungi AI detection service</span>
                    </div>
                  )}

                  {/* AI Detection result badge */}
                  {activeItem.aiDetected && activeItem.aiSpecies && !isDetecting && (
                    <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-xl border bg-background/90 px-3 py-2 shadow-lg backdrop-blur-md">
                      <ScanSearch className="h-4 w-4 text-primary" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{activeItem.aiSpecies}</span>
                        <span className="text-xs text-muted-foreground">{Math.round((activeItem.aiConfidence ?? 0) * 100)}% confidence</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearAiPrediction(activeItem.id);
                        }}
                        className="ml-1 rounded-full p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Hapus prediksi AI"
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
                    const { scaleX, scaleY } = getScale();
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
                        className={`absolute border-2 text-left ${
                          isSelected ? "border-yellow-400" : "border-lime-400"
                        } bg-lime-400/15`}
                        style={{
                          left: box.x * scaleX,
                          top: box.y * scaleY,
                          width: box.width * scaleX,
                          height: box.height * scaleY,
                        }}
                      >
                        <span className="absolute -top-5 left-0 rounded bg-black/75 px-1.5 py-0.5 text-[10px] text-white">
                          {box.className}
                        </span>
                      </button>
                    );
                  })}

                  {draftStyle && (
                    <div
                      className="absolute border-2 border-cyan-400 bg-cyan-300/20"
                      style={{
                        left: draftStyle.left,
                        top: draftStyle.top,
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
            <h4 className="text-base font-semibold">Box Properties</h4>
            {!selectedBox && (
              <p className="mt-2 text-sm text-muted-foreground">
                Pilih bounding box untuk mengedit koordinat, class, atau hapus box.
              </p>
            )}

            {selectedBox && activeItem && (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Class</label>
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
                    Item status: <span className="font-medium text-foreground">{activeItem.status}</span>
                    {activeItem.validatedBy && activeItem.validatedAt && (
                      <span> • validated by {activeItem.validatedBy} ({activeItem.validatedAt})</span>
                    )}
                  </p>
                  <button
                    onClick={deleteSelectedBox}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Box
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
