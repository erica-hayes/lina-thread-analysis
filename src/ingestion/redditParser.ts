import { NormalizedComment } from "../types";
import { UNKNOWN_AUTHOR, normalizeId, safeString, toTimestamp } from "../utils/helpers";

interface RedditCommentData {
  id?: unknown;
  parent_id?: unknown;
  author?: unknown;
  body?: unknown;
  text?: unknown;
  created_utc?: unknown;
  created?: unknown;
  replies?: unknown;
}

interface RedditPostData {
  title?: unknown;
  selftext?: unknown;
  body?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function maybeCommentData(value: unknown): RedditCommentData | null {
  if (!isRecord(value)) {
    return null;
  }

  const hasId = typeof value.id === "string";
  const hasParentId = typeof value.parent_id === "string";
  if (!hasId || !hasParentId) {
    return null;
  }

  return value as RedditCommentData;
}

function parseSingleComment(data: RedditCommentData): NormalizedComment | null {
  const id = normalizeId(data.id);
  const parentIdRaw = normalizeId(data.parent_id);
  if (!id) {
    return null;
  }

  return {
    id,
    parentId: parentIdRaw,
    author: safeString(data.author, UNKNOWN_AUTHOR) || UNKNOWN_AUTHOR,
    body: safeString(data.body ?? data.text, ""),
    timestamp: toTimestamp(data.created_utc ?? data.created)
  };
}

export function parseRedditJson(rawRedditJson: unknown): NormalizedComment[] {
  const stack: unknown[] = [rawRedditJson];
  const results: NormalizedComment[] = [];
  const seenCommentIds = new Set<string>();

  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined || current === null) {
      continue;
    }

    if (Array.isArray(current)) {
      for (let i = current.length - 1; i >= 0; i -= 1) {
        stack.push(current[i]);
      }
      continue;
    }

    if (!isRecord(current)) {
      continue;
    }

    const directComment = maybeCommentData(current);
    if (directComment) {
      const parsed = parseSingleComment(directComment);
      if (parsed && !seenCommentIds.has(parsed.id)) {
        seenCommentIds.add(parsed.id);
        results.push(parsed);
      }
    }

    const dataComment = maybeCommentData(current.data);
    if (dataComment) {
      const parsed = parseSingleComment(dataComment);
      if (parsed && !seenCommentIds.has(parsed.id)) {
        seenCommentIds.add(parsed.id);
        results.push(parsed);
      }
    }

    if (isRecord(current.data)) {
      stack.push(current.data);
    }

    if (Array.isArray(current.children)) {
      stack.push(current.children);
    }

    if (Array.isArray(current.comments)) {
      stack.push(current.comments);
    }

    if (current.replies) {
      stack.push(current.replies);
    }
  }

  return results;
}

export function extractOriginalPostContext(rawRedditJson: unknown): { title: string; body: string } {
  const stack: unknown[] = [rawRedditJson];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    if (Array.isArray(current)) {
      for (let i = current.length - 1; i >= 0; i -= 1) {
        stack.push(current[i]);
      }
      continue;
    }

    if (!isRecord(current)) {
      continue;
    }

    const maybePost = current as RedditPostData;
    if (typeof maybePost.title === "string") {
      return {
        title: safeString(maybePost.title, ""),
        body: safeString(maybePost.selftext ?? maybePost.body, "")
      };
    }

    if (isRecord(current.post)) {
      const post = current.post as RedditPostData;
      if (typeof post.title === "string") {
        return {
          title: safeString(post.title, ""),
          body: safeString(post.selftext ?? post.body, "")
        };
      }
      stack.push(current.post);
    }

    if (isRecord(current.data)) {
      const data = current.data as RedditPostData;
      if (typeof data.title === "string") {
        return {
          title: safeString(data.title, ""),
          body: safeString(data.selftext ?? data.body, "")
        };
      }
      stack.push(current.data);
    }

    if (Array.isArray(current.children)) {
      stack.push(current.children);
    }

    if (Array.isArray(current.comments)) {
      stack.push(current.comments);
    }

    if (current.replies) {
      stack.push(current.replies);
    }
  }

  return { title: "", body: "" };
}