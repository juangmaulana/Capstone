"use client";

import { ChangeEvent, MouseEvent, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  PencilRuler,
  Plus,
  SquareDashedMousePointer,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";

const SPECIES_CLASSES = [
  "Acacia nilotica",
  "Ageratum conyzoides",
  "Chromolaena odorata",
  "Lantana camara",
  "Mikania micrantha",
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
          status: "pending",
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

    if (activeItem.boxes.length > 0) {
      onLog?.("success", "Annotation", `Annotated image ${activeItem.filename}`);
    }
  };

  const validateAnnotation = () => {
    if (!activeItem || activeItem.boxes.length === 0) return;

    setItemValue(activeItem.id, (item) => ({
      ...item,
      status: "validated",
      validatedBy: adminName,
      validatedAt: toDateLabel(),
    }));

    onLog?.("success", "Annotation", `Validated annotation for image ${activeItem.filename}`);
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

      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-900">Incremental Learning Annotation</p>
          <p className="text-xs text-blue-700 mt-1">
            Upload batch image, gambar bounding box, simpan anotasi, validasi oleh admin, lalu export YOLO + ZIP image.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-1 rounded-lg border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Batch Dataset</h3>
              <button
                onClick={exportBatchYoloZip}
                disabled={isExporting || !activeBatch}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                {isExporting ? "Export..." : "Export YOLO"}
              </button>
            </div>
          </div>

          <div className="p-3 space-y-2 border-b">
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
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                    isActive ? "border-primary bg-primary/5" : "hover:bg-muted"
                  }`}
                >
                  <p className="text-sm font-medium">{batch.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{batch.period}</p>
                  <p className="text-[11px] mt-1 text-muted-foreground">{batch.items.length} image • {countValidated} validated</p>
                </button>
              );
            })}
          </div>

          <div className="p-3">
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
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Upload className="h-4 w-4" />
              Upload Images to Batch
            </button>
          </div>

          <div className="border-t px-3 py-2 max-h-72 overflow-y-auto">
            <p className="text-xs font-semibold mb-2 text-muted-foreground">Images</p>
            <div className="space-y-2">
              {activeBatch?.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveItemId(item.id);
                    setSelectedBoxId(null);
                    setDraftBox(null);
                  }}
                  className={`w-full rounded-md border px-2 py-2 text-left text-xs transition-colors ${
                    activeItemId === item.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                  }`}
                >
                  <p className="font-medium truncate">{item.filename}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyles[item.status]}`}>
                      {item.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{item.boxes.length} box</span>
                  </div>
                </button>
              ))}
              {!activeBatch?.items.length && (
                <p className="text-xs text-muted-foreground">Belum ada image di batch ini.</p>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-4">
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Interactive Bounding Box Editor</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mode draw untuk tambah box baru, mode select untuk edit box terpilih.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setMode("draw")}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    mode === "draw" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <SquareDashedMousePointer className="h-3.5 w-3.5" />
                  Draw
                </button>
                <button
                  onClick={() => setMode("select")}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    mode === "select" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <PencilRuler className="h-3.5 w-3.5" />
                  Select/Edit
                </button>
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  <select
                    value={selectedClass}
                    onChange={(event) => setSelectedClass(event.target.value)}
                    className="h-8 rounded-md border bg-background px-2 text-xs"
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
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Save Annotation
                </button>
                <button
                  onClick={validateAnnotation}
                  disabled={!activeItem || activeItem.boxes.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Validate
                </button>
              </div>
            </div>

            <div className="p-4">
              {!activeItem && (
                <div className="h-[420px] rounded-lg border border-dashed bg-muted/20 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-10 w-10 mx-auto mb-2" />
                    <p className="text-sm">Pilih image di sisi kiri untuk mulai anotasi.</p>
                  </div>
                </div>
              )}

              {activeItem && (
                <div
                  ref={stageRef}
                  className="relative w-full h-[420px] rounded-lg border bg-black/5 overflow-hidden select-none"
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
            <h4 className="text-sm font-semibold">Box Properties</h4>
            {!selectedBox && (
              <p className="text-xs text-muted-foreground mt-2">
                Pilih bounding box untuk mengedit koordinat, class, atau hapus box.
              </p>
            )}

            {selectedBox && activeItem && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">Class</label>
                  <select
                    value={selectedBox.className}
                    onChange={(event) => updateSelectedBoxValue("className", event.target.value)}
                    className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm"
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
                    <label className="text-[11px] font-medium text-muted-foreground capitalize">{field}</label>
                    <input
                      type="number"
                      min={0}
                      value={Math.round(value)}
                      onChange={(event) => updateSelectedBoxValue(field, Number(event.target.value))}
                      className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm"
                    />
                  </div>
                ))}

                <div className="md:col-span-5 flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    Item status: <span className="font-medium text-foreground">{activeItem.status}</span>
                    {activeItem.validatedBy && activeItem.validatedAt && (
                      <span> • validated by {activeItem.validatedBy} ({activeItem.validatedAt})</span>
                    )}
                  </p>
                  <button
                    onClick={deleteSelectedBox}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
