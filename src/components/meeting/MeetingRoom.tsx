import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ParticipantsList } from './ParticipantsList';
import {
  Mic,
  MicOff,
  Phone,
  Sparkles,
  Users,
  User,
} from 'lucide-react';

interface Participant {
  id: string;
  nickname: string;
  avatar?: string;
  status: 'online' | 'speaking' | 'muted';
}

interface MeetingRoomProps {
  isActive: boolean;
  isRecording: boolean;
  onToggleMeeting: () => void;
  onToggleRecording: () => void;
}

// 음성 회의용 컨트롤 버튼
const ControlButton = ({
  Icon,
  label,
  onClick,
  variant = 'default',
}: {
  Icon: React.ElementType;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
}) => (
  <div className="flex flex-col items-center gap-1.5">
    <Button
      onClick={onClick}
      variant="ghost"
      size="icon"
      className={`
        rounded-2xl h-16 w-16 text-slate-800 bg-slate-200/80 hover:bg-slate-300/80
        ${variant === 'danger' && 'bg-red-500 hover:bg-red-600 text-white'}
      `}
    >
      <Icon className="w-7 h-7" />
    </Button>
    <span className="text-sm font-medium text-slate-700">{label}</span>
  </div>
);

// 참가자 카드 컴포넌트
const ParticipantCard = ({ participant }: { participant: Participant }) => {
    const isSpeaking = participant.status === 'speaking';
    return (
        <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className={`
                relative rounded-full p-2
                ${isSpeaking ? 'bg-green-400' : ''}
                transition-all duration-300
            `}>
                <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center">
                    {participant.avatar ? (
                        <img src={participant.avatar} alt={participant.nickname} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <User className="w-12 h-12 text-slate-500" />
                    )}
                </div>
            </div>
            <span className="font-semibold text-slate-800">{participant.nickname}</span>
        </div>
    );
};


export function MeetingRoom({
  isActive,
}: MeetingRoomProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [autoSummaryGenerated, setAutoSummaryGenerated] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(true);

  const mockParticipants: Participant[] = [
    { id: '1', nickname: '개발자김', status: 'speaking' },
    { id: '2', nickname: '기획자박', status: 'online' },
    { id: '3', nickname: '디자이너이', status: 'muted' },
    { id: '4_1', nickname: 'Frontend조', status: 'online' },
    { id: '4_2', nickname: 'Backend최', status: 'online' },
    { id: '4_3', nickname: 'Infra담당', status: 'online' },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setMeetingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setMeetingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (isActive && meetingDuration >= 60 && !autoSummaryGenerated) {
      setAutoSummaryGenerated(true);
      setTimeout(() => {
        alert('회의가 1분 경과했습니다. AI 요약이 자동 생성되었습니다!');
      }, 1000);
    }
    if (!isActive) {
      setAutoSummaryGenerated(false);
    }
  }, [isActive, meetingDuration, autoSummaryGenerated]);


  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeRecommendation = () => {
    alert('AI 코드 추천 기능이 활성화되었습니다.');
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="flex-1 flex min-h-0">
        <main className="flex-1 flex flex-col p-4 relative items-center justify-center">
          {/* 상단 정보 */}
          <div className="absolute top-6 left-6 z-10 bg-white/60 backdrop-blur-sm p-2 px-4 rounded-lg border border-slate-200/80">
              <h2 className="font-semibold text-slate-800">깃든 프로젝트 회의</h2>
              {isActive && (
                  <p className="text-xs text-slate-500">
                      진행 시간: {formatDuration(meetingDuration)}
                  </p>
              )}
          </div>

          {/* 💡 음성 회의용 참가자 그리드 */}
          <div className="w-full h-full flex flex-col items-center justify-center">
            {isActive ? (
                <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-3 gap-8 p-8 items-center justify-center">
                    {mockParticipants.map(p => <ParticipantCard key={p.id} participant={p} />)}
                </div>
            ) : (
                <div className="text-center text-slate-500">
                    <h3 className="text-2xl font-bold">회의가 아직 시작되지 않았습니다.</h3>
                    <p className="mt-2">상위 컴포넌트의 '회의 시작' 버튼을 눌러주세요.</p>
                </div>
            )}

            {/* 하단 컨트롤 바 */}
            {isActive && (
                <div className="z-10 flex justify-center pt-4">
                    <div className="flex items-start gap-6 p-4 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-lg">
                        <ControlButton Icon={isMuted ? MicOff : Mic} label={isMuted ? "음소거 해제" : "음소거"} onClick={() => setIsMuted(!isMuted)} />
                        {/* 비디오, 화면공유 버튼 제거 */}
                        <ControlButton Icon={Users} label="참가자" onClick={() => setIsParticipantsOpen(!isParticipantsOpen)} />
                        {autoSummaryGenerated && (
                            <ControlButton Icon={Sparkles} label="AI 추천" onClick={handleCodeRecommendation} />
                        )}
                        <div className="w-px h-20 bg-slate-200 mx-2"></div>
                        <ControlButton Icon={Phone} label="나가기" variant="danger" />
                    </div>
                </div>
            )}
          </div>
        </main>

        {/* 참가자 목록 사이드바 */}
        <aside className={`
          flex-shrink-0 bg-white border-l border-slate-200
          transition-all duration-300 ease-in-out
          ${isParticipantsOpen && isActive ? 'w-80 p-4' : 'w-0 p-0'}
        `}>
          {isParticipantsOpen && isActive && (
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-semibold mb-4 text-slate-800 shrink-0">참석자 ({mockParticipants.length})</h3>
              <div className="flex-1 overflow-y-auto min-h-0">
                <ParticipantsList participants={mockParticipants} />
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}