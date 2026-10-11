/**
 * Auto-Arrange Layout module per PRD §8.5.
 * Calculates clean, legible canvas coordinates for the main sequence chain
 * flowing from left to right (with wrapping rows) and parks unplaced scenes neatly.
 */

export interface AutoArrangeOptions {
  nodeWidth?: number; // default: 280
  nodeHeight?: number; // default: 170
  spacingX?: number; // default: 80
  spacingY?: number; // default: 90
  startX?: number; // default: 80
  startY?: number; // default: 80
  maxPerRow?: number; // default: 5
  unplacedStartX?: number; // default: 80
  unplacedSpacingX?: number; // default: 40
}

export function calculateAutoArrangeLayout(
  orderedNodeIds: string[],
  unplacedNodeIds: string[],
  options: AutoArrangeOptions = {}
): Record<string, { x: number; y: number }> {
  const {
    nodeWidth = 280,
    nodeHeight = 170,
    spacingX = 80,
    spacingY = 90,
    startX = 80,
    startY = 80,
    maxPerRow = 5,
  } = options;

  const positions: Record<string, { x: number; y: number }> = {};

  // 1. Position ordered sequence chain in wrapping rows
  orderedNodeIds.forEach((nodeId, index) => {
    const row = Math.floor(index / maxPerRow);
    const col = index % maxPerRow;

    const x = startX + col * (nodeWidth + spacingX);
    const y = startY + row * (nodeHeight + spacingY);

    positions[nodeId] = { x, y };
  });

  // Calculate bounding box of sequence nodes
  const totalRows = Math.ceil(orderedNodeIds.length / maxPerRow);
  const sequenceBottom =
    orderedNodeIds.length > 0 ? startY + totalRows * (nodeHeight + spacingY) : startY;

  // 2. Position unplaced nodes in a neat grid below the sequence chain
  const unplacedStartY = orderedNodeIds.length > 0 ? sequenceBottom + 80 : startY;
  const unplacedMaxPerRow = 4;

  unplacedNodeIds.forEach((nodeId, index) => {
    const row = Math.floor(index / unplacedMaxPerRow);
    const col = index % unplacedMaxPerRow;

    const x = startX + col * (nodeWidth + spacingX);
    const y = unplacedStartY + row * (nodeHeight + spacingY);

    positions[nodeId] = { x, y };
  });

  return positions;
}
