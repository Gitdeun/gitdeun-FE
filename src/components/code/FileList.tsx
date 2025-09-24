import { GitBranch, Map } from 'lucide-react';
import { Link } from 'react-router-dom';
import FileListItem from './FileListItem.tsx';
import type { FileListProps } from "../../types.ts";

export function FileList({
  files,
  selectedFile,
  onFileSelect,
  onToggleFolder,
  emojiCountsByFileId,
  mindmapUrl,
}: FileListProps) {
  return (
    <aside className="flex flex-col h-full border-r border-blue-200 w-80 bg-blue-50/30">
      <div className="p-4 border-b border-blue-200 bg-blue-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-600" />
            <h2 className="text-blue-900">파일 탐색기</h2>
          </div>

          {mindmapUrl && (
            <Link
              to={mindmapUrl}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-blue-200 bg-white/70 text-blue-700 text-xs hover:bg-white shadow-sm"
              title="마인드맵으로"
            >
              <Map className="w-3.5 h-3.5" />
              마인드맵
            </Link>
          )}
        </div>
      </div>

      <div className="flex-1 p-2 overflow-y-auto">
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

      {mindmapUrl && (
        <div className="p-3 border-t border-blue-200 bg-blue-50/60">
          <Link
            to={mindmapUrl}
            className="inline-flex items-center justify-center w-full gap-2 px-3 py-2 text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700"
          >
            <Map className="w-4 h-4" />
            마인드맵으로
          </Link>
        </div>
      )}
    </aside>
  );
}
