import { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { acceptInvitationByToken } from '../../api/mindmap';

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const run = async () => {
      if (!token) {
        toast.error('잘못된 초대 링크입니다.');
        navigate('/mindmap', { replace: true });
        return;
      }

      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        // 로그인 후 돌아올 경로 저장
        localStorage.setItem('postLoginRedirect', location.pathname);
        navigate('/login', { replace: true });
        return;
      }

      try {
        await acceptInvitationByToken(token);
        toast.success('참여 요청이 전송되었습니다. 승인 후 이용하실 수 있습니다.');
        navigate('/mindmap', { replace: true });
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || '초대 수락 처리에 실패했습니다.';
        toast.error(msg);
        navigate('/mindmap', { replace: true });
      }
    };
    void run();
  }, [token, navigate, location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white border rounded-xl shadow p-6 w-full max-w-md text-center">
        <h1 className="text-xl font-semibold text-slate-900 mb-3">초대 참여</h1>
        <p className="text-slate-600">처리 중…</p>
      </div>
    </div>
  );
}
