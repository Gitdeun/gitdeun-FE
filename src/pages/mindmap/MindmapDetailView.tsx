import { useEffect, useRef } from 'react';
import go from 'gojs';

// --- 데이터 타입 정의 (App.tsx와 공유) ---
export interface Mindmap {
  id: number;
  link: string;
  title: string;
  updated: string;
  eta?: string;
  pinned?: boolean;
}

// --- GoJS를 위한 데이터 타입 ---
interface GoJsNode {
  key: number;
  text: string;
  files: string;
  fill: string;
}

interface GoJsLink {
  from: number;
  to: number;
}

// --- 가짜 마인드맵 데이터 ---
const fakeMindmapData = {
  "node": "혜택온(Hyetaekon) 애플리케이션",
  "related_files": ["HyetaekonApplication.java"],
  "children": [
    { "node": "공공 복지 서비스", "related_files": ["PublicServiceController.java", "PublicServiceHandler.java"], "children": [
      { "node": "공공 데이터 동기화 (백엔드)", "related_files": ["PublicServiceDataController.java"], "children": [] },
      { "node": "서비스 조회 및 필터링", "related_files": ["PublicServiceController.java"], "children": [] }
    ]},
    { "node": "커뮤니티", "related_files": [], "children": [
      { "node": "게시글 관리", "related_files": ["PostController.java"], "children": [] },
      { "node": "답변 관리 (Q&A)", "related_files": ["AnswerController.java"], "children": [] }
    ]},
    { "node": "사용자 관리", "related_files": ["UserController.java"], "children": [
      { "node": "인증 (JWT)", "related_files": ["AuthController.java"], "children": [] }
    ]}
  ]
};

// --- GoJS 데이터 변환 함수 ---
const transformDataForGoJS = (data: any) => {
  const nodes: GoJsNode[] = [];
  const links: GoJsLink[] = [];
  let keyCounter = 0;

  const traverse = (node: any, parentKey: number | null) => {
    const currentKey = keyCounter++;
    nodes.push({
      key: currentKey,
      text: node.node,
      files: node.related_files.join('\n'),
      fill: parentKey === null ? "#1E90FF" : (node.children.length > 0 ? "#38BDF8" : "#93C5FD")
    });

    if (parentKey !== null) {
      links.push({ from: parentKey, to: currentKey });
    }

    if (node.children) {
      node.children.forEach((child: any) => traverse(child, currentKey));
    }
  };

  traverse(data, null);
  return { nodes, links };
};


// --- 마인드맵 상세 뷰 컴포넌트 ---
const MindmapDetailView = ({ mindmap, onBack }: { mindmap: Mindmap, onBack: () => void }) => {
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!diagramRef.current) return;

    const $ = go.GraphObject.make;
    const diagram = $(go.Diagram, diagramRef.current, {
      'undoManager.isEnabled': true,
      // layout을 ForceDirectedLayout으로 변경하여 방사형으로 퍼지는 디자인 적용
      layout: $(go.ForceDirectedLayout, {
        defaultSpringLength: 40, // 노드 간 기본 거리
        defaultElectricalCharge: 150, // 노드 간 밀어내는 힘
        maxIterations: 500 // 안정적인 배치를 위한 반복 횟수
      })
    });

    // 노드 디자인
    diagram.nodeTemplate = $(go.Node, "Auto",
      { toolTip:
          $(go.Adornment, "Auto",
            $(go.TextBlock, { margin: 4, textAlign: "left" }, new go.Binding("text", "files"))
          )
      },
      $(go.Shape, "RoundedRectangle", { strokeWidth: 0, fill: "white" },
        new go.Binding("fill", "fill")
      ),
      $(go.TextBlock, "Default Text",
        { margin: 12, stroke: "white", font: "bold 16px sans-serif" },
        new go.Binding("text", "text"))
    );

    // 연결선 디자인 (직선 형태로 변경)
    diagram.linkTemplate = $(go.Link,
      $(go.Shape, { strokeWidth: 2, stroke: "#a0a0a0" })
    );

    const { nodes, links } = transformDataForGoJS(fakeMindmapData);
    diagram.model = new go.GraphLinksModel(nodes, links);

    return () => {
      if (diagram.div) diagram.div = null;
    };
  }, [mindmap]);

  return (
    <div className="bg-slate-50 min-h-screen w-full p-8">
        <div className="w-full max-w-6xl mx-auto">
            <button onClick={onBack} className="mb-4 bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 transition-colors">
                &larr; 뒤로가기
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{mindmap.title}</h1>
            <p className="text-gray-500 mb-4">{mindmap.link}</p>
            <div ref={diagramRef} style={{ width: '100%', height: '70vh', border: '1px solid #e2e8f0', borderRadius: '1rem', backgroundColor: 'white' }}></div>
        </div>
    </div>
  );
};

export default MindmapDetailView;
