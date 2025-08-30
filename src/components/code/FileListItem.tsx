// FileListItem.tsx
import React from 'react';
import { File, Folder, FolderOpen } from 'lucide-react';
import { Badge } from '../ui/badge.tsx';
import {
  EmojiType,
  EmojiTypeDetails,
  type FileListItemProps,
} from "../../types.ts";

const FileListItem = React.memo(({ item, depth, isSelected, onFileSelect, onToggleFolder, emojiCountsByFileId }: FileListItemProps) => {
  const handleClick = () => {
    if (item.type === 'folder') onToggleFolder(item.id);
    else onFileSelect(item);
  };

  const counts = item.type === 'file' ? (emojiCountsByFileId?.[item.id] ?? {}) : {};

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100 border-r-2 border-blue-500' : ''}`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={handleClick}
      >
        {item.type === 'folder'
          ? (item.isExpanded ? <FolderOpen className="w-4 h-4 text-blue-600" /> : <Folder className="w-4 h-4 text-blue-600" />)
          : <File className="w-4 h-4 text-gray-500" />
        }

        <span className={`text-sm flex-1 truncate ${item.isDeleted ? 'line-through text-gray-500' : ''}`}>
          {item.name}
        </span>

        {item.isDeleted && <Badge variant="destructive" className="text-xs">삭제됨</Badge>}

        {/* ✅ 파일명 오른쪽 이모지 배지 */}
        {item.type === 'file' && (
          <div className="ml-1 flex items-center gap-1">
            {Object.entries(counts)
              .filter(([, c]) => (c ?? 0) > 0)
              .map(([type, c]) => {
                const meta = EmojiTypeDetails[type as EmojiType];
                return (
                  <span key={type}
                        className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-700 border border-blue-100"
                        title={meta.label}>
                    <span className="mr-1">{meta.emoji}</span>{c}
                  </span>
                );
              })}
          </div>
        )}
      </div>

      {item.type === 'folder' && item.isExpanded && item.children && (
        <div>
          {item.children.map(child => (
            <FileListItem
              key={child.id}
              item={child}
              depth={depth + 1}
              isSelected={false /* 필요 시 전달 */}
              onFileSelect={onFileSelect}
              onToggleFolder={onToggleFolder}
              emojiCountsByFileId={emojiCountsByFileId}  // ✅ 재귀 전달
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default FileListItem;
