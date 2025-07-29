import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white space-y-2">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">로그인 페이지</h2>

      <button
        onClick={() => navigate("/home")}
        className="px-4 py-1 border border-gray-300 rounded text-sm text-gray-800 hover:bg-gray-100"
      >
        홈으로 이동
      </button>

      <button
        onClick={() => navigate("/mindmap/123")}
        className="px-4 py-1 border border-gray-300 rounded text-sm text-gray-800 hover:bg-gray-100"
      >
        마인드맵 이동
      </button>

      <button
        onClick={() => navigate("/code")}
        className="px-4 py-1 border border-gray-300 rounded text-sm text-gray-800 hover:bg-gray-100"
      >
        코드 보기
      </button>

      <button
        onClick={() => navigate("/meeting")}
        className="px-4 py-1 border border-gray-300 rounded text-sm text-gray-800 hover:bg-gray-100"
      >
        회의 이동
      </button>
    </div>
  );
}
