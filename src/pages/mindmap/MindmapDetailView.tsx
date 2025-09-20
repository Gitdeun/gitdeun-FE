import { useState, useEffect, useRef } from 'react';
import go from 'gojs';
import { toast } from 'sonner';
import {InviteModal} from "../../components/modal/InviteModal.tsx";
import type {Mindmap, MindMapDataNode} from "../../types";
import { Header } from './Header';
import { ChatPanel } from './ChatPanel';
import { updateMindmapTitle, deleteMindmap } from '../../api/mindmap';


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
    const diagramRef = useRef<HTMLDivElement>(null);
    const diagramInstance = useRef<go.Diagram | null>(null);
    const overviewRef = useRef<HTMLDivElement>(null);
    const overviewInstance = useRef<go.Overview | null>(null);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [title, setTitle] = useState(mindmap.title);
    useEffect(() => { setTitle(mindmap.title); }, [mindmap.title]);

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
        myDiagram.nodeTemplate = new go.Node('Vertical', { selectionObjectName: 'TEXT' })
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
                    toolTip: go.GraphObject.build('ToolTip').add(new go.TextBlock({ margin: 6 }).bind('text')),
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
                    toolTip: go.GraphObject.build('ToolTip').add(new go.TextBlock({ margin: 6 }).bind('text')),
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

        myDiagram.linkTemplate = new go.Link({ curve: go.Curve.Bezier, fromShortLength: -2, toShortLength: -2, selectable: false })
            .add(new go.Shape({ strokeWidth: 3 }).bind('stroke', 'brush', (brush, link) => (link as go.Link).toNode?.data.brush || brush));

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
        <div className="h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100">
            <Header
                projectName={title}
                onBack={onBack}
                onInvite={handleInvite}
                onLeave={handleLeave}
                onRename={handleRename}
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
            <div className="flex-1 flex overflow-hidden">
                <div className="relative flex flex-col flex-1">
                    {/* Diagram surface container */}
                    <div className="flex-1 p-2 md:p-2.5 lg:p-3.5">
                        <div className="h-full w-full bg-white rounded-xl border border-neutral-200 shadow relative">
                            {/* Zoom controls */}
                            <div className="absolute top-3 right-3 z-10 flex gap-2">
                                <button onClick={() => diagramInstance.current?.commandHandler.increaseZoom()} className="px-2.5 py-1.5 text-xs rounded-md bg-white/90 border shadow">+</button>
                                <button onClick={() => diagramInstance.current?.commandHandler.decreaseZoom()} className="px-2.5 py-1.5 text-xs rounded-md bg-white/90 border shadow">-</button>
                                <button onClick={() => diagramInstance.current?.zoomToFit()} className="px-2.5 py-1.5 text-xs rounded-md bg-white/90 border shadow">맞춤</button>
                                <button onClick={() => { const d = diagramInstance.current; if (d) d.centerRect(d.documentBounds); }} className="px-2.5 py-1.5 text-xs rounded-md bg-white/90 border shadow">센터</button>
                            </div>
                            {/* Diagram canvas */}
                            <div ref={diagramRef} className="h-full w-full rounded-xl" />
                            {/* Overview minimap */}
                            <div ref={overviewRef} className="absolute bottom-3 right-3 w-48 h-32 bg-white/80 border border-neutral-200 rounded-lg shadow" />
                        </div>
                    </div>
                </div>
                <div className="border-l border-neutral-200 bg-white/70 backdrop-blur-sm w-[380px] min-w-[320px] max-w-[460px]">
                    <ChatPanel />
                </div>
            </div>
            <InviteModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />
        </div>
    );
}

