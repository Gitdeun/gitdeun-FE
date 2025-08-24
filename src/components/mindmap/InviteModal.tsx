import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Share2, ChevronDown } from "lucide-react";

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
  const [invitedUsers, setInvitedUsers] = useState<TeamMember[]>([
    { id: "1", name: "사용자1", email: "user1@example.com", role: "can view" },
    { id: "2", name: "장욱", email: "jangwook@example.com", role: "can view" }
  ]);
  const [teamMembers] = useState<TeamMember[]>([
    { id: "3", name: "오새론", email: "owner@example.com", role: "owner", isMe: true },
    { id: "4", name: "백승은", email: "baekseung@example.com", role: "can edit" }
  ]);

  const handleInvite = () => {
    if (email.trim()) {
      const newInvite: TeamMember = {
        id: Date.now().toString(),
        name: email.split('@')[0],
        email: email.trim(),
        role: selectedRole as 'can edit' | 'can view'
      };
      setInvitedUsers(prev => [...prev, newInvite]);
      setEmail("");
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setInvitedUsers(prev => 
      prev.map(user => 
        user.id === userId ? { ...user, role: newRole as 'can edit' | 'can view' } : user
      )
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-red-100 text-red-800';
      case 'can edit': return 'bg-blue-100 text-blue-800';
      case 'can view': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const shareCount = invitedUsers.length + teamMembers.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto bg-gray-100">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-gray-900">헤택온</DialogTitle>
            <div className="flex items-center gap-2 text-blue-600">
              <Share2 className="w-4 h-4" />
              <span className="text-sm">공유 {shareCount}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* 초대하기 섹션 */}
          <div className="flex gap-2">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-28 bg-gray-200 border-none">
                <SelectValue />
                <ChevronDown className="w-4 h-4 ml-1" />
              </SelectTrigger>
              <SelectContent>
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

          {/* 초대 목록 */}
          {invitedUsers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-gray-900">초대</h4>
              {invitedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <span className="text-gray-800">{user.name}</span>
                  <Select 
                    value={user.role} 
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                  >
                    <SelectTrigger className="w-24 bg-gray-200 border-none text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="can view">can view</SelectItem>
                      <SelectItem value="can edit">can edit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

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
                  <Select value={member.role} onValueChange={() => {}}>
                    <SelectTrigger className="w-24 bg-gray-200 border-none text-sm">
                      <SelectValue />
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="can view">can view</SelectItem>
                      <SelectItem value="can edit">can edit</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}