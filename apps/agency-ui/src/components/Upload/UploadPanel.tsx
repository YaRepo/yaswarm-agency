import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  FileUp,
  FileText,
  Image,
  File,
  Check,
  X,
  Inbox,
  MessageSquare,
  Brain,
  Database,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { vector, files, memory } from "@/api/bridge-api";

/* ─── types ────────────────────────────────────────────────── */

type Destination = "workspace" | "chat" | "memory" | "vector";

interface QueuedFile {
  id: string;
  file: File;
  destination: Destination;
  progress: number;
  status: "pending" | "uploading" | "embedding" | "done" | "error";
  /** Server-assigned job ID for vector uploads */
  jobId?: string;
  /** Total chunks being embedded */
  chunks?: number;
  /** Chunks indexed so far */
  indexed?: number;
  /** Error message */
  errorMsg?: string;
}

/* ─── helpers ──────────────────────────────────────────────── */

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"].includes(ext))
    return <Image className="w-4 h-4 text-green-400" />;
  if (["pdf"].includes(ext))
    return <FileText className="w-4 h-4 text-red-400" />;
  if (["doc", "docx"].includes(ext))
    return <FileText className="w-4 h-4 text-blue-400" />;
  if (["md", "txt"].includes(ext))
    return <FileText className="w-4 h-4 text-purple-400" />;
  if (["json", "yaml", "yml", "toml", "jsonl"].includes(ext))
    return <FileText className="w-4 h-4 text-yellow-400" />;
  if (["py", "ts", "js", "tsx", "jsx", "sh", "sql", "go", "rs"].includes(ext))
    return <FileText className="w-4 h-4 text-cyan-400" />;
  return <File className="w-4 h-4 text-yaswarm-muted" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const destinations: {
  key: Destination;
  label: string;
  sub: string;
  icon: typeof Inbox;
}[] = [
  { key: "vector", label: "Vector Database", sub: "Embed & index for semantic search", icon: Database },
  { key: "workspace", label: "Workspace", sub: "desk/inbox", icon: Inbox },
  { key: "chat", label: "Chat Attachment", sub: "Attach to conversation", icon: MessageSquare },
  { key: "memory", label: "Memory Injection", sub: "Inject into memory stream", icon: Brain },
];

/* ─── component ────────────────────────────────────────────── */

export default function UploadPanel() {
  const [destination, setDestination] = useState<Destination>("vector");
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      pollingRef.current.forEach((iv) => clearInterval(iv));
      pollingRef.current.clear();
    };
  }, []);

  /** Poll vector upload job status until done/error */
  const pollJobStatus = useCallback((queueId: string, jobId: string) => {
    const iv = setInterval(async () => {
      const res = await vector.uploadStatus(jobId);
      if (!res.ok) return;

      const job = res.data!;
      setQueue((prev) =>
        prev.map((q) => {
          if (q.id !== queueId) return q;
          if (job.status === "done") {
            clearInterval(iv);
            pollingRef.current.delete(queueId);
            return {
              ...q,
              status: "done" as const,
              progress: 100,
              indexed: job.indexed,
              chunks: job.chunks,
            };
          } else if (job.status === "error") {
            clearInterval(iv);
            pollingRef.current.delete(queueId);
            return {
              ...q,
              status: "error" as const,
              progress: 0,
              errorMsg: job.error || "Indexing failed",
            };
          }
          // Still processing
          const pct = job.chunks > 0 ? Math.round((job.indexed / job.chunks) * 90) + 10 : 50;
          return { ...q, progress: pct, chunks: job.chunks, indexed: job.indexed };
        }),
      );
    }, 2000);
    pollingRef.current.set(queueId, iv);
  }, []);

  /** Upload a file to the vector database */
  const uploadToVector = useCallback(
    async (item: QueuedFile) => {
      // Mark as uploading
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: "uploading" as const, progress: 5 } : q,
        ),
      );

      // Send file to server
      const uploadRes = await vector.upload(item.file);

      if (!uploadRes.ok) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: "error" as const, progress: 0, errorMsg: uploadRes.error }
              : q,
          ),
        );
        return;
      }

      const { fileId, chunks } = uploadRes.data;

      // Mark as embedding
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                status: "embedding" as const,
                progress: 10,
                jobId: fileId,
                chunks,
              }
            : q,
        ),
      );

      // Start polling for completion
      pollJobStatus(item.id, fileId);
    },
    [pollJobStatus],
  );

  /** Upload a file to the workspace (desk/inbox) */
  const uploadToWorkspace = useCallback(async (item: QueuedFile) => {
    setQueue((prev) =>
      prev.map((q) =>
        q.id === item.id ? { ...q, status: "uploading" as const, progress: 5 } : q,
      ),
    );

    const res = await files.upload(item.file);

    if (res.ok) {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: "done" as const, progress: 100 } : q,
        ),
      );
    } else {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: "error" as const, progress: 0, errorMsg: res.error } : q,
        ),
      );
    }
  }, []);

  /** Upload a file to memory injection */
  const uploadToMemory = useCallback(async (item: QueuedFile) => {
    setQueue((prev) =>
      prev.map((q) =>
        q.id === item.id ? { ...q, status: "uploading" as const, progress: 5 } : q,
      ),
    );

    const formData = new FormData();
    formData.append("file", item.file);
    const res = await memory.inject(formData);

    if (res.ok) {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: "done" as const, progress: 100 } : q,
        ),
      );
    } else {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: "error" as const, progress: 0, errorMsg: res.error } : q,
        ),
      );
    }
  }, []);

  /** Mock upload for chat destination (no real backend) */
  const mockUpload = useCallback((item: QueuedFile) => {
    let progress = 0;
    const iv = setInterval(() => {
      progress += Math.random() * 30 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(iv);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, progress: 100, status: "done" as const } : q,
          ),
        );
      } else {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, progress: Math.min(progress, 99), status: "uploading" as const }
              : q,
          ),
        );
      }
    }, 400);
  }, []);

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const newItems: QueuedFile[] = Array.from(files).map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        destination,
        progress: 0,
        status: "pending" as const,
      }));
      setQueue((prev) => [...newItems, ...prev]);

      // Process each file
      newItems.forEach((item) => {
        if (destination === "vector") {
          uploadToVector(item);
        } else if (destination === "workspace") {
          uploadToWorkspace(item);
        } else if (destination === "memory") {
          uploadToMemory(item);
        } else {
          mockUpload(item); // chat only
        }
      });
    },
    [destination, uploadToVector, uploadToWorkspace, uploadToMemory, mockUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const removeItem = (id: string) => {
    // Clean up polling if active
    const iv = pollingRef.current.get(id);
    if (iv) {
      clearInterval(iv);
      pollingRef.current.delete(id);
    }
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const statusLabel = (item: QueuedFile) => {
    if (item.status === "done") return "done";
    if (item.status === "error") return "failed";
    if (item.status === "embedding") {
      if (item.chunks) return `embedding ${item.indexed || 0}/${item.chunks}`;
      return "embedding...";
    }
    if (item.status === "uploading") return `${Math.round(item.progress)}%`;
    return "queued";
  };

  const statusBadgeClass = (item: QueuedFile) => {
    if (item.status === "done") return "yaswarm-badge-success";
    if (item.status === "error") return "yaswarm-badge-error";
    if (item.status === "embedding") return "yaswarm-badge-warning";
    return "yaswarm-badge-info";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-yaswarm-accent/10 border border-yaswarm-accent/20 flex items-center justify-center">
          <Upload className="w-5 h-5 text-yaswarm-accent" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-yaswarm-text">File Upload</h2>
          <p className="text-xs text-yaswarm-muted">
            Upload files to the agency workspace, vector database, or attach to chat
          </p>
        </div>
      </div>

      {/* Destination selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {destinations.map((d) => {
          const active = destination === d.key;
          return (
            <button
              key={d.key}
              onClick={() => setDestination(d.key)}
              className={`yaswarm-card text-left cursor-pointer transition-colors ${
                active
                  ? "border-yaswarm-accent/50 bg-yaswarm-accent/[0.06]"
                  : "hover:border-yaswarm-accent/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <d.icon
                  className={`w-4 h-4 ${active ? "text-yaswarm-accent" : "text-yaswarm-muted"}`}
                />
                <p
                  className={`text-sm font-medium ${
                    active ? "text-yaswarm-accent" : "text-yaswarm-text"
                  }`}
                >
                  {d.label}
                </p>
              </div>
              <p className="text-[10px] text-yaswarm-muted">{d.sub}</p>
            </button>
          );
        })}
      </div>

      {/* Vector DB info banner */}
      {destination === "vector" && (
        <div className="yaswarm-card bg-yaswarm-accent/[0.04] border-yaswarm-accent/20">
          <div className="flex items-start gap-2">
            <Database className="w-4 h-4 text-yaswarm-accent mt-0.5 shrink-0" />
            <div className="text-xs text-yaswarm-muted space-y-1">
              <p>
                <span className="text-yaswarm-text font-medium">Vector Database Upload</span> —
                Files are automatically chunked, embedded using all-MiniLM-L6-v2, and indexed
                into ChromaDB for semantic search.
              </p>
              <p>
                Supported formats: <span className="text-yaswarm-text">.txt, .md, .json, .jsonl, .yaml, .csv, .py, .ts, .js, .sh, .sql, .log</span> and other text-based files.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`yaswarm-card border-dashed border-2 transition-colors cursor-pointer ${
          dragOver
            ? "border-yaswarm-accent bg-yaswarm-accent/[0.06]"
            : "border-yaswarm-border hover:border-yaswarm-accent/40"
        }`}
      >
        <div className="flex flex-col items-center justify-center py-12">
          <div
            className={`w-16 h-16 rounded-full border flex items-center justify-center mb-4 transition-colors ${
              dragOver
                ? "bg-yaswarm-accent/10 border-yaswarm-accent/40"
                : "bg-yaswarm-surface border-yaswarm-border"
            }`}
          >
            <FileUp
              className={`w-7 h-7 ${dragOver ? "text-yaswarm-accent" : "text-yaswarm-muted"}`}
            />
          </div>
          <p className="text-sm font-medium text-yaswarm-text">
            {dragOver ? "Drop files to upload" : "Drop files here or click to browse"}
          </p>
          <p className="text-xs text-yaswarm-muted mt-1">
            {destination === "vector"
              ? "Text-based files will be embedded and indexed for semantic search"
              : "Supports any file type — PDF, DOCX, MD, images, code, and more"}
          </p>
          <p className="text-[10px] text-yaswarm-muted mt-3">Max file size: 10 MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Upload queue */}
      <div>
        <p className="text-sm font-medium text-yaswarm-text mb-3">
          {queue.length > 0 ? "Uploads" : "Recent Uploads"}
        </p>

        {queue.length === 0 ? (
          <div className="yaswarm-card flex flex-col items-center justify-center py-10">
            <Upload className="w-8 h-8 text-yaswarm-muted/40 mb-3" />
            <p className="text-sm text-yaswarm-muted">No uploads yet</p>
            <p className="text-[10px] text-yaswarm-muted mt-1">
              Drag and drop files above or click to browse
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {queue.map((item) => (
              <div key={item.id} className="yaswarm-card flex items-center gap-3 py-3">
                {/* Icon / spinner */}
                {item.status === "embedding" ? (
                  <Loader2 className="w-4 h-4 text-yaswarm-accent animate-spin" />
                ) : item.status === "uploading" && item.destination === "vector" ? (
                  <Loader2 className="w-4 h-4 text-yaswarm-muted animate-spin" />
                ) : item.status === "error" ? (
                  <AlertCircle className="w-4 h-4 text-yaswarm-error" />
                ) : (
                  fileIcon(item.file.name)
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-yaswarm-text font-mono truncate">
                      {item.file.name}
                    </p>
                    {item.status === "done" && (
                      <Check className="w-3.5 h-3.5 text-yaswarm-success shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-yaswarm-muted">
                      {formatSize(item.file.size)}
                    </p>
                    <span className="text-[10px] text-yaswarm-muted">&middot;</span>
                    <p className="text-[10px] text-yaswarm-muted capitalize">
                      {item.destination === "vector" ? "vector db" : item.destination}
                    </p>
                    {item.destination === "vector" && item.chunks && item.status === "done" && (
                      <>
                        <span className="text-[10px] text-yaswarm-muted">&middot;</span>
                        <p className="text-[10px] text-yaswarm-success">
                          {item.indexed || item.chunks} chunks indexed
                        </p>
                      </>
                    )}
                  </div>

                  {/* Error message */}
                  {item.status === "error" && item.errorMsg && (
                    <p className="text-[10px] text-yaswarm-error mt-1 truncate" title={item.errorMsg}>
                      {item.errorMsg}
                    </p>
                  )}

                  {/* Progress bar */}
                  {item.status !== "done" && item.status !== "error" && (
                    <div className="mt-1.5 w-full bg-yaswarm-surface rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.status === "embedding"
                            ? "bg-yaswarm-accent animate-pulse"
                            : "bg-yaswarm-accent"
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                <span className={statusBadgeClass(item)}>
                  {statusLabel(item)}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item.id);
                  }}
                  className="text-yaswarm-muted hover:text-yaswarm-error transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
