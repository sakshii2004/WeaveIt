/**
 * Quiet, rule-based Gap Hints engine per PRD §8.5.
 * Flags unplaced scenes, scenes missing sequence connections, and chapters with zero scenes.
 */

import type { SequenceEdgeInput } from './derivation';

export interface GapHintNode {
  id: string;
  title: string;
  sequenceIndex: number | null;
  chapterId: string | null;
}

export interface GapHintChapter {
  id: string;
  title: string;
}

export interface GapHint {
  id: string;
  type: 'unplaced_scene' | 'missing_sequence' | 'empty_chapter';
  severity: 'info' | 'warning';
  title: string;
  message: string;
  targetId: string;
}

export function evaluateGapHints(
  nodes: GapHintNode[],
  edges: SequenceEdgeInput[],
  chapters: GapHintChapter[]
): GapHint[] {
  const hints: GapHint[] = [];

  const seqEdges = edges.filter((e) => e.edgeType === 'sequence');
  const incoming = new Set<string>();
  const outgoing = new Set<string>();

  for (const e of seqEdges) {
    outgoing.add(e.sourceNodeId);
    incoming.add(e.targetNodeId);
  }

  // Find max sequence index to identify start and end of the chain
  let maxSeqIndex = -1;
  let minSeqIndex = Infinity;
  for (const node of nodes) {
    if (node.sequenceIndex !== null) {
      if (node.sequenceIndex > maxSeqIndex) maxSeqIndex = node.sequenceIndex;
      if (node.sequenceIndex < minSeqIndex) minSeqIndex = node.sequenceIndex;
    }
  }

  // 1. Unplaced scenes
  for (const node of nodes) {
    if (node.sequenceIndex === null) {
      hints.push({
        id: `unplaced-${node.id}`,
        type: 'unplaced_scene',
        severity: 'info',
        title: 'Unplaced Scene',
        message: `"${node.title}" is not yet connected to the main story sequence.`,
        targetId: node.id,
      });
    }
  }

  // 2. Missing sequence edges (for placed nodes in the middle)
  for (const node of nodes) {
    if (node.sequenceIndex !== null && maxSeqIndex > 0) {
      const isStart = node.sequenceIndex === minSeqIndex;
      const isEnd = node.sequenceIndex === maxSeqIndex;

      if (!isStart && !incoming.has(node.id)) {
        hints.push({
          id: `missing-in-${node.id}`,
          type: 'missing_sequence',
          severity: 'warning',
          title: 'Missing Preceding Scene',
          message: `"${node.title}" has no incoming sequence connection.`,
          targetId: node.id,
        });
      }

      if (!isEnd && !outgoing.has(node.id)) {
        hints.push({
          id: `missing-out-${node.id}`,
          type: 'missing_sequence',
          severity: 'warning',
          title: 'Missing Subsequent Scene',
          message: `"${node.title}" has no outgoing sequence connection.`,
          targetId: node.id,
        });
      }
    }
  }

  // 3. Chapters with zero scenes
  const scenesPerChapter = new Map<string, number>();
  for (const ch of chapters) {
    scenesPerChapter.set(ch.id, 0);
  }

  for (const node of nodes) {
    if (node.chapterId && scenesPerChapter.has(node.chapterId)) {
      scenesPerChapter.set(node.chapterId, (scenesPerChapter.get(node.chapterId) || 0) + 1);
    }
  }

  for (const ch of chapters) {
    const count = scenesPerChapter.get(ch.id) || 0;
    if (count === 0) {
      hints.push({
        id: `empty-chap-${ch.id}`,
        type: 'empty_chapter',
        severity: 'info',
        title: 'Empty Chapter',
        message: `Chapter "${ch.title}" currently has no scenes assigned.`,
        targetId: ch.id,
      });
    }
  }

  return hints;
}
