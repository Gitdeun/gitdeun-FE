"use client";

import { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import MindmapDetailView, { type Mindmap } from './MindmapDetailView.tsx';
import { TechStackModal } from '../../components/modal/TechStackModal';

// --- 데이터 정의 (예시) ---
const fakeMindmapData = {
  node: "혜택온(Hyetaekon) 애플리케이션",
  related_files: ["HyetaekonApplication.java"],
  children: [
    { node: "공공 복지 서비스", related_files: ["PublicServiceController.java", "PublicServiceHandler.java"], children: [
      { node: "공공 데이터 동기화 (백엔드)", related_files: ["PublicServiceDataController.java"], children: [] },
      { node: "서비스 조회 및 필터링", related_files: ["PublicServiceController.java"], children: [] }
    ]},
    { node: "커뮤니티", related_files: [], children: [
      { node: "게시글 관리", related_files: ["PostController.java"], children: [] },
      { node: "답변 관리 (Q&A)", related_files: ["AnswerController.java"], children: [] }
    ]},
    { node: "사용자 관리", related_files: ["UserController.java"], children: [
      { node: "인증 (JWT)", related_files: ["AuthController.java"], children: [] }
    ]}
  ]
};


// 💡 컴포넌트 분리: 아이콘과 카드 컴포넌트를 Map 컴포넌트 밖으로 이동
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

const MindmapCard = ({ mindmap, onClick }: { mindmap: Mindmap; onClick: () => void }) => (
    <div onClick={onClick} className="flex flex-col justify-between p-6 rounded-2xl bg-white transition-all duration-300 cursor-pointer border border-slate-200/80 shadow-md hover:shadow-xl hover:-translate-y-1">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-3 h-3 rounded-full ${mindmap.type === '개발용' ? 'bg-blue-400' : 'bg-indigo-400'}`}></span>
          <span className="text-sm font-semibold text-gray-600">{mindmap.type}</span>
        </div>
        <p className="text-sm text-gray-400 truncate mb-1">{mindmap.link}</p>
        <h3 className="text-2xl font-bold text-gray-800 my-1 truncate">{mindmap.title}</h3>
      </div>
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-orange-500 font-medium">최근 업데이트 {mindmap.updated}</p>
        <div className="flex items-center gap-2">
          {mindmap.pinned && <PinIcon className="w-5 h-5 text-gray-700" />}
          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>
);


// --- 메인 컴포넌트 ---
const Map: React.FC = () => {
  const [githubLink, setGithubLink] = useState<string>('');
  const [isDevMode, setIsDevMode] = useState<boolean>(true);
  const [mindmaps, setMindmaps] = useState<Mindmap[]>([
    { id: 2, link: 'https://github.com/EWSNproject/be.git', title: '혜택온 백엔드', updated: '2025.07.13', pinned: true, type: '개발용', data: fakeMindmapData },
    { id: 3, link: 'https://github.com/porjecy123/fe.git', title: '확인용1', updated: '2025.07.13', pinned: true, type: '확인용', data: { node: "확인용1 루트", related_files: ["index.js"], children: [] } },
    { id: 1, link: 'https://github.com/EWSNproject/fe.git', title: '혜택온 프론트엔드', updated: '2025.07.13', eta: '5분예정', type: '개발용', data: { node: "프론트엔드 루트", related_files: ["App.tsx"], children: [] } },
    { id: 4, link: 'https://github.com/another/project.git', title: '새로운 프로젝트', updated: '2025.07.12', type: '확인용', data: { node: "새 프로젝트 루트", related_files: ["main.py"], children: [] } },
  ]);
  const [error, setError] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [selectedMindmap, setSelectedMindmap] = useState<Mindmap | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const [openTechModal, setOpenTechModal] = useState<boolean>(Boolean(location.state?.showTechStackModal));

  useEffect(() => {
    if (location.state?.showTechStackModal) {
      navigate(".", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubLink.trim()) {
      setError('GitHub 링크를 입력해주세요.');
      return;
    }
    setError('');

    const newMindmap: Mindmap = {
      id: Date.now(),
      link: githubLink,
      title: prompt || `새 마인드맵 ${mindmaps.length + 1}`,
      updated: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      pinned: false,
      type: isDevMode ? '개발용' : '확인용',
      data: { node: prompt || `새 마인드맵 루트`, related_files: [], children: [] }
    };

    setMindmaps(prevMindmaps => [newMindmap, ...prevMindmaps]);
    setGithubLink('');
    setPrompt('');
  };

  const handleMindmapClick = (mindmap: Mindmap) => {
    setSelectedMindmap(mindmap);
  };

  const pinnedMindmaps = useMemo(() => mindmaps.filter(m => m.pinned), [mindmaps]);
  const otherMindmaps = useMemo(() => mindmaps.filter(m => !m.pinned), [mindmaps]);

  if (selectedMindmap) {
    return <MindmapDetailView mindmap={selectedMindmap} onBack={() => setSelectedMindmap(null)} />;
  }

  return (
    <div className="font-sans">
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

      <div className="bg-white w-full flex-grow flex flex-col items-center py-12">
        <div className="w-full max-w-5xl px-4">
          {pinnedMindmaps.length > 0 && (
            <section className="w-full mb-12">
              <h2 className="text-xl font-bold text-gray-800 mb-4 px-2">Pinned</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pinnedMindmaps.map(mindmap => <MindmapCard key={mindmap.id} mindmap={mindmap} onClick={() => handleMindmapClick(mindmap)} />)}
              </div>
            </section>
          )}
          <section className="w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4 px-2">mind map</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {otherMindmaps.map(mindmap => <MindmapCard key={mindmap.id} mindmap={mindmap} onClick={() => handleMindmapClick(mindmap)} />)}
            </div>
          </section>
        </div>
      </div>

      <TechStackModal isOpen={openTechModal} onClose={() => setOpenTechModal(false)} />
    </div>
  );
};

export default Map;