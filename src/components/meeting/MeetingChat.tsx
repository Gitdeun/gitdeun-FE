import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { MessageCircle, Send, Reply } from 'lucide-react';
import { Separator } from '../ui/separator';

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  avatar?: string;
  replies?: ChatMessage[];
}

export function MeetingChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: '기획자박',
      content: '회의 자료 공유드렸습니다. 확인 부탁드려요!',
      timestamp: '14:25',
      replies: [
        {
          id: '1-1',
          sender: '개발자김',
          content: '확인했습니다. 기술적으로 구현 가능할 것 같아요.',
          timestamp: '14:26'
        }
      ]
    },
    {
      id: '2',
      sender: '디자이너이',
      content: 'UI 목업도 준비해서 곧 올려드릴게요.',
      timestamp: '14:28'
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: '나',
      content: newMessage,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };

    if (replyTo) {
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === replyTo
            ? { ...msg, replies: [...(msg.replies || []), message] }
            : msg
        )
      );
      setReplyTo(null);
    } else {
      setMessages(prev => [...prev, message]);
    }

    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          채팅
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* 메시지 목록 */}
        <div className="flex-1 space-y-4 overflow-y-auto mb-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={message.avatar} />
                  <AvatarFallback>{message.sender.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{message.sender}</span>
                    <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                  </div>
                  <p className="text-sm bg-muted p-2 rounded-lg">{message.content}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyTo(message.id)}
                    className="text-xs h-6"
                  >
                    <Reply className="w-3 h-3 mr-1" />
                    답글
                  </Button>
                </div>
              </div>

              {/* 답글들 */}
              {message.replies && message.replies.length > 0 && (
                <div className="ml-11 space-y-2">
                  <Separator />
                  {message.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-3">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={reply.avatar} />
                        <AvatarFallback className="text-xs">{reply.sender.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{reply.sender}</span>
                          <span className="text-xs text-muted-foreground">{reply.timestamp}</span>
                        </div>
                        <p className="text-sm bg-blue-50 p-2 rounded-lg">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 메시지 입력 */}
        <div className="space-y-2">
          {replyTo && (
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded text-sm">
              <span>답글 작성 중...</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="메시지를 입력하세요..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button onClick={handleSendMessage} size="sm">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}