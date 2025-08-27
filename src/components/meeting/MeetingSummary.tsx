import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Mic,  Sparkles, Code, FileText } from 'lucide-react';
import { Separator } from '../ui/separator';

interface SummaryItem {
  id: string;
  timestamp: string;
  speaker: string;
  content: string;
  isAiGenerated?: boolean;
}

interface MeetingSummaryProps {
  isRecording: boolean;
  isActive: boolean;
}

export function MeetingSummary({ isRecording, isActive }: MeetingSummaryProps) {
  const [summaryItems] = useState<SummaryItem[]>([
    {
      id: '1',
      timestamp: '14:30',
      speaker: '개발자김',
      content: '사용자 인증 시스템을 OAuth 2.0으로 구현하면 보안성이 높아질 것 같습니다.',
      isAiGenerated: false
    },
    {
      id: '2',
      timestamp: '14:32',
      speaker: 'AI 요약',
      content: '인증 시스템 관련 논의: OAuth 2.0 도입 검토 중',
      isAiGenerated: true
    }
  ]);

  const [currentTranscript, setCurrentTranscript] = useState('');

  useEffect(() => {
    if (isRecording && isActive) {
      const interval = setInterval(() => {
        const mockTranscripts = [
          '데이터베이스 스키마를 수정해야 할 것 같습니다.',
          'API 엔드포인트가 몇 개 더 필요할 것 같아요.',
          '프론트엔드 컴포넌트 재사용성을 높여야겠네요.',
          '테스트 코드도 함께 작성하면 좋겠습니다.'
        ];
        setCurrentTranscript(mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isRecording, isActive]);

  const handleCodeRecommendation = (content: string) => {
    // Mock AI code recommendation
    alert(`AI 코드 추천: "${content}"에 대한 코드 템플릿을 생성하시겠습니까?`);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          실시간 요약
          {isRecording && (
            <Badge variant="default" className="bg-red-500 animate-pulse">
              <Mic className="w-3 h-3 mr-1" />
              녹음 중
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 현재 음성 인식 내용 */}
        {isRecording && currentTranscript && (
          <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
            <div className="flex items-center gap-2 mb-2">
              <Mic className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-600">실시간 음성 인식</span>
            </div>
            <p className="text-sm text-gray-700">{currentTranscript}</p>
          </div>
        )}

        <Separator />

        {/* 요약 목록 */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {summaryItems.map((item) => (
            <div key={item.id} className={`p-3 rounded-lg border ${item.isAiGenerated ? 'bg-purple-50 border-purple-200' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                  <span className="text-sm font-medium">{item.speaker}</span>
                  {item.isAiGenerated && (
                    <Badge variant="outline" className="text-purple-600 border-purple-300">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI
                    </Badge>
                  )}
                </div>
                {!item.isAiGenerated && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCodeRecommendation(item.content)}
                    className="text-xs"
                  >
                    <Code className="w-3 h-3 mr-1" />
                    코드 추천
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-700">{item.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}