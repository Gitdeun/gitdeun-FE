import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Share2, Eye, Pencil } from "lucide-react";

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
      <DialogContent className="max-w-lg mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-0 overflow-hidden">
        <div className="relative">
          <DialogHeader className="pb-0">
            <div className="flex items-start justify-between px-5 pt-5">
              <div>
                <DialogTitle className="text-slate-900">혜택온</DialogTitle>
                <p className="text-sm text-slate-500 mt-1">프로젝트에 팀원을 초대하고 권한을 설정하세요.</p>
              </div>
              <Button
                variant="ghost"
                onClick={handleShare}
                className="flex items-center gap-1 px-3 py-2 h-9 text-sky-700 hover:text-sky-800 hover:bg-sky-50"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm">공유하기</span>
              </Button>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mt-4" />
          </DialogHeader>

          <div className="p-5 space-y-5">
            {/* 초대하기 섹션 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="flex gap-2 items-center">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-40 h-9 rounded-lg bg-white border border-sky-200/80 text-sky-800 text-sm shadow-sm hover:bg-sky-50 focus:ring-2 focus:ring-sky-300/50">
                    <SelectValue placeholder="권한 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-lg border border-slate-200 shadow-xl p-1">
                    <SelectItem value="can view" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-sky-50 focus:bg-sky-50 cursor-pointer">
                      <Eye className="w-4 h-4 text-sky-600" />
                      <span className="text-sm text-slate-800">can view</span>
                    </SelectItem>
                    <SelectItem value="can edit" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-sky-50 focus:bg-sky-50 cursor-pointer">
                      <Pencil className="w-4 h-4 text-sky-700" />
                      <span className="text-sm text-slate-800">can edit</span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="email"
                  placeholder="이메일 입력"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-white border-slate-300 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                />

                <Button
                  onClick={handleInvite}
                  disabled={!email.trim()}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-4"
                >
                  초대하기
                </Button>
              </div>
            </div>

            {/* 팀원 목록 */}
            <div className="space-y-3">
              <h4 className="text-slate-900 text-sm font-semibold">팀원</h4>
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold">
                      {member.name.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-slate-900 text-sm truncate">{member.name}{member.isMe && ' (나)'}</div>
                      <div className="text-slate-500 text-xs truncate">{member.email}</div>
                    </div>
                  </div>
                  {member.role === 'owner' ? (
                    <Badge className={`${getRoleColor(member.role)} border border-transparent text-xs px-2.5 py-1 rounded-md`}>{member.role}</Badge>
                  ) : (
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleTeamMemberRoleChange(member.id, value)}
                    >
                      <SelectTrigger className="w-36 h-8 rounded-lg bg-white border border-sky-200/80 text-sky-800 text-xs shadow-sm hover:bg-sky-50 focus:ring-2 focus:ring-sky-300/50">
                        <SelectValue placeholder="권한" />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-lg border border-slate-200 shadow-xl p-1">
                        <SelectItem value="can view" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-sky-50 focus:bg-sky-50 cursor-pointer">
                          <Eye className="w-4 h-4 text-sky-600" />
                          <span className="text-sm text-slate-800">can view</span>
                        </SelectItem>
                        <SelectItem value="can edit" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-sky-50 focus:bg-sky-50 cursor-pointer">
                          <Pencil className="w-4 h-4 text-sky-700" />
                          <span className="text-sm text-slate-800">can edit</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}
            </div>
          </div>

          {showCopyAlert && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs shadow-lg ring-1 ring-black/5">
              URL 링크가 복사되었습니다
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}