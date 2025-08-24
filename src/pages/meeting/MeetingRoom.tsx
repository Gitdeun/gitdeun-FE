import { useState } from 'react';
import { MeetingRoom } from '../../components/meeting/MeetingRoom';
import { MeetingSidebar } from '../../components/meeting/MeetingSidebar';
import { Toaster } from '../../components/ui/sonner';

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleToggleMeeting = () => {
    setIsActive(!isActive);
    if (isActive) {
      setIsRecording(false);
    }
  };

  const handleToggleRecording = () => {
    if (isActive) {
      setIsRecording(!isRecording);
    }
  };

  return (
    <div className="h-screen flex bg-background">
      <MeetingRoom
        isActive={isActive}
        isRecording={isRecording}
        onToggleMeeting={handleToggleMeeting}
        onToggleRecording={handleToggleRecording}
      />
      <MeetingSidebar
        isRecording={isRecording}
        isActive={isActive}
      />
      <Toaster />
    </div>
  );
}