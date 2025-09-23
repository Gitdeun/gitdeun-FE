import { useEffect, useState } from "react";
import { toast } from "sonner";
import { inviteMindmap, getMindmapInvitations, createMindmapInvitationLink, type MindmapInvitationRole, type MindmapInvitationItem } from "../../api/mindmap";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Share2, Eye, Pencil } from "lucide-react";


interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapId: number;
  mindmapTitle: string;
}

export function InviteModal({ open, onOpenChange, mapId, mindmapTitle }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("can view");
  const [loading, setLoading] = useState(false);

  // 기존 하드코드 멤버 대신, 초대 목록을 서버에서 조회
  const [invitations, setInvitations] = useState<MindmapInvitationItem[]>([]);
  const [invPage, setInvPage] = useState(0);
  const [invTotalPages, setInvTotalPages] = useState(0);
  const [invLoading, setInvLoading] = useState(false);
  const INV_PAGE_SIZE = 4;

  const loadInvitations = async (page = 0) => {
    setInvLoading(true);
    try {
      const res = await getMindmapInvitations(mapId, { page, size: INV_PAGE_SIZE });
      setInvitations(res.content);
      setInvTotalPages(res.totalPages);
      setInvPage(res.number);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '초대 목록을 불러오지 못했습니다.';
      toast.error(msg);
    } finally {
      setInvLoading(false);
    }
  };

  // 모달 열릴 때 목록 로드
  useEffect(() => {
    if (open) {
      void loadInvitations(0);
    }
  }, [open, mapId]);

  // 초대 API 호출
  const handleInvite = async () => {
    const trimmed = email.trim();
    if (!trimmed || loading) return;
    const roleMap: Record<'can edit' | 'can view', MindmapInvitationRole> = {
      'can edit': 'EDITOR',
      'can view': 'VIEWER',
    };
    setLoading(true);
    try {
      await inviteMindmap(mapId, { email: trimmed, role: roleMap[selectedRole as 'can edit' | 'can view'] });
      toast.success('초대가 전송되었습니다.');
      // 목록 새로고침
      await loadInvitations(0);
      setEmail("");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '초대 전송에 실패했습니다.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-0 overflow-hidden">
        <div className="relative">
          <DialogHeader className="pb-0">
            <div className="flex items-start justify-between px-5 pt-5">
              <div>
                <DialogTitle className="text-slate-900">{mindmapTitle}</DialogTitle>
                <p className="text-sm text-slate-500 mt-1">프로젝트에 팀원을 초대하고 권한을 설정하세요.</p>
              </div>
              <Button
                variant="ghost"
                onClick={async () => {
                  try {
                    const { invitationLink } = await createMindmapInvitationLink(mapId);
                    await navigator.clipboard.writeText(invitationLink);
                    toast.success('URL 링크가 복사되었습니다');
                  } catch (e: any) {
                    const msg = e?.response?.data?.message || e?.message || '초대 링크 생성에 실패했습니다.';
                    toast.error(msg);
                  }
                }}
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
                  disabled={!email.trim() || loading}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-4 disabled:opacity-60"
                >
                  {loading ? '전송 중…' : '초대하기'}
                </Button>
              </div>
            </div>

            {/* 초대한 사용자 목록 */}
            <div className="space-y-3">
              <h4 className="text-slate-900 text-sm font-semibold">초대한 사용자</h4>
              {/* 공유하기 버튼에서 링크 생성/복사 처리 */}
              {invLoading ? (
                <div className="text-sm text-slate-500">불러오는 중…</div>
              ) : (() => {
                const visibleInvites = invitations.filter(inv => !!inv.inviteeEmail && inv.inviteeEmail.includes('@'));
                if (visibleInvites.length === 0) {
                  return <div className="text-sm text-slate-500">아직 초대한 사용자가 없습니다.</div>;
                }
                return (
                  visibleInvites.map(inv => (
                    <div key={inv.invitationId} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold">
                          {inv.inviteeName?.slice(0,2) || inv.inviteeEmail.slice(0,2)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-slate-900 text-sm truncate">{inv.inviteeName || inv.inviteeEmail}</div>
                          <div className="text-slate-500 text-xs truncate">{inv.inviteeEmail}</div>
                          <div className="text-slate-400 text-xs">{new Date(inv.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs px-2.5 py-1 rounded-md ${inv.role === 'EDITOR' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{inv.role}</Badge>
                        <Badge className={`text-xs px-2.5 py-1 rounded-md ${inv.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : inv.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{inv.status}</Badge>
                      </div>
                    </div>
                  ))
                );
              })()}
              {invTotalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    className="px-3 py-1.5 text-xs rounded-full border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 disabled:opacity-50 disabled:hover:bg-sky-50"
                    disabled={invPage === 0}
                    onClick={() => void loadInvitations(Math.max(0, invPage - 1))}
                  >이전</button>
                  <span className="text-xs px-2 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                    {invPage + 1} / {invTotalPages}
                  </span>
                  <button
                    className="px-3 py-1.5 text-xs rounded-full border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 disabled:opacity-50 disabled:hover:bg-sky-50"
                    disabled={invPage + 1 >= invTotalPages}
                    onClick={() => void loadInvitations(invPage + 1)}
                  >다음</button>
                </div>
              )}
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}