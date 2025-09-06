import { GitBranch } from 'lucide-react';
import FileListItem from './FileListItem.tsx';
import type { FileListProps } from "../../types.ts";

export function FileList({
  files,
  selectedFile,
  onFileSelect,
  onToggleFolder,
  emojiCountsByFileId,
}: FileListProps) {
  return (
    <aside className="w-80 bg-blue-50/30 border-r border-blue-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-blue-200 bg-blue-100/50">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-blue-600" />
          <h2 className="text-blue-900">파일 탐색기</h2>
        </div>
      </div>

      <div className="p-2">
        {files.map(item => (
          <FileListItem
            key={item.id}
            item={item}
            depth={0}
            isSelected={selectedFile === item.id}
            onFileSelect={onFileSelect}
            onToggleFolder={onToggleFolder}
            emojiCountsByFileId={emojiCountsByFileId}
          />
        ))}
      </div>
    </aside>
  );
}
