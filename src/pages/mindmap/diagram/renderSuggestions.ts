import go from 'gojs';
import type { MindmapGraphNode } from '../../../api/mindmap';

export function renderAggregatedSuggestions(diagram: go.Diagram, aggregatedSuggestionNodes: MindmapGraphNode[] | null) {
  const d = diagram;
  if (!d) return;

  const model = d.model as go.TreeModel;

  d.startTransaction('Refresh Suggestions');
  const toRemove: any[] = [];
  (model.nodeDataArray as any[]).forEach(nd => {
    if (nd.category === 'AggregatedSuggestion' || nd.category === 'AGGREGATED_SUGGESTIONS') toRemove.push(nd);
  });
  toRemove.forEach(nd => model.removeNodeData(nd));

  if (!aggregatedSuggestionNodes || aggregatedSuggestionNodes.length === 0) {
    d.commitTransaction('Refresh Suggestions');
    return;
  }

  // Resolve root location
  let rootNode: go.Node | null = null;
  (model.nodeDataArray as any[]).some(nd => {
    if (nd.parent == null) { rootNode = d.findNodeForKey(nd.key) as go.Node | null; return true; }
    return false;
  });
  const root = rootNode || d.findNodeForKey(0);
  const rootBase = root?.location.copy() || new go.Point(0, 0);
  const baseY = rootBase.y;

  // Build label -> key map from model
  const labelToKey = new Map<string, any>();
  (model.nodeDataArray as any[]).forEach(nd => { if (nd.text != null) labelToKey.set(String(nd.text), nd.key); });

  // Place near relevant target if possible
  let maxKey = 0;
  (model.nodeDataArray as any[]).forEach(nd => { const k = Number(nd.key); if (!Number.isNaN(k)) maxKey = Math.max(maxKey, k); });
  let nextKey = maxKey + 1;

  const perParentStacks = new Map<any, number>();
  const fallbackToGrid: go.ObjectData[] = [];

  const agg = aggregatedSuggestionNodes || [];
  agg.forEach((an) => {
    const newData: go.ObjectData = { key: nextKey++, text: an.label, category: 'AGGREGATED_SUGGESTIONS', dir: 'right' } as any;
    (newData as any).linkCategory = 'SuggestionLink';

    // Parse target label from suggestion label
    const parts = String(an.label).split(/[·\-]/);
    const candidate = (parts.length > 1 ? parts[1] : parts[0]).replace(/\([^)]*\)/g, '').trim();

    // Find matching node by exact or includes match
    let targetKey: any = undefined;
    if (candidate && labelToKey.has(candidate)) {
      targetKey = labelToKey.get(candidate);
    } else {
      (model.nodeDataArray as any[]).some(nd => {
        if (typeof nd.text === 'string' && nd.text.includes(candidate)) { targetKey = nd.key; return true; }
        return false;
      });
    }

    const targetNode = targetKey != null ? d.findNodeForKey(targetKey) as go.Node | null : null;
    if (targetNode) {
      const pdir = (targetNode.data as any)?.dir || 'right';
      (newData as any).parent = targetKey;
      (newData as any).dir = pdir;
      const base = targetNode.location.copy();
      const idx = perParentStacks.get(targetKey) ?? 0;
      perParentStacks.set(targetKey, idx + 1);
      const dx = pdir === 'left' ? -120 : 120;
      const gap = 40;
      const startY = base.y - ((perParentStacks.get(targetKey)! - 1) * gap) / 2;
      const loc = new go.Point(base.x + dx, startY + idx * gap);
      (newData as any).loc = go.Point.stringify(loc);
      model.addNodeData(newData);
    } else {
      fallbackToGrid.push(newData);
    }
  });

  if (fallbackToGrid.length > 0) {
    const cols = Math.min(4, Math.max(3, Math.ceil(Math.sqrt(fallbackToGrid.length))));
    const spacingX = 160;
    const spacingY = 56;
    const offsetY = 60;
    const startX = rootBase.x - ((cols - 1) * spacingX) / 2 + 40;
    fallbackToGrid.forEach((nd, i) => {
      (nd as any).parent = root?.data?.key ?? 0;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * spacingX;
      const y = baseY + offsetY + row * spacingY;
      (nd as any).loc = go.Point.stringify(new go.Point(x, y));
      model.addNodeData(nd);
    });
  }

  d.commitTransaction('Refresh Suggestions');
}
