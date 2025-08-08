import React, { useState } from 'react';
import Pin from "../../assets/images/ic_pin.svg"

// ChevronRightIcon SVG 컴포넌트
const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-6 h-6 text-gray-600"} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);


// 마인드맵 데이터 타입 정의
interface Mindmap {
  id: number;
  link: string;
  title: string;
  updated: string;
  eta?: string; //예상시간
  pinned?: boolean;
}

const MindmapGenerator: React.FC = () => {
  const [githubLink, setGithubLink] = useState<string>('');
  const [isDevMode, setIsDevMode] = useState<boolean>(true);
  // 초기 목업 데이터 설정
  const [mindmaps, setMindmaps] = useState<Mindmap[]>([
    { id: 1, link: 'https://github.com/EWSNproject/fe.git', title: '혜택온 프론트엔드', updated: '2025.07.13', eta: '5분예정' },
    { id: 2, link: 'https://github.com/EWSNproject/be.git', title: '혜택온 백엔드', updated: '2025.07.13', pinned: true },
    { id: 3, link: 'https://github.com/porjecy123/fe.git', title: '확인용1', updated: '2025.07.13', pinned: true },
  ]);
  const [error, setError] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');

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

  return (
    <div className="min-h-screen font-sans">
      <div className="bg-[#C1EBFD] flex flex-col items-center p-4 pt-20 pb-12">
        <div className="w-full max-w-6xl">
          <h1 className="text-4xl font-bold text-white text-center mb-10" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.1)' }}>
            GitHub 링크로 마인드맵 생성
          </h1>

          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
            <div className="w-full flex items-center bg-[#C1EBFD] rounded-full p-2 shadow-md mb-10 gap-2 h-20 border border-white">
              <div
                onClick={() => setIsDevMode(!isDevMode)}
                className="cursor-pointer bg-white rounded-full ml-3 h-12 relative"
                style={{ width: '130px' }}
              >
                {/* 움직이는 동그라미 */}
                <div className={`absolute top-1 left-1 bg-[#38BDF8] w-10 h-10 rounded-full shadow-md transition-transform duration-300 ease-in-out ${isDevMode ? 'translate-x-0' : 'translate-x-[82px]'}`}></div>

                {/* "개발용" 텍스트 */}
                <span className={`absolute top-0 left-9 right-1 h-full flex items-center justify-center font-bold text-lg text-sky-700 transition-opacity duration-200 ${isDevMode ? 'opacity-100' : 'opacity-0'}`}>
                  개발용
                </span>

                {/* "확인용" 텍스트 */}
                <span className={`absolute top-0 right-9 left-1 h-full flex items-center justify-center font-bold text-lg text-sky-700 transition-opacity duration-200 ${!isDevMode ? 'opacity-100' : 'opacity-0'}`}>
                  확인용
                </span>
              </div>
              <input
                type="text"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                placeholder="링크를 추가해 보세요"
                className="flex-grow p-2 bg-transparent focus:outline-none text-gray-800 text-lg placeholder:text-gray-600"
              />
              <button
                type="submit"
                className="bg-[#38BDF8] text-white font-bold py-4 px-8 mr-3 rounded-full hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
              >
                생성하기
              </button>
            </div>
            <input
              className="w-full mb-6 p-3 bg-transparent border-b-2 border-b-sky-500 text-black focus:outline-none "
              placeholder={isDevMode ? "프롬프트를 작성해주세요." : "마인드맵 제목을 작성해주세요. 미입력시, AI가 자동으로 생성합니다."}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </form>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      </div>

      {/* === 하단 흰색 섹션 === */}
      <div className="bg-white w-full flex-grow flex flex-col items-center p-4 py-8">
        <div className="w-full max-w-6xl">
            <section className="w-full">
              <h2 className="text-2xl font-bold text-black mb-6">생성한 마인드맵</h2>
              <div className="space-y-4">
                {mindmaps.map(mindmap => (
                  <div key={mindmap.id} className="flex justify-between items-center p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 truncate">{mindmap.link}</p>
                      <h3 className="text-2xl font-bold text-black my-1">{mindmap.title}</h3>
                      <p className="text-sm text-sky-500">최근 업데이트 {mindmap.updated}</p>
                    </div>
                    <div className="flex items-center gap-4 pl-4">
                      {mindmap.eta && <span className="text-sm text-gray-500">{mindmap.eta}</span>}
                      {mindmap.pinned && <img src={Pin} alt="Pin Icon" className="w-6 h-6" />}
                      <ChevronRightIcon className="w-6 h-6 text-gray-400"/>
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

export default MindmapGenerator;
