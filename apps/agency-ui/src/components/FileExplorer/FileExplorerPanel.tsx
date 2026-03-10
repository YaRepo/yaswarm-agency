import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FolderTree,
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileJson,
  Image,
  File,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Loader2,
  X,
  Pencil,
  Save,
} from "lucide-react";
import api from "@/api/bridge-api";

/* ─── types ────────────────────────────────────────────────── */

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileNode[];
}

/**
 * Server TreeNode has no `path` field and uses `sizeBytes` instead of `size`.
 * This function recursively synthesizes `path` and normalizes `sizeBytes` → `size`.
 */
function normalizeTree(node: any, parentPath: string): FileNode {
  const nodePath = parentPath ? `${parentPath}/${node.name}` : node.name;
  const normalized: FileNode = {
    name: node.name,
    path: nodePath,
    type: node.type,
    size: node.sizeBytes ?? node.size,
  };
  if (node.children) {
    normalized.children = node.children.map((child: any) =>
      normalizeTree(child, nodePath),
    );
  }
  return normalized;
}

/* ─── constants ────────────────────────────────────────────── */

const ROOT_PATH = "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency";

/* ─── helpers ──────────────────────────────────────────────── */

function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function formatSize(bytes?: number): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(name: string) {
  const ext = getExtension(name);
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico"].includes(ext))
    return <Image className="w-3.5 h-3.5 text-green-400" />;
  if (["json", "jsonl"].includes(ext))
    return <FileJson className="w-3.5 h-3.5 text-yellow-400" />;
  if (["py"].includes(ext))
    return <FileCode className="w-3.5 h-3.5 text-blue-400" />;
  if (["ts", "tsx", "js", "jsx"].includes(ext))
    return <FileCode className="w-3.5 h-3.5 text-blue-400" />;
  if (["md", "txt", "rst"].includes(ext))
    return <FileText className="w-3.5 h-3.5 text-purple-400" />;
  if (["yaml", "yml", "toml"].includes(ext))
    return <FileText className="w-3.5 h-3.5 text-green-400" />;
  return <File className="w-3.5 h-3.5 text-yaswarm-muted" />;
}

function countNodes(node: FileNode): { files: number; dirs: number; size: number } {
  if (node.type === "file") return { files: 1, dirs: 0, size: node.size ?? 0 };
  let files = 0, dirs = 1, size = 0;
  for (const child of node.children ?? []) {
    const c = countNodes(child);
    files += c.files;
    dirs += c.dirs;
    size += c.size;
  }
  return { files, dirs, size };
}

/* ─── skeleton ─────────────────────────────────────────────── */

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-yaswarm-border/40 rounded ${className}`} />;
}

/* ─── tree item ────────────────────────────────────────────── */

function TreeItem({
  node,
  depth,
  expanded,
  onToggle,
  onFileClick,
}: {
  node: FileNode;
  depth: number;
  expanded: Record<string, boolean>;
  onToggle: (path: string) => void;
  onFileClick: (node: FileNode) => void;
}) {
  const isDir = node.type === "directory";
  const isOpen = expanded[node.path] ?? false;

  return (
    <>
      <div
        className="flex items-center gap-1.5 py-1 px-2 hover:bg-yaswarm-hover/50 rounded cursor-pointer transition-colors group"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => (isDir ? onToggle(node.path) : onFileClick(node))}
      >
        {isDir ? (
          <>
            {isOpen ? (
              <ChevronDown className="w-3 h-3 text-yaswarm-muted shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-yaswarm-muted shrink-0" />
            )}
            {isOpen ? (
              <FolderOpen className="w-3.5 h-3.5 text-yaswarm-accent shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-yaswarm-accent shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            {getFileIcon(node.name)}
          </>
        )}
        <span
          className={`text-xs truncate ${
            isDir ? "text-yaswarm-text font-medium" : "text-yaswarm-text"
          }`}
        >
          {node.name}
        </span>
        {node.size != null && (
          <span className="text-[10px] text-yaswarm-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {formatSize(node.size)}
          </span>
        )}
      </div>
      {isDir &&
        isOpen &&
        (node.children ?? []).map((child) => (
          <TreeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            onFileClick={onFileClick}
          />
        ))}
    </>
  );
}

/* ─── component ────────────────────────────────────────────── */

export default function FileExplorerPanel() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  const queryClient = useQueryClient();

  /* ── file tree query ───────────────────────────────────── */

  const treeQ = useQuery({
    queryKey: ["files", "tree"],
    queryFn: async () => {
      const res = await api.files.tree(ROOT_PATH);
      if (!res.ok) throw new Error(res.error ?? "Failed to load file tree");
      return res.data as FileNode | FileNode[];
    },
  });

  /* ── file content query ────────────────────────────────── */

  const contentQ = useQuery({
    queryKey: ["files", "read", selectedFile?.path],
    queryFn: async () => {
      if (!selectedFile?.path) return null;
      // Paths are already relative to AGENCY_ROOT (e.g. "config/agency-config.json")
      const res = await api.files.read(selectedFile.path);
      if (!res.ok) throw new Error(res.error ?? "Failed to read file");
      return res.data as any;
    },
    enabled: !!selectedFile?.path,
  });

  /* ── save mutation ─────────────────────────────────────── */

  const saveMutation = useMutation({
    mutationFn: async ({ filePath, content }: { filePath: string; content: string }) => {
      const res = await api.files.write(filePath, content);
      if (!res.ok) throw new Error(res.error || "Save failed");
      return res.data;
    },
    onSuccess: () => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["files", "read", selectedFile?.path] });
    },
  });

  /* ── tree as array ─────────────────────────────────────── */

  const treeNodes: FileNode[] = useMemo(() => {
    if (!treeQ.data) return [];
    const raw = Array.isArray(treeQ.data) ? treeQ.data : [treeQ.data];
    // Server returns the agency root as a single node; we want its CHILDREN
    // as top-level entries with paths relative to AGENCY_ROOT (e.g. "config/agency-config.json").
    const topChildren: FileNode[] = [];
    for (const node of raw) {
      if (node.type === "directory" && node.children) {
        for (const child of node.children) {
          topChildren.push(normalizeTree(child, ""));
        }
      } else {
        topChildren.push(normalizeTree(node, ""));
      }
    }
    return topChildren;
  }, [treeQ.data]);

  /* ── stats ─────────────────────────────────────────────── */

  const stats = useMemo(() => {
    let files = 0, dirs = 0, size = 0;
    for (const node of treeNodes) {
      const c = countNodes(node);
      files += c.files;
      dirs += c.dirs;
      size += c.size;
    }
    return { files, dirs, size };
  }, [treeNodes]);

  /* ── breadcrumb for selected file ──────────────────────── */

  const breadcrumb = useMemo(() => {
    if (!selectedFile?.path) return [];
    return selectedFile.path.split("/").filter(Boolean);
  }, [selectedFile]);

  /* ── handlers ──────────────────────────────────────────── */

  const toggleExpand = useCallback((path: string) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  }, []);

  const handleFileClick = useCallback((node: FileNode) => {
    setSelectedFile(node);
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-yaswarm-accent/10 border border-yaswarm-accent/20 flex items-center justify-center">
          <FolderTree className="w-5 h-5 text-yaswarm-accent" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-yaswarm-text">File Explorer</h2>
          <p className="text-xs text-yaswarm-muted">Browse the agency workspace filesystem</p>
        </div>
      </div>

      {/* Error */}
      {treeQ.isError && (
        <div className="yaswarm-card border-yaswarm-error/40 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yaswarm-error shrink-0" />
          <div>
            <p className="text-sm font-medium text-yaswarm-error">Failed to load file tree</p>
            <p className="text-xs text-yaswarm-muted mt-0.5">
              {treeQ.error?.message ?? "Unknown error"}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {treeQ.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="yaswarm-card">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))
        ) : (
          <>
            <div className="yaswarm-card">
              <p className="text-xs text-yaswarm-muted">Directories</p>
              <p className="text-2xl font-bold text-yaswarm-text mt-1">{stats.dirs}</p>
            </div>
            <div className="yaswarm-card">
              <p className="text-xs text-yaswarm-muted">Files</p>
              <p className="text-2xl font-bold text-yaswarm-text mt-1">{stats.files}</p>
            </div>
            <div className="yaswarm-card">
              <p className="text-xs text-yaswarm-muted">Total Size</p>
              <p className="text-2xl font-bold text-yaswarm-text mt-1">
                {formatSize(stats.size) || "--"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Main area: tree + preview */}
      <div className="flex flex-col xl:flex-row gap-4">
        {/* File tree */}
        <div className={`yaswarm-card p-2 font-mono ${selectedFile ? "w-full xl:w-1/2" : "w-full"} transition-all`}>
          {/* Root path breadcrumb */}
          <div className="border-b border-yaswarm-border/50 pb-2 mb-2 px-2">
            <span className="text-[10px] text-yaswarm-muted">{ROOT_PATH}</span>
          </div>

          {treeQ.isLoading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2" style={{ paddingLeft: `${(i % 3) * 16 + 8}px` }}>
                  <Skeleton className="w-3 h-3 rounded" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          ) : treeNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-yaswarm-muted">
              <FolderTree className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">No files found</p>
            </div>
          ) : (
            <div className="space-y-0 max-h-[60vh] overflow-y-auto">
              {treeNodes.map((node) => (
                <TreeItem
                  key={node.path}
                  node={node}
                  depth={0}
                  expanded={expanded}
                  onToggle={toggleExpand}
                  onFileClick={handleFileClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Preview pane */}
        {selectedFile && (
          <div className="yaswarm-card p-0 w-full xl:w-1/2 flex flex-col overflow-hidden">
            {/* Preview header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-yaswarm-border/50 bg-yaswarm-surface/50">
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(selectedFile.name)}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-yaswarm-text truncate">
                    {selectedFile.name}
                  </p>
                  {breadcrumb.length > 1 && (
                    <p className="text-[10px] text-yaswarm-muted truncate">
                      {breadcrumb.slice(0, -1).join(" / ")}
                    </p>
                  )}
                </div>
                {selectedFile.size != null && (
                  <span className="text-[10px] text-yaswarm-muted shrink-0 ml-2">
                    {formatSize(selectedFile.size)}
                  </span>
                )}
              </div>
              {!editing ? (
                <button
                  onClick={() => { setEditing(true); setEditContent(contentQ.data?.content ?? ""); }}
                  className="text-yaswarm-muted hover:text-yaswarm-accent transition-colors"
                  title="Edit file"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => { if (selectedFile?.path) saveMutation.mutate({ filePath: selectedFile.path, content: editContent }); }}
                  disabled={saveMutation.isPending}
                  className="text-yaswarm-muted hover:text-yaswarm-success transition-colors"
                  title="Save file"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => { setSelectedFile(null); setEditing(false); }}
                className="text-yaswarm-muted hover:text-yaswarm-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview content */}
            <div className="flex-1 overflow-auto p-4 max-h-[55vh]">
              {contentQ.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 text-yaswarm-muted animate-spin" />
                </div>
              ) : contentQ.isError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-6 h-6 text-yaswarm-error mx-auto mb-2" />
                  <p className="text-xs text-yaswarm-error">
                    {contentQ.error?.message ?? "Failed to read file"}
                  </p>
                </div>
              ) : (
                <>
                  {contentQ.data?.truncated && (
                    <div className="mb-3 px-3 py-2 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        File truncated — showing first {formatSize(contentQ.data.truncatedAt)} of {formatSize(contentQ.data.sizeBytes)}
                      </span>
                    </div>
                  )}
                  {editing ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-full min-h-[40vh] bg-transparent text-xs text-yaswarm-text font-mono resize-none outline-none"
                      spellCheck={false}
                    />
                  ) : (
                    <pre className="text-xs text-yaswarm-text font-mono whitespace-pre-wrap break-all leading-relaxed">
                      {typeof contentQ.data === "string"
                        ? contentQ.data
                        : contentQ.data?.content ?? JSON.stringify(contentQ.data, null, 2)}
                    </pre>
                  )}
                  {saveMutation.isError && (
                    <div className="mt-2 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{saveMutation.error?.message ?? "Save failed"}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
