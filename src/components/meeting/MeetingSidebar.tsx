import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { MeetingSummary } from './MeetingSummary';
import { MeetingChat } from './MeetingChat';
import { MeetingHistory } from './MeetingHistory';
import { FileText, MessageCircle, Clock } from 'lucide-react';

interface MeetingSidebarProps {
  isRecording: boolean;
  isActive: boolean;
}

export function MeetingSidebar({ isRecording, isActive }: MeetingSidebarProps) {
  return (
    <div className="h-full w-full flex flex-col bg-white p-4 sm:p-6">
      <Tabs defaultValue="summary" className="flex flex-col flex-1 min-h-0">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 h-auto rounded-lg">
          <TabsTrigger value="summary" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
            <FileText className="w-4 h-4" />
            요약
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
            <MessageCircle className="w-4 h-4" />
            채팅
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
            <Clock className="w-4 h-4" />
            기록
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 mt-4 overflow-y-auto min-h-0">
          <TabsContent value="summary" className="h-full m-0">
            <MeetingSummary isRecording={isRecording} isActive={isActive} />
          </TabsContent>
          <TabsContent value="chat" className="h-full m-0">
            <MeetingChat />
          </TabsContent>
          <TabsContent value="history" className="h-full m-0">
            <MeetingHistory />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}