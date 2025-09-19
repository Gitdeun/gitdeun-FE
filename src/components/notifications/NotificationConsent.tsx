import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

type Props = {
  storageKey?: string;        
  siteLabel?: string;        
  onAllow?: () => void;       
  onBlock?: () => void;      
  visible?: boolean;          
  onClose?: () => void;      
};

const DEFAULT_KEY = "notification-consent"; 

export default function NotificationConsent({
  storageKey = DEFAULT_KEY,
  siteLabel = window.location.hostname.replace(/^www\./, ""),
  onAllow,
  onBlock,
  visible,            
  onClose,            
}: Props) {
  const [open, setOpen] = useState(false);
  const [persistOK, setPersistOK] = useState(true);
  const controlled = typeof visible === "boolean";
  const shown = controlled ? (visible as boolean) : open;

  useEffect(() => {
    if (controlled) return;
    try {
      const v = localStorage.getItem(storageKey);
      setOpen(!(v === "Yes" || v === "No"));
      setPersistOK(true);
    } catch {
      setPersistOK(false);
      setOpen(true);
    }
  }, [storageKey, controlled]);

  const save = (value: "Yes" | "No") => {
    try {
      localStorage.setItem(storageKey, value);
    } catch {}
  };

  const close = () => {
    if (controlled) onClose?.();
    else setOpen(false);
  };

  const handleAllow = async () => {
    save("Yes");
    try {
      if ("Notification" in window) {
        await Notification.requestPermission().catch(() => {});
      }
    } catch {}
    close();
    onAllow?.();
  };

  const handleBlock = () => {
    save("No");
    close();
    onBlock?.();
  };

  if (!shown) return null;

  return (
    <div className="fixed right-16 top-22 z-[60] w-[360px] rounded-2xl border border-gray-200 bg-white shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-[15px] font-semibold">
          {siteLabel}에서 다음 권한을 요청합니다.
        </div>
        <button
          type="button"
          aria-label="닫기"
          onClick={close}
          className="p-1 text-gray-500 rounded-full hover:bg-gray-100"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex items-center gap-3 px-4 pb-3">
        <Bell size={18} className="shrink-0" />
        <div className="text-sm">알림표시</div>
      </div>

      {!persistOK && (
        <div className="px-4 pb-2 text-xs text-orange-600">
          브라우저 저장공간을 사용할 수 없어 다음 방문 시 다시 표시됩니다.
        </div>
      )}

      <div className="flex justify-end gap-2 px-4 py-2.5 border-t border-gray-100">
        <button
          onClick={handleBlock}
          className="rounded-xl border border-gray-200 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          차단
        </button>
        <button
          onClick={handleAllow}
          className="rounded-xl bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-600"
        >
          허용
        </button>
      </div>
    </div>
  );
}
