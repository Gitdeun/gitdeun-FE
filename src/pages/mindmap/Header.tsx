export const Header: React.FC<{
  projectName: string;
  onBack: () => void;
  onInvite: () => void;
  onLeave?: () => void;
}> = ({ projectName, onBack, onInvite }) => (
  <header className="px-4 py-3 border-b bg-white/90 backdrop-blur">
    <div className="max-w-[1600px] mx-auto flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-lg font-bold text-neutral-800 tracking-tight">{projectName}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onInvite}
          className="px-4 py-1.5 text-sm font-semibold rounded-lg border border-sky-300 text-sky-700 bg-transparent hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300/60 transition-colors"
        >
          초대하기
        </button>
        <button
          onClick={onBack}
          className="px-4 py-1.5 text-sm font-semibold rounded-lg border border-sky-300 text-sky-700 bg-transparent hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300/60 transition-colors"
          aria-label="목록으로 돌아가기"
        >
          목록으로
        </button>
      </div>
    </div>
  </header>
);
