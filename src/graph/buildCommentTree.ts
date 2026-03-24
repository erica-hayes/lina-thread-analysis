import { NormalizedComment } from "../types";
import { CommentNode, CommentTree } from "./types";

export function buildCommentTree(comments: NormalizedComment[]): CommentTree {
  const byId = new Map<string, CommentNode>();

  for (const comment of comments) {
    byId.set(comment.id, {
      ...comment,
      children: [],
      parent: null,
      depth: 0
    });
  }

  const roots: CommentNode[] = [];

  for (const node of byId.values()) {
    if (!node.parentId) {
      roots.push(node);
      continue;
    }

    const parentNode = byId.get(node.parentId);
    if (!parentNode || parentNode.id === node.id) {
      roots.push(node);
      continue;
    }

    node.parent = parentNode;
    parentNode.children.push(node);
  }

  const queue: CommentNode[] = [...roots];
  const visited = new Set<string>();
  let cursor = 0;

  while (cursor < queue.length) {
    const current = queue[cursor];
    cursor += 1;
    if (!current || visited.has(current.id)) {
      continue;
    }

    visited.add(current.id);
    current.depth = current.parent ? current.parent.depth + 1 : 0;

    for (const child of current.children) {
      queue.push(child);
    }
  }

  return { roots, byId };
}