// FileList.tsx
import { GitBranch } from 'lucide-react';
import FileListItem from './FileListItem.tsx';

// 💡 1. FileItem 타입을 정의합니다. (또는 types.ts 파일에서 import)
interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileItem[];
  isDeleted?: boolean;
  isExpanded?: boolean;
}

// 💡 2. FileListProps 타입을 정의하여 오류를 해결합니다.
interface FileListProps {
  files: FileItem[];
  selectedFile: string | null;
  onFileSelect: (file: FileItem) => void;
  onToggleFolder: (id: string) => void;
}

export function FileList({ files, selectedFile, onFileSelect, onToggleFolder }: FileListProps) {
  return (
    <div className="w-80 bg-blue-50/30 border-r border-blue-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-blue-200 bg-blue-100/50">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-blue-600" />
          <h2 className="text-blue-900">파일 탐색기</h2>
        </div>
      </div>

      <div className="p-2">
        {/* 이제 'item'의 타입이 FileItem으로 정확히 추론됩니다. */}
        {files.map(item => (
          <FileListItem
            key={item.id}
            item={item}
            depth={0}
            isSelected={selectedFile === item.id}
            onFileSelect={onFileSelect}
            onToggleFolder={onToggleFolder}
          />
        ))}
      </div>
    </div>
  );
}