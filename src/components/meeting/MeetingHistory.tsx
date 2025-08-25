import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Clock, Users, FileText, Eye } from 'lucide-react';
import { Separator } from '../ui/separator';

interface MeetingRecord {
  id: string;
  date: string;
  title: string;
  duration: string;
  participants: string[];
  summary: string;
  status: 'completed' | 'in-progress';
}

const mockMeetingHistory: MeetingRecord[] = [
  {
    id: '1',
    date: '2024-08-24',
    title: 'Sprint 기획 회의',
    duration: '1시간 30분',
    participants: ['개발자김', '기획자박', '디자이너이'],
    summary: 'OAuth 2.0 인증 시스템 도입 및 UI/UX 개선 방안 논의. API 설계 변경사항 검토 완료.',
    status: 'completed'
  },
  {
    id: '2',
    date: '2024-08-23',
    title: '데이터베이스 설계 리뷰',
    duration: '45분',
    participants: ['개발자김', 'DBA최', '기획자박'],
    summary: '사용자 테이블 스키마 최적화 및 인덱스 전략 수립. 성능 개선 방안 도출.',
    status: 'completed'
  },
  {
    id: '3',
    date: '2024-08-22',
    title: 'UI 컴포넌트 리팩토링',
    duration: '1시간 15분',
    participants: ['개발자김', '디자이너이', 'Frontend조'],
    summary: '재사용 가능한 컴포넌트 라이브러리 구축 방안 및 디자인 시스템 통합 계획.',
    status: 'completed'
  }
];

export function MeetingHistory() {
  const handleViewDetails = (meetingId: string) => {
    alert(`회의 "${meetingId}" 상세 내용을 조회합니다.`);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          회의 기록
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-160 overflow-y-auto">
          {mockMeetingHistory.map((meeting, index) => (
            <div key={meeting.id}>
              <div className="space-y-3 p-3 rounded-lg border bg-card">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">{meeting.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{meeting.date}</span>
                      <span>{meeting.duration}</span>
                    </div>
                  </div>
                  <Badge variant={meeting.status === 'completed' ? 'secondary' : 'default'}>
                    {meeting.status === 'completed' ? '완료' : '진행 중'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {meeting.participants.map((participant, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {participant}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">요약</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">{meeting.summary}</p>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(meeting.id)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    상세 보기
                  </Button>
                </div>
              </div>
              {index < mockMeetingHistory.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}