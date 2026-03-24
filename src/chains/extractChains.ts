import { CommentNode, CommentTree } from "../graph/types";
import { Chain } from "./types";

function collectParticipants(commentIds: string[], byId: Map<string, CommentNode>): string[] {
  const participants = new Set<string>();
  for (const commentId of commentIds) {
    const node = byId.get(commentId);
    if (node) {
      participants.add(node.author);
    }
  }
  return [...participants];
}

export function extractChains(tree: CommentTree): Chain[] {
  const chains: Chain[] = [];
  let chainCounter = 0;

  const stack: Array<{ node: CommentNode; path: string[] }> = [];
  for (const root of tree.roots) {
    stack.push({ node: root, path: [root.id] });
  }

  while (stack.length > 0) {
    const item = stack.pop();
    if (!item) {
      continue;
    }

    const { node, path } = item;
    if (node.children.length === 0 && path.length > 1) {
      chainCounter += 1;
      chains.push({
        id: `path-${chainCounter}`,
        commentIds: path,
        participants: collectParticipants(path, tree.byId)
      });
      continue;
    }

    for (const child of node.children) {
      stack.push({ node: child, path: [...path, child.id] });
    }
  }

  const pairChains = new Map<string, string[]>();
  for (const node of tree.byId.values()) {
    if (!node.parent) {
      continue;
    }

    const a = node.author;
    const b = node.parent.author;
    if (a === b) {
      continue;
    }

    const pairKey = a < b ? `${a}|${b}` : `${b}|${a}`;
    const list = pairChains.get(pairKey) ?? [];
    if (list.length === 0 || list[list.length - 1] !== node.parent.id) {
      list.push(node.parent.id);
    }
    list.push(node.id);
    pairChains.set(pairKey, list);
  }

  for (const commentIds of pairChains.values()) {
    if (commentIds.length < 4) {
      continue;
    }

    chainCounter += 1;
    chains.push({
      id: `pair-${chainCounter}`,
      commentIds,
      participants: collectParticipants(commentIds, tree.byId)
    });
  }

  return chains;
}