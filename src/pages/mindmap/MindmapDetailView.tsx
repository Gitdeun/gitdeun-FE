import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import go from 'gojs';
import { toast } from 'sonner';
import {InviteModal} from "../../components/modal/InviteModal.tsx";
import type {Mindmap, MindMapDataNode} from "../../types";
import { Header } from './Header';
import { ChatPanel } from './ChatPanel';
import { updateMindmapTitle, deleteMindmap, getConnectedUsers, type ConnectedUser, connectMindmapSSE, getMindmapPromptHistories, type PromptHistoryItem, type PageResponse, getMindmapDetail, type MindmapGraphNode, type MindmapGraphEdge } from '../../api/mindmap';
import httpClient from '../../api/httpClient';

function HistoryList({ mapId }: { mapId: number; onUsePrompt: (p: string) => void }) {
  const [items, setItems] = useState<PromptHistoryItem[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeAgo = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}시간 전`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}일 전`;
    return d.toLocaleDateString();
  };

  useEffect(() => { setPage(0); }, [mapId]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMindmapPromptHistories(mapId, { page, size });
        setItems((data as PageResponse<PromptHistoryItem>).content);
        setTotalPages(Math.max(1, Number((data as PageResponse<PromptHistoryItem>).totalPages ?? 1)));
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || '히스토리를 불러오지 못했습니다.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [mapId, page, size]);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="px-4 py-3.5 border-b border-neutral-200 bg-white/90 sticky top-0 z-10 flex items-center justify-between">
        <div className="text-sm font-semibold text-sky-700">최근 프롬프트</div>
      </div>
      <div className="flex-1 p-3 overflow-y-auto">
        {loading ? (
          <div className="p-3 text-sm text-neutral-500">불러오는 중…</div>
        ) : error ? (
          <div className="p-3 text-sm text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-3 text-sm text-neutral-500">기록이 없습니다.</div>
        ) : (
          <ul className="space-y-2">
            {items.map(h => (
              <li key={h.historyId}>
                <div className="w-full p-3 text-left transition bg-white border rounded-lg group border-neutral-200 hover:bg-sky-50/60">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] text-neutral-500 flex items-center gap-2">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${h.applied ? 'bg-emerald-500' : 'bg-neutral-300'}`}></span>
                      <span>{timeAgo(h.createdAt)}</span>
                    </div>
                    
                  </div>
                  <div className="mt-1 text-[13px] font-medium text-neutral-800 line-clamp-2">{h.summary || h.prompt}</div>
                  <div className="text-[12px] text-neutral-600 line-clamp-2">{h.prompt}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex items-center justify-center gap-3 p-2">
        <button
          className="px-3 py-1.5 text-xs rounded-full border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 disabled:opacity-50 disabled:hover:bg-sky-50"
          disabled={page === 0}
          onClick={() => setPage(p => Math.max(0, p - 1))}
        >이전</button>
        <span className="px-2 py-1 text-xs border rounded-full bg-sky-50 text-sky-700 border-sky-200">
          {page + 1} / {Math.max(1, totalPages)}
        </span>
        <button
          className="px-3 py-1.5 text-xs rounded-full border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 disabled:opacity-50 disabled:hover:bg-sky-50"
          disabled={page + 1 >= totalPages}
          onClick={() => setPage(p => p + 1)}
        >다음</button>
      </div>
    </div>
  );
}

const transformDataForMindMapSample = (data: MindMapDataNode) => {
    const nodeDataArray: go.ObjectData[] = [];
    let keyCounter = 0;
    const branchColors = ["#51a1e6", "#66d456", "#e57373", "#ff8a65", "#ba68c8", "#90a4ae"];
    type Direction = 'left' | 'right';


    function traverse(node: MindMapDataNode, parentKey: number | null, dir: Direction | null, brush: string) {
        const currentKey = keyCounter++;
        const nodeData: go.ObjectData = {
            key: currentKey,
            ...(parentKey !== null && { parent: parentKey }),
            text: node.node,
            brush: brush,
            dir: dir,
        };
        if (parentKey === null) {
            nodeData.category = "Root";
        }
        nodeDataArray.push(nodeData);
        node.children?.forEach((child, index) => {
            if (parentKey === null) {
                const newBrush = branchColors[index % branchColors.length];
                const newDir: Direction = index % 2 === 0 ? 'right' : 'left';
                traverse(child, currentKey, newDir, newBrush);
            } else {
                traverse(child, currentKey, dir, brush);
            }
        });
    }
    traverse(data, null, null, 'black');
    return nodeDataArray;
};


export function MindmapDetailView({ mindmap, onBack }: { mindmap: Mindmap; onBack: () => void; }) {
  const graphLabelToKeyRef = useRef<Map<string, string>>(new Map());
  const graphKeyToFilesRef = useRef<Map<string, Array<{ fileName: string; file_path: string }>>>(new Map());
  const diagramRef = useRef<HTMLDivElement>(null);
    const diagramInstance = useRef<go.Diagram | null>(null);
    const overviewRef = useRef<HTMLDivElement>(null);
    const overviewInstance = useRef<go.Overview | null>(null);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [title, setTitle] = useState(mindmap.title);
    const [lastHistoryMaxCreatedAt, setLastHistoryMaxCreatedAt] = useState<string | null>(null);
    const [graphAllNodes, setGraphAllNodes] = useState<MindmapGraphNode[] | null>(null);
    const [suggestionNodes, setSuggestionNodes] = useState<MindmapGraphNode[] | null>(null);
    const [suggestionEdges, setSuggestionEdges] = useState<MindmapGraphEdge[] | null>(null);
    const [showSuggestions] = useState(true);
    useEffect(() => { setTitle(mindmap.title); }, [mindmap.title]);
    const navigate = useNavigate();
    const [hoverCard, setHoverCard] = useState<{
      visible: boolean;
      left: number;
      top: number;
      text: string;
      nodeKey: string | null;        // ← 추가
    }>(() => ({ visible: false, left: 0, top: 0, text: '', nodeKey: null }));
    const hoverHideTimer = useRef<number | null>(null);
    const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);

  const cancelHoverHide = () => {
    if (hoverHideTimer.current) {
      window.clearTimeout(hoverHideTimer.current);
      hoverHideTimer.current = null;
    }
  };
  const hideHoverDelayed = () => {
    if (hoverHideTimer.current) window.clearTimeout(hoverHideTimer.current);
    hoverHideTimer.current = window.setTimeout(() => {
      setHoverCard((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      hoverHideTimer.current = null;
    }, 180);
  };
  const showHoverForNode = (node: go.Node) => {
    if (!diagramRef.current || !diagramInstance.current) return;
    const d = diagramInstance.current;
    const ptDoc = node.getDocumentPoint(go.Spot.Top);
    const ptView = d.transformDocToView(ptDoc);

    const label = (node.data as any)?.text || '';
    const nodeKey = graphLabelToKeyRef.current.get(label) ?? null;

    cancelHoverHide();
    setHoverCard({
      visible: true,
      left: ptView.x + 8,
      top: Math.max(8, ptView.y - 8),
      text: label,
      nodeKey, // ← 여기 저장
    });
  };


    // Poll connected users every 10s
    useEffect(() => {
        let cancelled = false;
        let timer: number | null = null;
        const load = async () => {
            try {
                const list = await getConnectedUsers(mindmap.id);
                if (!cancelled) setConnectedUsers(Array.isArray(list) ? list : []);
            } catch {
                if (!cancelled) setConnectedUsers([]);
            }
        };
        void load();
        timer = window.setInterval(() => { void load(); }, 10000);
        return () => {
            cancelled = true;
            if (timer) window.clearInterval(timer);
        };
    }, [mindmap.id]);

    // Poll latest prompt histories to detect completion and notify ChatPanel
    useEffect(() => {
        let timer: number | null = null;

        const checkLatestHistory = async () => {
            try {
                const data = await getMindmapPromptHistories(mindmap.id, { page: 0, size: 5 });
                const content = (data as PageResponse<PromptHistoryItem>).content;
                if (Array.isArray(content) && content.length > 0) {
                    const newest = content.reduce((acc, cur) => acc && new Date(acc.createdAt) > new Date(cur.createdAt) ? acc : cur);
                    const newestAt = newest.createdAt;
                    if (lastHistoryMaxCreatedAt === null) {
                        setLastHistoryMaxCreatedAt(newestAt);
                    } else if (new Date(newestAt).getTime() > new Date(lastHistoryMaxCreatedAt).getTime()) {
                        setLastHistoryMaxCreatedAt(newestAt);
                        // Dispatch event so ChatPanel can append the assistant message
                        window.dispatchEvent(new Event('mindmap:analysis_prompt'));
                    }
                }
            } catch {
                // ignore errors silently
            }
        };

        // initial check
        void checkLatestHistory();
        // poll every 6s
        timer = window.setInterval(() => { void checkLatestHistory(); }, 6000);

        return () => {
            if (timer) window.clearInterval(timer);
        };
    }, [mindmap.id, lastHistoryMaxCreatedAt]);

    // Open presence SSE for this mindmap
    useEffect(() => {
        const baseUrl = (httpClient.defaults.baseURL as string) || '';
        if (!baseUrl) return;
        const es = connectMindmapSSE({
            baseUrl,
            mapId: mindmap.id,
            onMessage: (msg) => {
                const t = msg?.type;
                if (!t) return;
                // If server pushes full list
                if (t === 'USERS_UPDATE' && Array.isArray(msg.payload)) {
                    setConnectedUsers(msg.payload as ConnectedUser[]);
                }
                // If server signals join/leave, refresh list
                if (t === 'USER_JOINED' || t === 'USER_LEFT') {
                    getConnectedUsers(mindmap.id).then((list) => setConnectedUsers(Array.isArray(list) ? list : [])).catch(() => {});
                }
            },
            onError: () => {
                // silent
            },
        });
        return () => {
            es.close();
        };
    }, [mindmap.id]);

    useEffect(() => {
        if (!diagramRef.current || diagramInstance.current) return;
        const myDiagram = new go.Diagram(diagramRef.current, {
            'commandHandler.copiesTree': true,
            'commandHandler.copiesParentKey': true,
            'commandHandler.deletesTree': true,
            'draggingTool.dragsTree': true,
            'undoManager.isEnabled': true,
            initialContentAlignment: go.Spot.Center,
        });
        diagramInstance.current = myDiagram;

        // 마우스 휠 중심 확대 활성화
        myDiagram.toolManager.mouseWheelBehavior = go.ToolManager.WheelZoom;

        // --- GoJS 헬퍼 함수들 ---
        function spotConverter(dir: string, from: boolean) {
            if (dir === 'left') return from ? go.Spot.Left : go.Spot.Right;
            if (dir === 'right') return from ? go.Spot.Right : go.Spot.Left;
            return from ? go.Spot.Right : go.Spot.Left;
        }

        function addNodeAndLink(_e: go.InputEvent, obj: go.GraphObject) {
            const adorn = obj.part as go.Adornment;
            if (!adorn) return;
            const oldnode = adorn.adornedPart as go.Node;
            if (!oldnode) return;
            myDiagram.startTransaction('Add Node');
            const olddata = oldnode.data;
            let newDir = olddata.dir;
            if (olddata.category === "Root") {
                const childCount = oldnode.findTreeChildrenNodes().count;
                newDir = childCount % 2 === 0 ? 'right' : 'left';
            }
            const newdata = { text: 'idea', brush: olddata.brush, dir: newDir, parent: olddata.key };
            (myDiagram.model as go.TreeModel).addNodeData(newdata);
            layoutTree(oldnode);
            myDiagram.commitTransaction('Add Node');
            const newnode = myDiagram.findNodeForData(newdata);
            if (newnode) myDiagram.scrollToRect(newnode.actualBounds);
        }

        function changeTextSize(obj: go.GraphObject, factor: number) {
            const adorn = obj.part as go.Adornment; if (!adorn?.diagram) return;
            adorn.diagram.startTransaction('Change Text Size');
            const node = adorn.adornedPart; if (!node) { adorn.diagram.commitTransaction('Change Text Size'); return; }
            const tb = node.findObject('TEXT') as go.TextBlock; tb.scale *= factor;
            adorn.diagram.commitTransaction('Change Text Size');
        }
        function toggleTextWeight(obj: go.GraphObject) {
            const adorn = obj.part as go.Adornment; if (!adorn?.diagram) return;
            adorn.diagram.startTransaction('Change Text Weight');
            const node = adorn.adornedPart; if (!node) { adorn.diagram.commitTransaction('Change Text Weight'); return; }
            const tb = node.findObject('TEXT') as go.TextBlock; const idx = tb.font.indexOf('bold');
            if (idx < 0) tb.font = 'bold ' + tb.font; else tb.font = tb.font.slice(idx + 5);
            adorn.diagram.commitTransaction('Change Text Weight');
        }
        function updateNodeDirection(node: go.Node, dir: string) {
            myDiagram.model.setDataProperty(node.data, 'dir', dir);
            const chl = node.findTreeChildrenNodes(); while (chl.next()) { updateNodeDirection(chl.value, dir); }
        }
        function layoutAll() {
            const root = myDiagram.findTreeRoots().first(); if (root === null) return;
            myDiagram.startTransaction('Layout');
            const rightward = new go.Set<go.Part>(); const leftward = new go.Set<go.Part>();
            root.findLinksConnected().each((link) => {
                const child = link.toNode; if (!child) return;
                if (child.data.dir === 'left') { leftward.add(root).add(link).addAll(child.findTreeParts()); }
                else { rightward.add(root).add(link).addAll(child.findTreeParts()); }
            });
            layoutAngle(rightward, 0); layoutAngle(leftward, 180);
            myDiagram.commitTransaction('Layout');
        }
        function layoutTree(node: go.Node) {
            if (node.isTreeRoot) layoutAll();
            else { layoutAngle(node.findTreeParts(), node.data.dir === 'left' ? 180 : 0); }
        }
        function layoutAngle(parts: go.Set<go.Part>, angle: number) {
            const layout = new go.TreeLayout({ angle, arrangement: go.TreeArrangement.FixedRoots, nodeSpacing: 5, layerSpacing: 20, setsPortSpot: false, setsChildPortSpot: false });
            layout.doLayout(parts);
        }


        // 일반 노드 템플릿
        myDiagram.nodeTemplate = new go.Node('Vertical', {
                selectionObjectName: 'TEXT',
                mouseEnter: (_e: go.InputEvent, obj: go.GraphObject) => {
                    const n = obj.part as go.Node;
                    if (n) showHoverForNode(n);
                },
                mouseLeave: (_e: go.InputEvent, _obj: go.GraphObject) => {
                    hideHoverDelayed();
                },
            })
            .bindTwoWay('location', 'loc', go.Point.parse, go.Point.stringify)
            .bind('locationSpot', 'dir', (d) => spotConverter(d, false))
            .add(
                new go.TextBlock({
                    name: 'TEXT',
                    minSize: new go.Size(30, 15),
                    editable: true,
                    font: '16px Inter, sans-serif',
                    maxLines: 2,
                    overflow: go.TextOverflow.Ellipsis,
                    // 기본 툴팁 대신 React 오버레이 사용
                })
                  .bindTwoWay('text').bindTwoWay('scale').bindTwoWay('font'),
                new go.Shape('LineH', { stretch: go.Stretch.Horizontal, strokeWidth: 3, height: 3, portId: '', fromSpot: go.Spot.LeftRightSides, toSpot: go.Spot.LeftRightSides })
                    .bind('stroke', 'brush').bind('fromSpot', 'dir', (d) => spotConverter(d, true)).bind('toSpot', 'dir', (d) => spotConverter(d, false))
            );

        myDiagram.nodeTemplateMap.add("Root",
            new go.Node("Auto", {
                selectionObjectName: "TEXT",
                locationSpot: go.Spot.Center,
                shadowVisible: true,
                shadowBlur: 10,
                shadowColor: "rgba(0, 0, 0, .15)",
                shadowOffset: new go.Point(3, 3),
                mouseEnter: (_e: go.InputEvent, obj: go.GraphObject) => {
                    const n = obj.part as go.Node;
                    if (n) showHoverForNode(n);
                },
                mouseLeave: (_e: go.InputEvent, _obj: go.GraphObject) => { hideHoverDelayed(); },
            })
            .bindTwoWay('location', 'loc', go.Point.parse, go.Point.stringify)
            .add(
                new go.Shape("RoundedRectangle", {
                    // 2. 그라데이션 배경
                    fill: new go.Brush("Linear", { 0: "#F8F9FA", 1: "#E9ECEF" }),
                    portId: "",
                    fromSpot: go.Spot.AllSides,
                    toSpot: go.Spot.AllSides,
                    // 3. 테두리 스타일
                    stroke: "#ADB5BD",
                    strokeWidth: 1.5,
                }),
                new go.TextBlock({
                    name: "TEXT",
                    font: "bold 18px Inter, sans-serif",
                    stroke: "#212529",
                    margin: 12,
                    editable: true,
                    maxLines: 2,
                    overflow: go.TextOverflow.Ellipsis,
                    // 기본 툴팁 대신 React 오버레이 사용
                }).bindTwoWay("text")
            )
        );

        // Suggestion node template (AI 추천)
        myDiagram.nodeTemplateMap.add("Suggestion",
            new go.Node("Auto", {
                selectionObjectName: "TEXT",
                isLayoutPositioned: false,
                mouseEnter: (_e: go.InputEvent, obj: go.GraphObject) => { const n = obj.part as go.Node; if (n) showHoverForNode(n); },
                mouseLeave: (_e: go.InputEvent) => { hideHoverDelayed(); },
            })
            .bindTwoWay('location', 'loc', go.Point.parse, go.Point.stringify)
            .add(
                new go.Shape("RoundedRectangle", {
                    fill: "#F8FAFC",
                    stroke: "#94A3B8",
                    strokeWidth: 1.5,
                    strokeDashArray: [6, 4],
                    portId: "",
                    fromSpot: go.Spot.AllSides,
                    toSpot: go.Spot.AllSides,
                }),
                new go.TextBlock({
                    name: "TEXT",
                    font: "italic 14px Inter, sans-serif",
                    stroke: "#0F172A",
                    margin: 8,
                    maxLines: 2,
                    overflow: go.TextOverflow.Ellipsis,
                }).bindTwoWay("text")
            )
        );

        const selectionAdornmentTemplate = new go.Adornment('Spot')
            .add(
                new go.Panel('Auto').add(new go.Shape({ fill: null, stroke: 'dodgerblue', strokeWidth: 3 }), new go.Placeholder({ margin: new go.Margin(4, 4, 0, 4) })),
                go.GraphObject.build('Button', {
                    alignment: go.Spot.Right,
                    alignmentFocus: go.Spot.Left,
                    click: addNodeAndLink
                }).add(new go.TextBlock('+', { font: 'bold 12pt sans-serif' }))
            );
        myDiagram.nodeTemplate.selectionAdornmentTemplate = selectionAdornmentTemplate;
        myDiagram.nodeTemplateMap.get("Root")!.selectionAdornmentTemplate = selectionAdornmentTemplate;


        myDiagram.nodeTemplate.contextMenu = go.GraphObject.build('ContextMenu')
            .add(
                go.GraphObject.build('ContextMenuButton', { click: (_e, obj) => changeTextSize(obj, 1.1) }).add(new go.TextBlock('Bigger')),
                go.GraphObject.build('ContextMenuButton', { click: (_e, obj) => changeTextSize(obj, 1 / 1.1) }).add(new go.TextBlock('Smaller')),
                go.GraphObject.build('ContextMenuButton', { click: (_e, obj) => toggleTextWeight(obj) }).add(new go.TextBlock('Bold/Normal')),
                go.GraphObject.build('ContextMenuButton', { click: (e) => { const n = e.diagram.selection.first() as go.Node; if (n) e.diagram.commandHandler.collapseTree(n); } }).add(new go.TextBlock('Collapse subtree')),
                go.GraphObject.build('ContextMenuButton', { click: (e) => { const n = e.diagram.selection.first() as go.Node; if (n) e.diagram.commandHandler.expandTree(n); } }).add(new go.TextBlock('Expand subtree')),
                go.GraphObject.build('ContextMenuButton', { click: (e) => {
                    const selectedNode = e.diagram.selection.first() as go.Node;
                    if (selectedNode) layoutTree(selectedNode);
                }}).add(new go.TextBlock('Layout'))
            );

        // Default link for normal nodes
        myDiagram.linkTemplate = new go.Link({ curve: go.Curve.Bezier, fromShortLength: -2, toShortLength: -2, selectable: false })
            .add(new go.Shape({ strokeWidth: 3 }).bind('stroke', 'brush', (brush, link) => (link as go.Link).toNode?.data.brush || brush));

        // Lighter/dashed link for suggestions
        myDiagram.linkTemplateMap.add("SuggestionLink",
            new go.Link({ curve: go.Curve.Bezier, fromShortLength: -2, toShortLength: -2, selectable: false })
                .add(new go.Shape({ stroke: "#94A3B8", strokeWidth: 2, strokeDashArray: [6, 4] }))
        );

        myDiagram.addDiagramListener('SelectionMoved', () => {
            const root = myDiagram.findNodeForKey(0);
            if (!root) return;
            const rootPt = root.location;
            myDiagram.selection.each((node) => {
                if (!(node instanceof go.Node) || node.data.parent !== 0) return;
                const nodePt = node.location;
                const dx = nodePt.x - rootPt.x;
                const dir = dx > 0 ? 'right' : 'left';
                if (node.data.dir !== dir) updateNodeDirection(node, dir);
                layoutTree(node);
            });
        });

        const nodeDataArray = transformDataForMindMapSample(mindmap.data);
        myDiagram.model = new go.TreeModel(nodeDataArray);
        layoutAll();

        // 초기에는 루트 2레벨 이하 접기
        myDiagram.nodes.each((n) => {
            if (n.findTreeLevel() >= 2) {
                (myDiagram.model as go.TreeModel).setDataProperty(n.data, 'isTreeExpanded', false);
            }
        });

        // 화면에 맞춤 및 약간 여백
        myDiagram.zoomToFit();
        myDiagram.scale = myDiagram.scale * 1.05;

        // 선택 서브트리 외 영역 흐리게
        myDiagram.addDiagramListener('ChangedSelection', () => {
            const sel = myDiagram.selection.first() as go.Node | null;
            if (!sel) {
                myDiagram.nodes.each(n => (n.opacity = 1));
                myDiagram.links.each(l => (l.opacity = 1));
                return;
            }
            const visible = new go.Set<go.Part>();
            visible.add(sel);
            sel.findTreeParts().each(p => visible.add(p));
            myDiagram.nodes.each(n => { n.opacity = visible.contains(n) ? 1 : 0.3; });
            myDiagram.links.each(l => { l.opacity = visible.contains(l) ? 1 : 0.15; });
        });

        // 미니맵 (중복 생성 방지)
        if (overviewRef.current && !overviewInstance.current) {
            overviewInstance.current = new go.Overview(overviewRef.current);
            overviewInstance.current.observed = myDiagram;
        }

        // cleanup
        return () => {
            if (diagramInstance.current) {
                diagramInstance.current.div = null;
                diagramInstance.current = null;
            }
            if (overviewInstance.current) {
                overviewInstance.current.observed = null as unknown as go.Diagram;
                overviewInstance.current.div = null as unknown as HTMLDivElement;
                overviewInstance.current = null;
            }
        };
    }, [mindmap]);

    // Fetch suggestion graph (AI 추천 노드/엣지)
    // 컴포넌트 상단에 ref 먼저 선언

  // ↓ 기존 useEffect 수정본
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const detail = await getMindmapDetail(mindmap.id);
        const nodes = detail.mindmapGraph?.nodes || [];
        const edges = detail.mindmapGraph?.edges || [];
        const sugNodes = nodes.filter((n: any) => n.node_type === 'suggestion' || n.suggestionNode);
        const sugEdges = edges.filter((e: any) => e.suggestionEdge);

        if (mounted) {
          setGraphAllNodes(nodes);
          setSuggestionNodes(sugNodes);
          setSuggestionEdges(sugEdges);

          // ★ 여기 추가: 그래프 매핑 구성
          graphLabelToKeyRef.current = new Map();
          graphKeyToFilesRef.current = new Map();

          nodes.forEach((n: any) => {
            if (n?.label && n?.key) {
              graphLabelToKeyRef.current.set(String(n.label), String(n.key)); // 라벨 → 그래프 key
            }
            graphKeyToFilesRef.current.set(
              String(n.key),
              Array.isArray(n?.related_files) ? n.related_files : []
            );
          });
        }
      } catch {
        if (mounted) {
          setGraphAllNodes([]);
          setSuggestionNodes([]);
          setSuggestionEdges([]);
          // 실패 시 매핑도 초기화
          graphLabelToKeyRef.current = new Map();
          graphKeyToFilesRef.current = new Map();
        }
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [mindmap.id]);

    // Render suggestion nodes into GoJS diagram
    useEffect(() => {
        const d = diagramInstance.current;
        if (!d || !suggestionNodes || !suggestionEdges || !graphAllNodes) return;
        if (!showSuggestions) {
            // Remove existing suggestion nodes when toggled off
            d.startTransaction('Remove Suggestions');
            const model = d.model as go.TreeModel;
            const toRemove: any[] = [];
            (model.nodeDataArray as any[]).forEach(nd => { if (nd.category === 'Suggestion') toRemove.push(nd); });
            toRemove.forEach(nd => model.removeNodeData(nd));
            d.commitTransaction('Remove Suggestions');
            return;
        }
        const model = d.model as go.TreeModel;
        // Build label -> key map from existing diagram nodes
        const labelToKey = new Map<string, number | string>();
        (model.nodeDataArray as any[]).forEach(nd => {
            if (nd.text != null) labelToKey.set(String(nd.text), nd.key);
        });
        // Build a map from graph key -> label (from full graph)
        const graphKeyToLabel = new Map<string, string>();
        graphAllNodes.forEach(n => graphKeyToLabel.set(n.key, n.label));

        // Remove existing suggestion nodes to avoid duplicates
        d.startTransaction('Refresh Suggestions');
        const toRemove: any[] = [];
        (model.nodeDataArray as any[]).forEach(nd => { if (nd.category === 'Suggestion') toRemove.push(nd); });
        toRemove.forEach(nd => model.removeNodeData(nd));

        // Compute next unique numeric key
        let maxKey = 0;
        (model.nodeDataArray as any[]).forEach(nd => { const k = Number(nd.key); if (!Number.isNaN(k)) maxKey = Math.max(maxKey, k); });
        let nextKey = maxKey + 1;

        suggestionNodes.forEach(sn => {
            const parentEdge = suggestionEdges.find(e => e.to === sn.key || e.from === sn.key);
            let parentKey: any = null;
            if (parentEdge) {
                const otherKey = parentEdge.to === sn.key ? parentEdge.from : parentEdge.to;
                const parentLabel = graphKeyToLabel.get(otherKey);
                if (parentLabel && labelToKey.has(parentLabel)) {
                    parentKey = labelToKey.get(parentLabel)!;
                }
            }
            if (parentKey == null) {
                // fallback to root
                parentKey = 0;
            }
            // Find parent's dir to align
            const parentNode = d.findNodeForKey(parentKey) as go.Node | null;
            const pdir = parentNode?.data?.dir || 'right';
            const newData: go.ObjectData = { key: nextKey++, text: sn.label, category: 'Suggestion', dir: pdir, parent: parentKey, linkCategory: 'SuggestionLink' };
            model.addNodeData(newData);
        });
        d.commitTransaction('Refresh Suggestions');
        // Relayout after adding
        const root = d.findNodeForKey(0);
        if (root) {
            (d as any).layoutDiagram ? (d as any).layoutDiagram() : d.zoomToFit();
        }
        // Position suggestion nodes near their parent with staggered offsets
        d.startTransaction('Position Suggestions');
        const groups = new Map<any, any[]>();
        (model.nodeDataArray as any[]).forEach(nd => {
            if (nd.category === 'Suggestion' && nd.parent != null) {
                const arr = groups.get(nd.parent) || [];
                arr.push(nd);
                groups.set(nd.parent, arr);
            }
        });
        groups.forEach((arr, pkey) => {
            const parentNode = d.findNodeForKey(pkey) as go.Node | null;
            if (!parentNode) return;
            const base = parentNode.location.copy();
            const dir = parentNode.data?.dir || 'right';
            const dx = dir === 'left' ? -180 : 180; // horizontal offset
            const gap = 46; // vertical gap between suggestions
            const startY = base.y - ((arr.length - 1) * gap) / 2;
            arr.forEach((nd, i) => {
                const loc = new go.Point(base.x + dx, startY + i * gap);
                model.setDataProperty(nd, 'loc', go.Point.stringify(loc));
            });
        });
        d.commitTransaction('Position Suggestions');
    }, [suggestionNodes, suggestionEdges, graphAllNodes, showSuggestions]);

    const handleInvite = () => setInviteModalOpen(true);
    const handleLeave = () => {
        if (window.confirm("정말로 프로젝트를 나가시겠습니까?")) { toast.info("프로젝트에서 나갔습니다."); }
    };

    const handleRename = async (nextTitle: string) => {
        try {
            await updateMindmapTitle(mindmap.id, nextTitle);
            setTitle(nextTitle);
            toast.success('제목이 수정되었습니다.');
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || '제목 수정에 실패했습니다.';
            toast.error(msg);
            throw e;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            <Header
                projectName={title}
                onBack={onBack}
                onInvite={handleInvite}
                onLeave={handleLeave}
                onRename={handleRename}
                connectedUsers={connectedUsers}
                onDelete={async () => {
                    if (!window.confirm('정말 이 마인드맵을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
                    try {
                        await deleteMindmap(mindmap.id);
                        toast.success('마인드맵이 삭제되었습니다.');
                        onBack();
                    } catch (e: any) {
                        const msg = e?.response?.data?.message || e?.message || '마인드맵 삭제에 실패했습니다.';
                        toast.error(msg);
                    }
                }}
            />
            <div className="flex flex-1 overflow-hidden">
                <div className="relative flex flex-col flex-1">
                    {/* Diagram surface container */}
                    <div className="flex-1 p-2 md:p-2.5 lg:p-3.5">
                        <div className="relative w-full h-full bg-white border shadow rounded-xl border-neutral-200">
                            {/* Zoom controls */}
                            <div className="absolute z-10 flex gap-2 top-3 right-3">
                                <button onClick={() => diagramInstance.current?.commandHandler.increaseZoom()} className="px-2.5 py-1.5 text-xs rounded-md bg-white/90 border shadow">+</button>
                                <button onClick={() => diagramInstance.current?.commandHandler.decreaseZoom()} className="px-2.5 py-1.5 text-xs rounded-md bg-white/90 border shadow">-</button>
                                <button onClick={() => diagramInstance.current?.zoomToFit()} className="px-2.5 py-1.5 text-xs rounded-md bg-white/90 border shadow">맞춤</button>
                                <button onClick={() => { const d = diagramInstance.current; if (d) d.centerRect(d.documentBounds); }} className="px-2.5 py-1.5 text-xs rounded-md bg-white/90 border shadow">센터</button>
                            </div>
                            {/* Diagram canvas */}
                            <div ref={diagramRef} className="w-full h-full rounded-xl" />
                            {/* Overview minimap */}
                            <div ref={overviewRef} className="absolute w-48 h-32 border rounded-lg shadow bottom-3 right-3 bg-white/80 border-neutral-200" />
                            {/* Hover overlay */}
                            {hoverCard.visible && (
                              <div
                                className="absolute z-20 px-3 py-2 text-xs border shadow-lg rounded-xl border-slate-200 bg-white/95 text-slate-800"
                                style={{ left: hoverCard.left, top: hoverCard.top }}
                                onMouseEnter={cancelHoverHide}
                                onMouseLeave={hideHoverDelayed}
                              >
                                <div className="mb-1">해당 기능과 관련된 코드로 이동하시겠습니까?</div>
                                <div className="flex justify-end">
                                  <button
                                    className="px-2.5 py-1 rounded-md border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                                    onClick={() => {
                                      if (!hoverCard.nodeKey) {
                                        toast.error('이 노드에 연결된 코드 정보를 찾을 수 없어요.');
                                        return;
                                      }
                                      navigate(`/code?mapId=${mindmap.id}&nodeKey=${hoverCard.nodeKey}`);
                                    }}
                                  >이동</button>
                                </div>
                              </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="relative border-l border-neutral-200 w-12 min-w-[48px] sm:w-14 sm:min-w-[56px] bg-white">
                  <div className="flex flex-col items-center h-full gap-2 py-3">
                    <div className="grid w-8 h-8 text-sm font-bold text-white rounded-lg select-none bg-sky-600 place-items-center">AI</div>
                    <div className="w-6 h-px my-1 bg-neutral-200" />
                    <button className="grid rounded-lg w-9 h-9 hover:bg-neutral-100 place-items-center" title="새 채팅" onClick={() => { setChatOpen(true); setHistoryOpen(false); }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
                    </button>
                    <button className="grid rounded-lg w-9 h-9 hover:bg-neutral-100 place-items-center" title="히스토리" onClick={() => { setHistoryOpen(true); setChatOpen(false); }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M4 19V7a2 2 0 0 1 2-2h10"/><rect x="8" y="5" width="12" height="14" rx="2"/></svg>
                    </button>
                    <div className="w-6 h-px mt-2 bg-neutral-200" />
                    <div className="flex flex-col items-center flex-1 w-full gap-1 pt-1 overflow-y-auto">
                    </div>
                    <button
                      className="grid mb-2 border rounded-lg w-9 h-9 place-items-center bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100"
                      title="AI 패널 열기"
                      onClick={() => { setChatOpen(true); setHistoryOpen(false); }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                  {/* Slide-out Chat overlay */}
                  <div className={`pointer-events-none absolute inset-0 right-0 ${chatOpen ? 'z-30' : 'z-[-1]'}`}>
                    {/* Backdrop */}
                    <div
                      className={`pointer-events-auto fixed inset-0 ${chatOpen ? 'bg-black/20' : 'bg-transparent'} transition-colors duration-200`}
                      onClick={() => setChatOpen(false)}
                    />
                    <div
                      className={`pointer-events-auto fixed right-0 top-0 h-full bg-white shadow-xl border-l border-neutral-200 transition-transform duration-300 w-full sm:w-[360px] md:w-[420px] lg:w-[480px] max-w-[95vw] ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}
                      role="dialog"
                      aria-label="AI Chat Panel"
                    >
                      <div className="absolute left-[-14px] top-4">
                        <button
                          className="flex items-center justify-center bg-white border rounded-full shadow h-7 w-7 border-neutral-300 hover:bg-neutral-50"
                          title="닫기"
                          onClick={() => setChatOpen(false)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                      <div className="h-full">
                        <ChatPanel mapId={mindmap.id} showHistory={false} />
                      </div>
                    </div>
                  </div>

                  {/* Slide-out History overlay (separate from chat) */}
                  <div className={`pointer-events-none absolute inset-0 right-0 ${historyOpen ? 'z-20' : 'z-[-1]'}`}>
                    <div
                      className={`pointer-events-auto fixed inset-0 ${historyOpen ? 'bg-black/10' : 'bg-transparent'} transition-colors duration-200`}
                      onClick={() => setHistoryOpen(false)}
                    />
                    <div
                      className={`pointer-events-auto fixed right-0 top-0 h-full bg-white shadow-xl border-l border-neutral-200 transition-transform duration-300 w-full sm:w-[300px] md:w-[360px] lg:w-[400px] max-w-[95vw] ${historyOpen ? 'translate-x-0' : 'translate-x-full'}`}
                      role="dialog"
                      aria-label="Prompt History Panel"
                    >
                      <div className="absolute left-[-14px] top-4">
                        <button
                          className="flex items-center justify-center bg-white border rounded-full shadow h-7 w-7 border-neutral-300 hover:bg-neutral-50"
                          title="닫기"
                          onClick={() => setHistoryOpen(false)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                      <HistoryList mapId={mindmap.id} onUsePrompt={() => { setChatOpen(true); setHistoryOpen(false); }} />
                    </div>
                  </div>
                </div>
            </div>
            <InviteModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} mapId={mindmap.id} mindmapTitle={mindmap.title} />
        </div>
    );
}

