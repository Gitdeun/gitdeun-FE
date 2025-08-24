import React from 'react';
import { File, Folder, FolderOpen } from 'lucide-react';
import { Badge } from '../ui/badge.tsx';

// FileItem 타입은 기존과 동일하게 사용하거나, 공유 타입 파일에서 import
interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileItem[];
  isDeleted?: boolean;
  isExpanded?: boolean;
}

interface FileListItemProps {
  item: FileItem;
  depth: number;
  isSelected: boolean;
  onFileSelect: (file: FileItem) => void;
  onToggleFolder: (id: string) => void;
}

// React.memo를 사용하여 컴포넌트를 감싸줍니다.
const FileListItem = React.memo(({ item, depth, isSelected, onFileSelect, onToggleFolder }: FileListItemProps) => {
  const handleClick = () => {
    if (item.type === 'folder') {
      onToggleFolder(item.id);
    } else {
      onFileSelect(item);
    }
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-blue-50 ${
          isSelected ? 'bg-blue-100 border-r-2 border-blue-500' : ''
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={handleClick}
      >
        {item.type === 'folder' ? (
          item.isExpanded ? <FolderOpen className="w-4 h-4 text-blue-600" /> : <Folder className="w-4 h-4 text-blue-600" />
        ) : (
          <File className="w-4 h-4 text-gray-500" />
        )}
        <span className={`text-sm flex-1 ${item.isDeleted ? 'line-through text-gray-500' : ''}`}>
          {item.name}
        </span>
        {item.isDeleted && <Badge variant="destructive" className="text-xs">삭제됨</Badge>}
      </div>

      {item.type === 'folder' && item.isExpanded && item.children && (
        <div>
          {item.children.map(child => (
            <FileListItem
              key={child.id}
              item={child}
              depth={depth + 1}
              isSelected={/* isSelected 로직을 이곳으로 전달해야 합니다 */ false}
              onFileSelect={onFileSelect}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default FileListItem;