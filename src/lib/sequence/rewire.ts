/**
 * Sequence Rewiring module per PRD §8.5.
 * When dragging scenes in the Sequence Tray or reordering scenes,
 * rewires sequence edges between the newly ordered nodes while preserving
 * all existing annotation edges (branch, cause, setup_payoff).
 */

import type { SequenceEdgeInput } from './derivation';

export interface RewireResult {
  newEdges: {
    sourceNodeId: string;
    targetNodeId: string;
    edgeType: 'sequence';
  }[];
  sequenceMap: Record<string, number>;
}

/**
 * Creates contiguous sequence pairs (orderedNodeIds[i] -> orderedNodeIds[i+1])
 * and generates the new sequence map.
 */
export function rewireSequenceOrder(orderedNodeIds: string[]): RewireResult {
  const newEdges: {
    sourceNodeId: string;
    targetNodeId: string;
    edgeType: 'sequence';
  }[] = [];

  const sequenceMap: Record<string, number> = {};

  for (let i = 0; i < orderedNodeIds.length; i++) {
    const currentId = orderedNodeIds[i];
    sequenceMap[currentId] = i;

    if (i < orderedNodeIds.length - 1) {
      const nextId = orderedNodeIds[i + 1];
      newEdges.push({
        sourceNodeId: currentId,
        targetNodeId: nextId,
        edgeType: 'sequence',
      });
    }
  }

  return {
    newEdges,
    sequenceMap,
  };
}

/**
 * Recombines newly rewired sequence edges with preserved annotation edges.
 */
export function mergeRewiredEdges(
  rewiredSequenceEdges: {
    sourceNodeId: string;
    targetNodeId: string;
    edgeType: 'sequence';
  }[],
  existingEdges: SequenceEdgeInput[]
): SequenceEdgeInput[] {
  const nonSequenceEdges = existingEdges.filter((e) => e.edgeType !== 'sequence');
  return [...nonSequenceEdges, ...rewiredSequenceEdges];
}
