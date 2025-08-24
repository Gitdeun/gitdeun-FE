import { useState, useEffect, useRef } from 'react';
import go from 'gojs';
import { Header } from "../../components/mindmap/Header";
import { CodeViewer } from "../../components/mindmap/CodeViewer";
import { InviteModal } from "../../components/mindmap/InviteModal";
import { toast } from "sonner";
import type { Mindmap as MindmapType } from '../../types';


export interface Mindmap extends MindmapType {
  data: MindMapDataNode;
}

interface MindMapDataNode {
  node: string;
  related_files: string[];
  children?: MindMapDataNode[];
}

interface GoJSNodeData extends go.ObjectData {
  key: number;
  text: string;
  files: string;
  fill: string;
  originalData: MindMapDataNode & { key: number };
}

interface Comment {
  id: string;
  nodeId: number;
  author: string;
  content: string;
  timestamp: string;
  reactions: Record<string, number>;
}

const mockCode = `// Code content for the selected file would be fetched here.`;

const transformDataForGoJS = (data: MindMapDataNode) => {
  const nodes: GoJSNodeData[] = [];
  const links: { from: number; to: number }[] = [];
  let keyCounter = 0;

  const traverse = (node: MindMapDataNode, parentKey: number | null) => {
    const currentKey = keyCounter++;
    nodes.push({
      key: currentKey,
      text: node.node,
      files: node.related_files.join('\n'),
      fill: parentKey === null ? "#1E90FF" : (node.children && node.children.length > 0 ? "#38BDF8" : "#93C5FD"),
      originalData: { ...node, key: currentKey }
    });
    if (parentKey !== null) {
      links.push({ from: parentKey, to: currentKey });
    }
    if (node.children) {
      node.children.forEach((child: MindMapDataNode) => traverse(child, currentKey));
    }
  };

  traverse(data, null);
  return { nodes, links };
};

export function MindmapDetailView({ mindmap, onBack }: { mindmap: Mindmap; onBack: () => void }) {
  const [selectedNode, setSelectedNode] = useState<(MindMapDataNode & { key: number }) | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);
  const diagramInstance = useRef<go.Diagram | null>(null);

  const handleNodeClick = (node: MindMapDataNode & { key: number }) => {
    if (selectedNode?.key === node.key) {
      setSelectedNode(null);
    } else {
      setSelectedNode(node);
      if (node.related_files && node.related_files.length > 0) {
        setSelectedFile(node.related_files[0]);
      } else {
        setSelectedFile("연결된 파일 없음");
      }
    }
  };

  const handleAddComment = (content: string) => {
    if (!selectedNode) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      nodeId: selectedNode.key,
      author: "현재사용자",
      content,
      timestamp: new Date().toISOString(),
      reactions: {}
    };
    setComments(prev => [...prev, newComment]);
    toast.success("댓글이 추가되었습니다.");
  };

  const handleReaction = (commentId: string, emoji: string) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        const currentCount = comment.reactions[emoji] || 0;
        return { ...comment, reactions: { ...comment.reactions, [emoji]: currentCount + 1 } };
      }
      return comment;
    }));
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    toast.success("댓글이 삭제되었습니다.");
  };

  const handleReportComment = (commentId: string) => {
    const newCount = (reportCounts[commentId] || 0) + 1;
    setReportCounts(prev => ({ ...prev, [commentId]: newCount }));
    if (newCount >= 5) {
      toast.error("신고가 5회 누적되어 관리자에게 알림이 전송되었습니다.");
    } else {
      toast.info(`신고가 접수되었습니다. (${newCount}/5)`);
    }
  };

  const handleInvite = () => setInviteModalOpen(true);
  const handleLeave = () => {
    if (confirm("정말로 프로젝트를 나가시겠습니까?")) {
      toast.info("프로젝트에서 나갔습니다.");
    }
  };

  const selectedNodeComments = comments.filter(
    comment => comment.nodeId === selectedNode?.key
  );

  useEffect(() => {
    if (!diagramRef.current || !mindmap.data) return;
    const $ = go.GraphObject.make;
    const diagram = $(go.Diagram, diagramRef.current, {
      'undoManager.isEnabled': true,
      initialAutoScale: go.Diagram.Uniform,
      layout: $(go.ForceDirectedLayout, {
        defaultSpringLength: 50,
        defaultElectricalCharge: 150,
        maxIterations: 500,
      }),
    });

    diagram.nodeTemplate = $(go.Node, "Auto", {
      click: (_e, obj) => {
        const node = obj.part as go.Node;
        const nodeData = node.data as GoJSNodeData;
        if (nodeData?.originalData) {
          handleNodeClick(nodeData.originalData);
        }
      },
      toolTip: $(go.Adornment, "Auto",
        $(go.TextBlock, { margin: 4, textAlign: "left" }, new go.Binding("text", "files"))
      ),
    },
      new go.Binding("stroke", "isSelected", sel => sel ? "dodgerblue" : "transparent").ofObject(),
      new go.Binding("strokeWidth", "isSelected", sel => sel ? 4 : 0).ofObject(),
      $(go.Shape, "RoundedRectangle", { strokeWidth: 0 }, new go.Binding("fill", "fill")),
      $(go.TextBlock, { margin: 12, stroke: "white", font: "bold 16px sans-serif" }, new go.Binding("text", "text"))
    );

    diagram.linkTemplate = $(go.Link, $(go.Shape, { strokeWidth: 2, stroke: "#a0a0a0" }));

    const { nodes, links } = transformDataForGoJS(mindmap.data);
    diagram.model = new go.GraphLinksModel(nodes, links);
    diagramInstance.current = diagram;

    if (nodes.length > 0) {
      handleNodeClick(nodes[0].originalData);
    }

    return () => {
      if (diagram.div) diagram.div = null;
    };
  }, [mindmap]);

  useEffect(() => {
    if (diagramInstance.current) {
      diagramInstance.current.select(diagramInstance.current.findNodeForKey(selectedNode?.key));
    }
  }, [selectedNode]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        projectName={mindmap.title}
        onInvite={handleInvite}
        onLeave={handleLeave}
      />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex flex-col flex-1">
          <button onClick={onBack} className="m-4 p-2 bg-gray-200 rounded-lg self-start hover:bg-gray-300 transition-colors shadow">
            &larr; 목록으로 돌아가기
          </button>
          <div ref={diagramRef} className="flex-1" />
        </div>
        {selectedNode && (
          <CodeViewer
            fileName={selectedFile}
            code={mockCode}
            comments={selectedNodeComments}
            onAddComment={handleAddComment}
            onReaction={handleReaction}
            onDeleteComment={handleDeleteComment}
            onReportComment={handleReportComment}
          />
        )}
      </div>
      <InviteModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
      />
    </div>
  );
}

export default MindmapDetailView;