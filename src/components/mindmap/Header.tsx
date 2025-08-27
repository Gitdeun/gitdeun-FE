import { Button } from "../ui/button";
import { Share2, LogOut, GitBranch, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface HeaderProps {
  projectName: string;
  onInvite: () => void;
  onLeave: () => void;
}

export function Header({ projectName, onInvite, onLeave }: HeaderProps) {
  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-semibold text-primary">깃든</h1>
        </div>
        <div className="h-6 w-px bg-border" />
        <span className="text-foreground">{projectName}</span>
      </div>
      
      <div className="flex items-center gap-3">
        <Button 
          onClick={onInvite}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Share2 className="w-4 h-4 mr-2" />
          초대하기
        </Button>
        <Button 
          onClick={onLeave}
          variant="destructive"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <LogOut className="w-4 h-4 mr-2" />
          나가기
        </Button>
        
        {/* 마인드맵 설명서 */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="ml-2">
              마인드맵 설명서
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-3">
              <h4 className="font-medium mb-3">노드 색상 설명</h4>
              
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">기본 기능</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <span className="text-sm">가장 최근에 머지된 기능</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                <span className="text-sm">기존의 기능에서 더 발생할 추천</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-sky-500 rounded-full"></div>
                <span className="text-sm">아예 포함되지 않은 기능추천</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm">AI 추천</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}