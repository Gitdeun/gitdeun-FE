import go from 'gojs';
import type { MindMapDataNode } from '../../../types';

export type Direction = 'left' | 'right';

// Transform raw MindMapDataNode into GoJS TreeModel nodes
export function transformDataForMindMapSample(data: MindMapDataNode) {
  const nodeDataArray: go.ObjectData[] = [];
  let keyCounter = 0;
  const branchColors = [
    '#51a1e6', // blue
    '#66d456', // green
    '#e57373', // red
    '#ff8a65', // orange
    '#ba68c8', // purple
    '#90a4ae', // gray-blue
  ];

  function traverse(node: MindMapDataNode, parentKey: number | null, dir: Direction | null, brush: string) {
    const currentKey = keyCounter++;
    const nodeData: go.ObjectData = {
      key: currentKey,
      ...(parentKey !== null && { parent: parentKey }),
      text: node.node,
      brush,
      dir,
    };
    if (parentKey === null) nodeData.category = 'Root';

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
}

