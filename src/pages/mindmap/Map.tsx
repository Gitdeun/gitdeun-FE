import React, { useState } from 'react';
import MindmapDetailView, {type Mindmap } from './MindmapDetailView.tsx'; // 분리된 상세 페이지 컴포넌트를 import 합니다.

// --- 아이콘 SVG 컴포넌트 ---
const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-6 h-6 text-gray-400"} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const PinIcon = ({ className }: { className?: string }) => (
    <svg className={className || "w-6 h-6"} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 4V10.5C14 11.3284 13.3284 12 12.5 12H11.5C10.6716 12 10 11.3284 10 10.5V4H14Z" />
        <path fillRule="evenodd" clipRule="evenodd" d="M7 4C7 3.44772 7.44772 3 8 3H16C16.5523 3 17 3.44772 17 4V10.5C17 12.9853 14.9853 15 12.5 15H11.5C9.01472 15 7 12.9853 7 10.5V4ZM9 5V10.5C9 12.433 10.567 14 12.5 14H11.5C9.567 14 8 12.433 8 10.5V5H9Z" />
        <path d="M12 15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// --- 메인 페이지 컴포넌트 ---
const App: React.FC = () => {
  const [githubLink, setGithubLink] = useState<string>('');
  const [isDevMode, setIsDevMode] = useState<boolean>(true);
  const [mindmaps, setMindmaps] = useState<Mindmap[]>([
    { id: 1, link: 'https://github.com/EWSNproject/fe.git', title: '혜택온 프론트엔드', updated: '2025.07.13', eta: '5분예정' },
    { id: 2, link: 'https://github.com/EWSNproject/be.git', title: '혜택온 백엔드', updated: '2025.07.13', pinned: true },
    { id: 3, link: 'https://github.com/porjecy123/fe.git', title: '확인용1', updated: '2025.07.13', pinned: true },
  ]);
  const [error, setError] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [selectedMindmap, setSelectedMindmap] = useState<Mindmap | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubLink.trim()) {
      setError('GitHub 링크를 입력해주세요.');
      return;
    }
    setError('');

    const newMindmap: Mindmap = {
        id: mindmaps.length + 1,
        link: githubLink,
        title: prompt || `새 마인드맵 ${mindmaps.length + 1}`,
        updated: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
        pinned: false
    };

    setMindmaps(prevMindmaps => [newMindmap, ...prevMindmaps]);
    setGithubLink('');
    setPrompt('');
  };

  const handleMindmapClick = (mindmap: Mindmap) => {
    setSelectedMindmap(mindmap);
  };

  // 선택된 마인드맵이 있으면 상세 뷰를 렌더링
  if (selectedMindmap) {
    return <MindmapDetailView mindmap={selectedMindmap} onBack={() => setSelectedMindmap(null)} />;
  }

  // 선택된 마인드맵이 없으면 메인 페이지를 렌더링
  return (
    <div className="font-sans">
      {/* === 상단 하늘색 섹션 === */}
      <div className="bg-[#DDEFF9] flex flex-col items-center p-4 pt-16 pb-12 sm:pt-20">
        <div className="w-full max-w-5xl">
          <h1 className="text-4xl font-bold text-gray-800 text-center mb-12">
            GitHub 레포지토리, 한눈에 펼쳐지는 마인드맵
          </h1>

          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
            <div className="w-full flex items-center bg-white/70 rounded-full p-2 shadow-lg shadow-sky-200/80 mb-8 gap-3 h-20 border border-white">
              <div
                onClick={() => setIsDevMode(!isDevMode)}
                className="cursor-pointer bg-sky-100 rounded-full h-full flex-shrink-0 relative flex items-center p-1"
                style={{ width: '180px' }}
              >
                <div className={`absolute bg-white w-[82px] h-[60px] rounded-full shadow-md transition-transform duration-300 ease-in-out ${isDevMode ? 'translate-x-0' : 'translate-x-[88px]'}`}></div>
                <div className="relative w-full h-full flex justify-around items-center">
                    <span className={`font-bold text-lg transition-colors duration-300 ${isDevMode ? 'text-sky-600' : 'text-gray-500'}`}>
                      개발용
                    </span>
                    <span className={`font-bold text-lg transition-colors duration-300 ${!isDevMode ? 'text-sky-600' : 'text-gray-500'}`}>
                      확인용
                    </span>
                </div>
              </div>
              <input
                type="text"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                placeholder="링크를 추가해 보세요"
                className="flex-grow p-4 h-full bg-transparent focus:outline-none text-gray-700 text-xl placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="bg-sky-500 text-white font-bold py-4 px-10 h-full rounded-full hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                생성하기
              </button>
            </div>
            <input
              className="w-full max-w-4xl p-4 bg-white/50 rounded-2xl text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-colors placeholder:text-sky-800/60 border border-white/80"
              placeholder={isDevMode ? "프롬프트 작성해주세요." : "마인드맵 제목을 작성해주세요. 미입력시, AI가 자동으로 생성합니다."}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </form>
          {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        </div>
      </div>

      {/* === 하단 흰색 섹션 === */}
      <div className="bg-slate-50 w-full flex-grow flex flex-col items-center py-8">
        <div className="w-full max-w-5xl">
            <section className="w-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 px-2">생성한 마인드맵</h2>
              <div className="space-y-4">
                {mindmaps.map(mindmap => (
                  <div key={mindmap.id} onClick={() => handleMindmapClick(mindmap)} className="flex justify-between items-center p-6 rounded-2xl bg-white hover:bg-white transition-all duration-300 cursor-pointer border border-slate-200/80 hover:shadow-lg hover:border-slate-300 hover:-translate-y-1">
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm text-gray-500 truncate">{mindmap.link}</p>
                      <h3 className="text-2xl font-bold text-gray-900 my-1 truncate">{mindmap.title}</h3>
                      <p className="text-sm text-sky-500 font-medium">최근 업데이트 {mindmap.updated}</p>
                    </div>
                    <div className="flex items-center gap-4 pl-4">
                      {mindmap.eta && <span className="text-sm text-gray-500 bg-gray-100 py-1 px-2 rounded-md">{mindmap.eta}</span>}
                      {mindmap.pinned && <PinIcon className="w-6 h-6 text-gray-800" />}
                      <ChevronRightIcon />
                    </div>
                  </div>
                ))}
              </div>
            </section>
        </div>
      </div>
    </div>
  );
};

export default App;
