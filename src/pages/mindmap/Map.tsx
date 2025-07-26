import { useParams } from "react-router-dom";

export default function MindMapView() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <h2>마인드맵 ID: {id}</h2>
      <p>여기에 GoJS 혹은 다른 마인드맵 컴포넌트 렌더링</p>
    </div>
  );
}