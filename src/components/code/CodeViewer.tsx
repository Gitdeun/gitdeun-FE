import  { useState } from 'react';
import { GitBranch, MessageSquare, Video } from 'lucide-react';
import { Button } from '../ui/button.tsx';
import { Badge } from '../ui/badge.tsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu.tsx';

interface CodeLine {
  number: number;
  content: string;
  type?: 'added' | 'removed' | 'normal';
  comments?: Comment[];
  emojis?: { emoji: string; count: number; users: string[] }[];
}

interface CodeViewerProps {
  file: {
    id: string;
    name: string;
    path: string;
    isDeleted?: boolean;
    content?: CodeLine[];
    branch?: string;
  } | null;
  onAddComment: (lineNumber: number, content: string) => void;
  onAddEmoji: (lineNumber: number, emoji: string) => void;
}

export function CodeViewer({ file, onAddComment, onAddEmoji }: CodeViewerProps) {
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);

  const syntaxHighlight = (text: string) => {
    return text
      .replace(/\b(function|const|let|var|if|else|for|while|return|class|interface|import|export|from|async|await)\b/g, '<span class="keyword">$1</span>')
      .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
      .replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>')
      .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
      .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
      .replace(/\b([a-zA-Z_]\w*)\s*\(/g, '<span class="function">$1</span>(');
  };

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-blue-50/20">
        <div className="text-center text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-blue-300" />
          <p>파일을 선택해주세요</p>
        </div>
      </div>
    );
  }

  if (file.isDeleted) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-blue-200 bg-blue-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-blue-900">{file.name}</h3>
              <Badge variant="destructive">삭제됨</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
                히스토리 보기
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center bg-blue-50/20">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-red-700 mb-2">파일이 삭제되었습니다</h3>
            <p className="text-gray-600 mb-4">이 파일은 더 이상 사용할 수 없습니다.</p>
            <Button variant="outline" className="text-blue-600">
              히스토리에서 이전 버전 보기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-blue-200 bg-blue-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-blue-900">{file.name}</h3>
            <div className="flex items-center gap-1 text-sm text-blue-600">
              <GitBranch className="w-4 h-4" />
              <span>{file.branch || 'main'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-gray-700 border-gray-300">
              <MessageSquare className="w-4 h-4 mr-2" />
              의견 나누기
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Video className="w-4 h-4 mr-2" />
              회의
            </Button>
          </div>
        </div>
      </div>

      {/* Code Content */}
      <div className="flex-1 overflow-auto">
        <div className="font-mono text-sm">
          {file.content?.map((line) => (
            <div
              key={line.number}
              className={`flex group relative code-line ${
                selectedLine === line.number ? 'bg-blue-100' : ''
              } ${hoveredLine === line.number ? 'bg-blue-50' : ''}`}
              onMouseEnter={() => setHoveredLine(line.number)}
              onMouseLeave={() => setHoveredLine(null)}
              onClick={() => setSelectedLine(line.number)}
            >
              <div className="w-12 text-right pr-4 py-1 text-gray-400 bg-blue-50/30 border-r border-blue-200 select-none">
                {line.number}
              </div>
              
              <div
                className="flex-1 px-4 py-1"
                dangerouslySetInnerHTML={{ __html: syntaxHighlight(line.content) }}
              />
              
              {/* Action buttons on hover */}
              {hoveredLine === line.number && (
                <div className="absolute right-2 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        😊
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {['⭐', '❤️', '👍', '🎉', '🔥'].map(emoji => (
                        <DropdownMenuItem 
                          key={emoji}
                          onClick={() => onAddEmoji(line.number, emoji)}
                        >
                          {emoji}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={() => onAddComment(line.number, '')}
                  >
                    <MessageSquare className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Emojis */}
              {line.emojis && line.emojis.length > 0 && (
                <div className="absolute right-16 top-1 flex gap-1">
                  {line.emojis.slice(0, 3).map((emojiData, index) => (
                    <div 
                      key={index}
                      className="bg-blue-100 border border-blue-200 rounded px-1 text-xs flex items-center gap-1"
                    >
                      <span>{emojiData.emoji}</span>
                      <span className="text-blue-600">{emojiData.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )) || (
            <div className="p-8 text-center text-gray-500">
              <p>파일 내용을 불러올 수 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}