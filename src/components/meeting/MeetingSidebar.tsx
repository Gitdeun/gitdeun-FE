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
    <div className="w-96 bg-card border-l h-full">
      <Tabs defaultValue="summary" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3 m-4 mb-2">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            요약
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            채팅
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            기록
          </TabsTrigger>
        </TabsList>
        
        <div className="flex-1 px-4 pb-4">
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