import { Link } from "react-router-dom";

export default function NotFound404() {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-sky-100 to-sky-200">
      {/* 배경 장식 - 구름 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-56 h-56 rounded-full -top-10 -left-16 bg-white/60 blur-2xl" />
        <div className="absolute w-40 h-40 rounded-full top-24 left-16 bg-white/50 blur-xl" />
        <div className="absolute rounded-full -bottom-8 right-10 h-72 w-72 bg-white/50 blur-3xl" />
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center max-w-4xl min-h-screen px-6 py-10 mx-auto">
        {/* 카드 */}
        <div className="w-full p-8 border shadow-xl rounded-3xl border-white/60 bg-white/70 backdrop-blur-md md:p-12">
          {/* 상단 아이콘/일러스트 */}
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 shadow-md rounded-2xl bg-gradient-to-br from-sky-200 to-blue-300 md:mb-8 md:h-24 md:w-24">
            <PaperPlane />
          </div>

          {/* 텍스트 */}
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-transparent bg-gradient-to-r from-blue-700 to-sky-500 bg-clip-text md:text-4xl">
              페이지를 찾을 수 없어요 (404)
            </h1>
            <p className="max-w-xl mx-auto mt-3 text-sm leading-6 text-blue-900/70 md:mt-4 md:text-base">
              요청하신 페이지가 이동되었거나, 주소가 정확하지 않아요. <br/>아래 버튼으로 홈에서 다시 시작해 보세요.
            </p>
          </div>

          {/* 액션 */}
          <div className="flex flex-col items-center justify-center gap-3 mt-8 md:mt-10 md:flex-row">
            <Link
              to="/mindmap"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label="홈으로 이동"
            >
              홈으로 이동
            </Link>
          </div>

          {/* 하단 보조 영역 */}
          <div className="grid gap-3 mt-8 text-xs text-blue-900/60 md:grid-cols-3">
            <TipCard title="주소 확인" desc="URL에 오타가 없는지 확인해 주세요." />
            <TipCard title="최근 변경" desc="페이지가 이동되었을 수 있어요." />
            <TipCard title="지원 채널" desc="문제가 반복되면 문의로 알려 주세요." />
          </div>
        </div>

        {/* 바닥 장식 */}
        <div className="mt-8 text-center text-[11px] text-blue-900/50">
          © {new Date().getFullYear()} Gitdeun
        </div>
      </main>
    </div>
  );
}

function TipCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-4 border shadow-sm rounded-2xl border-white/60 bg-white/60 backdrop-blur-md">
      <div className="mb-1 text-xs font-semibold text-blue-800">{title}</div>
      <div className="text-[11px] leading-5 text-blue-900/70">{desc}</div>
    </div>
  );
}

function PaperPlane() {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Paper plane"
      className="w-8 h-8 text-white drop-shadow md:h-10 md:w-10"
    >
      <path
        d="M60.2 6.3 6.7 27.9c-2 .8-2 3.6.1 4.3l13.9 4.6c1 .3 1.8 1.1 2.1 2.1l4.6 13.9c.7 2.1 3.5 2.1 4.3.1L53.3 9.4c.6-1.5-1-3-2.5-2.3L23.5 21c-.8.4-.7 1.6.1 1.8l10.3 2.6c.9.2 1.1 1.3.4 1.8L26 33.7"
        fill="currentColor"
        opacity=".95"
      />
    </svg>
  );
}
