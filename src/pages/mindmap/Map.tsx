import { useParams } from "react-router-dom";

export default function MindMapView() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-blue-700">마인드맵 ID: {id}</h2>
      <p className="mt-2 text-gray-600">여기에 GoJS 혹은 다른 마인드맵 컴포넌트 렌더링</p>
    </div>
  );
}