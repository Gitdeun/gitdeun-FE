import { useState } from "react";
import type { FileItem } from "../../types.ts";
import { ChevronRight, ChevronDown, File, Folder } from "lucide-react";
import { cn } from "../ui/utils";

interface FileSidebarProps {
  files: FileItem[];
  selectedFile?: string;
  onFileSelect: (filePath: string) => void;
}

export function FileSidebar({ files, selectedFile, onFileSelect }: FileSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (items: FileItem[], level = 0) => {
    return items.map((item) => (
      <div key={item.path}>
        <div
          className={cn(
            "flex items-center gap-2 py-1 px-2 hover:bg-accent/50 cursor-pointer rounded-sm",
            selectedFile === item.path && "bg-accent text-accent-foreground",
            "ml-" + (level * 4)
          )}
          onClick={() => {
            if (item.type === 'folder') {
              toggleFolder(item.path);
            } else {
              onFileSelect(item.path);
            }
          }}
        >
          {item.type === 'folder' ? (
            <>
              {expandedFolders.has(item.path) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Folder className="w-4 h-4 text-blue-500" />
            </>
          ) : (
            <>
              <div className="w-4" />
              <File className="w-4 h-4 text-gray-500" />
            </>
          )}
          <span className="truncate">{item.name}</span>
        </div>
        {item.type === 'folder' && expandedFolders.has(item.path) && item.children && (
          <div>
            {renderFileTree(item.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border p-4 overflow-y-auto">
      <h3 className="mb-4 text-sidebar-foreground">파일 구조</h3>
      <div className="space-y-1">
        {renderFileTree(files)}
      </div>
    </div>
  );
}