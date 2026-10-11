/**
 * Pure sequence derivation and main-path validation engine per PRD §7.4 & §8.5.
 * Strictly guarantees that main-path sequence edges form a single acyclic chain.
 */

export interface SequenceEdgeInput {
  id?: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: string;
}

export interface SequenceValidationResult {
  isValid: boolean;
  error?: string;
  orderedNodeIds: string[]; // Node IDs in sequence order (index 0, 1, 2, ...)
  unplacedNodeIds: string[]; // Node IDs not on the sequence chain (sequence_index = null)
  sequenceIndices: Record<string, number | null>; // Map nodeId -> sequence_index
}

/**
 * Derives linear scene order and validates main-path constraints.
 *
 * Rules:
 * 1. Only 'sequence' edges form the main path.
 * 2. No node may have > 1 outgoing sequence edge (rejects branching).
 * 3. No node may have > 1 incoming sequence edge (rejects convergence).
 * 4. No cycles allowed (rejects loops).
 * 5. Must form at most a single contiguous sequence chain.
 */
export function deriveSequence(
  nodeIds: string[],
  edges: SequenceEdgeInput[]
): SequenceValidationResult {
  const sequenceIndices: Record<string, number | null> = {};
  for (const id of nodeIds) {
    sequenceIndices[id] = null;
  }

  // Filter only main-path 'sequence' edges
  const seqEdges = edges.filter((e) => e.edgeType === 'sequence');

  // If no sequence edges, all nodes are unplaced
  if (seqEdges.length === 0) {
    return {
      isValid: true,
      orderedNodeIds: [],
      unplacedNodeIds: [...nodeIds],
      sequenceIndices,
    };
  }

  // Adjacency and degree maps
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  for (const e of seqEdges) {
    // Check self-loop
    if (e.sourceNodeId === e.targetNodeId) {
      return {
        isValid: false,
        error: 'Self-referential sequence loop detected: A scene cannot connect to itself.',
        orderedNodeIds: [],
        unplacedNodeIds: [...nodeIds],
        sequenceIndices,
      };
    }

    const outList = outgoing.get(e.sourceNodeId) || [];
    outList.push(e.targetNodeId);
    outgoing.set(e.sourceNodeId, outList);

    const inList = incoming.get(e.targetNodeId) || [];
    inList.push(e.sourceNodeId);
    incoming.set(e.targetNodeId, inList);
  }

  // 1. Validate out-degree: No node may have > 1 outgoing sequence edge
  for (const targets of outgoing.values()) {
    if (targets.length > 1) {
      return {
        isValid: false,
        error:
          'Branching sequence detected: A scene cannot lead to multiple sequence paths. Use a branch edge for alternate narrative paths.',
        orderedNodeIds: [],
        unplacedNodeIds: [...nodeIds],
        sequenceIndices,
      };
    }
  }

  // 2. Validate in-degree: No node may have > 1 incoming sequence edge
  for (const sources of incoming.values()) {
    if (sources.length > 1) {
      return {
        isValid: false,
        error:
          'Convergence detected: Multiple scenes cannot lead into the same sequence scene in the main path.',
        orderedNodeIds: [],
        unplacedNodeIds: [...nodeIds],
        sequenceIndices,
      };
    }
  }

  // 3. Cycle detection using DFS visited states (0: unvisited, 1: visiting, 2: visited)
  const state = new Map<string, number>();
  const allSeqNodes = new Set<string>();
  for (const e of seqEdges) {
    allSeqNodes.add(e.sourceNodeId);
    allSeqNodes.add(e.targetNodeId);
  }

  function hasCycle(node: string): boolean {
    state.set(node, 1); // visiting
    const nextList = outgoing.get(node) || [];
    for (const next of nextList) {
      const s = state.get(next) || 0;
      if (s === 1) return true; // back edge = cycle
      if (s === 0 && hasCycle(next)) return true;
    }
    state.set(node, 2); // visited
    return false;
  }

  for (const node of allSeqNodes) {
    if ((state.get(node) || 0) === 0) {
      if (hasCycle(node)) {
        return {
          isValid: false,
          error:
            'Sequence cycle detected: The main path cannot contain circular loops.',
          orderedNodeIds: [],
          unplacedNodeIds: [...nodeIds],
          sequenceIndices,
        };
      }
    }
  }

  // 4. Find root/head nodes (in-degree == 0 among sequence nodes)
  const headNodes: string[] = [];
  for (const node of allSeqNodes) {
    const inCount = incoming.get(node)?.length || 0;
    if (inCount === 0) {
      headNodes.push(node);
    }
  }

  // If there are sequence edges but no head node, it's a closed cycle (already caught, but safeguard)
  if (headNodes.length === 0) {
    return {
      isValid: false,
      error: 'Sequence cycle detected: No starting scene found for the main path.',
      orderedNodeIds: [],
      unplacedNodeIds: [...nodeIds],
      sequenceIndices,
    };
  }

  // If there are multiple disconnected sequence components:
  if (headNodes.length > 1) {
    return {
      isValid: false,
      error:
        'Multiple disconnected sequence chains detected. Connect them into a single linear sequence or convert annotation edges.',
      orderedNodeIds: [],
      unplacedNodeIds: [...nodeIds],
      sequenceIndices,
    };
  }

  // 5. Traverse the single linear chain from the head
  const orderedNodeIds: string[] = [];
  let current: string | undefined = headNodes[0];
  const visitedInChain = new Set<string>();

  while (current) {
    orderedNodeIds.push(current);
    visitedInChain.add(current);
    const nextList = outgoing.get(current);
    current = nextList && nextList.length > 0 ? nextList[0] : undefined;
  }

  // Verify all sequence nodes were visited in this single chain
  if (visitedInChain.size !== allSeqNodes.size) {
    return {
      isValid: false,
      error:
        'Multiple disconnected sequence chains detected. All sequence connections must form one continuous path.',
      orderedNodeIds: [],
      unplacedNodeIds: [...nodeIds],
      sequenceIndices,
    };
  }

  // 6. Assign sequence indices: 0, 1, 2, ...
  orderedNodeIds.forEach((id, idx) => {
    sequenceIndices[id] = idx;
  });

  const orderedSet = new Set(orderedNodeIds);
  const unplacedNodeIds = nodeIds.filter((id) => !orderedSet.has(id));

  return {
    isValid: true,
    orderedNodeIds,
    unplacedNodeIds,
    sequenceIndices,
  };
}
