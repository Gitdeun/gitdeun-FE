import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Share2 } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'can edit' | 'can view';
  isMe?: boolean;
}

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteModal({ open, onOpenChange }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("can view");
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  // [수정] teamMembers 상태를 업데이트할 수 있도록 setTeamMembers를 추가합니다.
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: "3", name: "오새론", email: "owner@example.com", role: "owner", isMe: true },
    { id: "4", name: "백승은", email: "baekseung@example.com", role: "can edit" }
  ]);

  // [수정] handleInvite가 이제 teamMembers 목록에 직접 추가합니다.
  const handleInvite = () => {
    if (email.trim()) {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: email.split('@')[0],
        email: email.trim(),
        role: selectedRole as 'can edit' | 'can view'
      };
      setTeamMembers(prev => [...prev, newMember]); // 이제 teamMembers 상태를 업데이트합니다.
      setEmail("");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShowCopyAlert(true);
      setTimeout(() => {
        setShowCopyAlert(false);
      }, 2000);
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-red-100 text-red-800';
      case 'can edit': return 'bg-blue-100 text-blue-800';
      case 'can view': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTeamMemberRoleChange = (memberId: string, newRole: string) => {
    setTeamMembers(prev =>
      prev.map(member =>
        member.id === memberId ? { ...member, role: newRole as 'can edit' | 'can view' } : member
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto bg-gray-100">
        <div className="relative">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-gray-900">혜택온</DialogTitle>
              <Button
                variant="ghost"
                onClick={handleShare}
                className="flex items-center gap-1 p-2 h-auto text-blue-600 hover:text-blue-700"
              >
                <Share2 className="w-4 h-4" />
                <span>공유하기</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* 초대하기 섹션 */}
            <div className="flex gap-2">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-28 bg-gray-200 border-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="can view">can view</SelectItem>
                  <SelectItem value="can edit">can edit</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="email"
                placeholder="이메일 입력"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white border-gray-300"
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />

              <Button
                onClick={handleInvite}
                disabled={!email.trim()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4"
              >
                초대하기
              </Button>
            </div>


            {/* 팀원 목록 */}
            <div className="space-y-2">
              <h4 className="text-gray-900">팀원</h4>
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <span className="text-gray-800">
                    {member.name}{member.isMe && '(나)'}
                  </span>
                  {member.role === 'owner' ? (
                    <Badge className={getRoleColor(member.role)}>
                      {member.role}
                    </Badge>
                  ) : (
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleTeamMemberRoleChange(member.id, value)}
                    >
                      <SelectTrigger className="w-28 bg-gray-200 border-none text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="can view">can view</SelectItem>
                        <SelectItem value="can edit">can edit</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}
            </div>
          </div>

          {showCopyAlert && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-md text-sm shadow-lg">
              URL 링크가 복사되었습니다
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}