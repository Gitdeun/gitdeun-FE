import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Users } from 'lucide-react';

interface Participant {
  id: string;
  nickname: string;
  avatar?: string;
  status: 'online' | 'speaking' | 'muted';
}

interface ParticipantsListProps {
  participants: Participant[];
}

export function ParticipantsList({ participants }: ParticipantsListProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'speaking':
        return <Badge variant="default" className="bg-green-500">발언 중</Badge>;
      case 'muted':
        return <Badge variant="secondary">음소거</Badge>;
      default:
        return <Badge variant="outline">온라인</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <h3>참석자 ({participants.length})</h3>
      </div>
      <div className="space-y-3">
        {participants.map((participant) => (
          <div key={participant.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={participant.avatar} />
                <AvatarFallback>{participant.nickname.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>{participant.nickname}</span>
            </div>
            {getStatusBadge(participant.status)}
          </div>
        ))}
      </div>
    </div>
  );
}