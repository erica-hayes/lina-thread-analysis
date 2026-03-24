import { NormalizedComment } from "../types";

export interface CommentNode extends NormalizedComment {
  children: CommentNode[];
  parent: CommentNode | null;
  depth: number;
}

export interface CommentTree {
  roots: CommentNode[];
  byId: Map<string, CommentNode>;
}