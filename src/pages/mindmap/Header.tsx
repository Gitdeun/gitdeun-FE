import { useEffect, useRef, useState } from 'react';

export const Header: React.FC<{
  projectName: string;
  onBack: () => void;
  onInvite: () => void;
  onLeave?: () => void;
  onRename?: (nextTitle: string) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}> = ({ projectName, onBack, onInvite, onRename, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(projectName);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { setValue(projectName); }, [projectName]);
  useEffect(() => {
    if (editing) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [editing]);

  const commit = async () => {
    const next = value.trim();
    setEditing(false);
    if (!next || next === projectName) return;
    if (onRename) await onRename(next);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); void commit(); }
    if (e.key === 'Escape') { setEditing(false); setValue(projectName); }
  };

  return (
    <header className="px-4 py-3 border-b bg-white/90 backdrop-blur">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {editing ? (
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => void commit()}
              onKeyDown={onKeyDown}
              className="px-2 py-1 rounded-md border border-sky-300 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-sky-300/60"
            />
          ) : (
            <h1
              className="text-lg font-bold text-neutral-800 tracking-tight cursor-text hover:bg-sky-50/60 px-1 rounded"
              onClick={() => setEditing(true)}
              title="클릭하여 제목 수정"
            >
              {projectName}
            </h1>
          )}
          {!editing && (
            <div className="flex items-center gap-1">
              {/* Rename (pencil) */}
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                aria-label="제목 수정"
                title="제목 수정"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M16.862 3.487a1.75 1.75 0 0 1 2.476 2.476l-11 11A1.75 1.75 0 0 1 7.25 17.5H4.5v-2.75c0-.464.184-.91.513-1.237l11.85-11.85z"/>
                  <path d="M19.5 10.5v7.25A2.25 2.25 0 0 1 17.25 20H5.25A2.25 2.25 0 0 1 3 17.75V5.75A2.25 2.25 0 0 1 5.25 3H12" fillOpacity=".2"/>
                </svg>
              </button>
              {/* Delete (trash) */}
              {onDelete && (
                <button
                  onClick={() => void onDelete()}
                  className="p-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                  aria-label="마인드맵 삭제"
                  title="마인드맵 삭제"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M9 3.75A.75.75 0 0 1 9.75 3h4.5a.75.75 0 0 1 .75.75V5h4a.75.75 0 0 1 0 1.5h-15A.75.75 0 0 1 4.5 5h4V3.75z"/>
                    <path d="M6.75 7.25h10.5l-.69 11.28A2.25 2.25 0 0 1 14.32 20.5H9.68a2.25 2.25 0 0 1-2.24-1.97L6.75 7.25z"/>
                  </svg>
                </button>
              )}
            </div>
          )}
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
};
