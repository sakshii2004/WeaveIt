import { describe, it, expect } from 'vitest';
import {
  deriveSequence,
  rewireSequenceOrder,
  calculateAutoArrangeLayout,
  evaluateGapHints,
} from '@/lib/sequence';

describe('Sequence Derivation & Main-Path Validation Engine', () => {
  it('returns all nodes as unplaced when no sequence edges exist', () => {
    const nodes = ['node-1', 'node-2', 'node-3'];
    const result = deriveSequence(nodes, []);

    expect(result.isValid).toBe(true);
    expect(result.orderedNodeIds).toEqual([]);
    expect(result.unplacedNodeIds).toEqual(['node-1', 'node-2', 'node-3']);
    expect(result.sequenceIndices).toEqual({
      'node-1': null,
      'node-2': null,
      'node-3': null,
    });
  });

  it('correctly derives a linear sequence chain from sequence edges', () => {
    const nodes = ['node-a', 'node-b', 'node-c', 'node-d', 'unplaced-1'];
    const edges = [
      { sourceNodeId: 'node-a', targetNodeId: 'node-b', edgeType: 'sequence' },
      { sourceNodeId: 'node-b', targetNodeId: 'node-c', edgeType: 'sequence' },
      { sourceNodeId: 'node-c', targetNodeId: 'node-d', edgeType: 'sequence' },
    ];

    const result = deriveSequence(nodes, edges);

    expect(result.isValid).toBe(true);
    expect(result.orderedNodeIds).toEqual(['node-a', 'node-b', 'node-c', 'node-d']);
    expect(result.unplacedNodeIds).toEqual(['unplaced-1']);
    expect(result.sequenceIndices).toEqual({
      'node-a': 0,
      'node-b': 1,
      'node-c': 2,
      'node-d': 3,
      'unplaced-1': null,
    });
  });

  it('ignores non-sequence annotation edges (branch, cause, setup_payoff)', () => {
    const nodes = ['node-1', 'node-2', 'node-3'];
    const edges = [
      { sourceNodeId: 'node-1', targetNodeId: 'node-2', edgeType: 'sequence' },
      { sourceNodeId: 'node-1', targetNodeId: 'node-3', edgeType: 'branch' },
      { sourceNodeId: 'node-2', targetNodeId: 'node-3', edgeType: 'cause' },
      { sourceNodeId: 'node-1', targetNodeId: 'node-3', edgeType: 'setup_payoff' },
    ];

    const result = deriveSequence(nodes, edges);

    expect(result.isValid).toBe(true);
    expect(result.orderedNodeIds).toEqual(['node-1', 'node-2']);
    expect(result.unplacedNodeIds).toEqual(['node-3']);
    expect(result.sequenceIndices['node-1']).toBe(0);
    expect(result.sequenceIndices['node-2']).toBe(1);
    expect(result.sequenceIndices['node-3']).toBe(null);
  });

  it('rejects branching sequence paths where one node has multiple outgoing sequence edges', () => {
    const nodes = ['node-root', 'node-branch-1', 'node-branch-2'];
    const edges = [
      { sourceNodeId: 'node-root', targetNodeId: 'node-branch-1', edgeType: 'sequence' },
      { sourceNodeId: 'node-root', targetNodeId: 'node-branch-2', edgeType: 'sequence' },
    ];

    const result = deriveSequence(nodes, edges);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Branching sequence detected');
  });

  it('rejects converging sequence paths where one node has multiple incoming sequence edges', () => {
    const nodes = ['node-1', 'node-2', 'node-target'];
    const edges = [
      { sourceNodeId: 'node-1', targetNodeId: 'node-target', edgeType: 'sequence' },
      { sourceNodeId: 'node-2', targetNodeId: 'node-target', edgeType: 'sequence' },
    ];

    const result = deriveSequence(nodes, edges);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Convergence detected');
  });

  it('rejects circular cycles in sequence edges', () => {
    const nodes = ['node-1', 'node-2', 'node-3'];
    const edges = [
      { sourceNodeId: 'node-1', targetNodeId: 'node-2', edgeType: 'sequence' },
      { sourceNodeId: 'node-2', targetNodeId: 'node-3', edgeType: 'sequence' },
      { sourceNodeId: 'node-3', targetNodeId: 'node-1', edgeType: 'sequence' },
    ];

    const result = deriveSequence(nodes, edges);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Sequence cycle detected');
  });

  it('rejects self-referential loops', () => {
    const nodes = ['node-1'];
    const edges = [{ sourceNodeId: 'node-1', targetNodeId: 'node-1', edgeType: 'sequence' }];

    const result = deriveSequence(nodes, edges);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Self-referential sequence loop detected');
  });

  it('rejects multiple disconnected sequence subchains', () => {
    const nodes = ['node-a', 'node-b', 'node-c', 'node-d'];
    const edges = [
      { sourceNodeId: 'node-a', targetNodeId: 'node-b', edgeType: 'sequence' },
      { sourceNodeId: 'node-c', targetNodeId: 'node-d', edgeType: 'sequence' },
    ];

    const result = deriveSequence(nodes, edges);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Multiple disconnected sequence chains detected');
  });
});

describe('Sequence Rewiring (Tray Reorder)', () => {
  it('rewires sequence edges correctly when tray order changes', () => {
    const reordered = ['node-3', 'node-1', 'node-2'];
    const { newEdges, sequenceMap } = rewireSequenceOrder(reordered);

    expect(newEdges).toHaveLength(2);
    expect(newEdges[0]).toEqual({
      sourceNodeId: 'node-3',
      targetNodeId: 'node-1',
      edgeType: 'sequence',
    });
    expect(newEdges[1]).toEqual({
      sourceNodeId: 'node-1',
      targetNodeId: 'node-2',
      edgeType: 'sequence',
    });
    expect(sequenceMap).toEqual({
      'node-3': 0,
      'node-1': 1,
      'node-2': 2,
    });
  });
});

describe('Auto-Arrange Layout Algorithm', () => {
  it('calculates grid positions for ordered nodes and unplaced nodes', () => {
    const ordered = ['n1', 'n2', 'n3'];
    const unplaced = ['u1', 'u2'];

    const positions = calculateAutoArrangeLayout(ordered, unplaced, {
      startX: 100,
      startY: 100,
      nodeWidth: 200,
      spacingX: 50,
      maxPerRow: 2,
    });

    // Row 0: n1, n2
    expect(positions['n1']).toEqual({ x: 100, y: 100 });
    expect(positions['n2']).toEqual({ x: 100 + 250, y: 100 });
    // Row 1: n3
    expect(positions['n3'].x).toBe(100);
    expect(positions['n3'].y).toBeGreaterThan(100);

    // Unplaced should be placed below
    expect(positions['u1'].y).toBeGreaterThan(positions['n3'].y);
    expect(positions['u2'].y).toBeGreaterThan(positions['n3'].y);
  });
});

describe('Gap Hints Evaluation', () => {
  it('flags unplaced scenes and empty chapters', () => {
    const nodes = [
      { id: 'n1', title: 'Scene 1', sequenceIndex: 0, chapterId: 'ch1' },
      { id: 'n2', title: 'Scene 2', sequenceIndex: null, chapterId: null },
    ];
    const edges: Array<{ sourceNodeId: string; targetNodeId: string; edgeType: string }> = [];
    const chapters = [
      { id: 'ch1', title: 'Chapter 1' },
      { id: 'ch2', title: 'Chapter 2' },
    ];

    const hints = evaluateGapHints(nodes, edges, chapters);

    expect(hints.some((h) => h.type === 'unplaced_scene' && h.targetId === 'n2')).toBe(true);
    expect(hints.some((h) => h.type === 'empty_chapter' && h.targetId === 'ch2')).toBe(true);
  });
});
