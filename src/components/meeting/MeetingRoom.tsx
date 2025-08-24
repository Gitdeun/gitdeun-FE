import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ParticipantsList } from './ParticipantsList';
import { 
  Play, 
  Square, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Settings,
  Phone,
  Sparkles
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

export function MeetingRoom({ 
  isActive, 
  isRecording, 
  onToggleMeeting, 
  onToggleRecording 
}: MeetingRoomProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [autoSummaryGenerated, setAutoSummaryGenerated] = useState(false);

  const mockParticipants: Participant[] = [
    { id: '1', nickname: '개발자김', status: 'speaking' },
    { id: '2', nickname: '기획자박', status: 'online' },
    { id: '3', nickname: '디자이너이', status: 'muted' },
    { id: '4', nickname: 'Frontend조', status: 'online' }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setMeetingDuration(prev => {
          const newDuration = prev + 1;
          // 회의 종료 1분 이내 자동 요약 생성 시뮬레이션
          if (!autoSummaryGenerated && newDuration >= 60) {
            setAutoSummaryGenerated(true);
            setTimeout(() => {
              alert('회의가 1분 경과했습니다. AI 요약이 자동 생성되었습니다!');
            }, 1000);
          }
          return newDuration;
        });
      }, 1000);
    } else {
      setMeetingDuration(0);
      setAutoSummaryGenerated(false);
    }

    return () => clearInterval(interval);
  }, [isActive, autoSummaryGenerated]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hrs > 0 
      ? `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeRecommendation = () => {
    alert('AI 코드 추천 기능이 활성화되었습니다. 회의 내용을 분석하여 관련 코드를 추천해드리겠습니다.');
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* 회의 헤더 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-3">
                깃든 프로젝트 회의
                {isActive && (
                  <Badge variant="default" className="bg-green-500 animate-pulse">
                    진행 중
                  </Badge>
                )}
                {isRecording && (
                  <Badge variant="destructive" className="animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                    녹음 중
                  </Badge>
                )}
              </CardTitle>
              {isActive && (
                <p className="text-muted-foreground">진행 시간: {formatDuration(meetingDuration)}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {autoSummaryGenerated && (
                <Button 
                  onClick={handleCodeRecommendation}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI 코드 추천
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 회의 컨트롤 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={onToggleMeeting}
              size="lg"
              className={isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {isActive ? (
                <>
                  <Square className="w-5 h-5 mr-2" />
                  회의 종료
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  회의 시작
                </>
              )}
            </Button>

            {isActive && (
              <>
                <Button
                  onClick={() => setIsMuted(!isMuted)}
                  variant={isMuted ? "destructive" : "outline"}
                  size="lg"
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                <Button
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  variant={isVideoOff ? "destructive" : "outline"}
                  size="lg"
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </Button>

                <Button
                  onClick={onToggleRecording}
                  variant={isRecording ? "destructive" : "outline"}
                  size="lg"
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      녹음 중지
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                      녹음 시작
                    </>
                  )}
                </Button>

                <Button variant="destructive" size="lg">
                  <Phone className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 회의 공간 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 비디오 영역 */}
        <Card>
          <CardContent className="p-6">
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center text-white">
              {isActive ? (
                <div className="text-center">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>비디오 화면</p>
                  {isVideoOff && <p className="text-sm opacity-75 mt-2">카메라 꺼짐</p>}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p>회의를 시작하면 비디오가 활성화됩니다</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 참석자 목록 */}
        <Card>
          <CardContent className="p-6">
            <ParticipantsList participants={isActive ? mockParticipants : []} />
          </CardContent>
        </Card>
      </div>

      {/* 스크린 공유 영역 */}
      {isActive && (
        <Card>
          <CardHeader>
            <CardTitle>화면 공유</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center text-gray-500">
                <p>공유된 화면이 여기에 표시됩니다</p>
                <Button variant="outline" className="mt-2">
                  화면 공유 시작
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}