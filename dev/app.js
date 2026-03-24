function formatUnixDate(unixSeconds) {
  if (!unixSeconds) {
    return "unknown";
  }

  const date = new Date(unixSeconds * 1000);
  return date.toLocaleString();
}

function createCard(label, value) {
  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = `<span class="label">${label}</span><span class="value">${value}</span>`;
  return el;
}

function toToneClass(tone) {
  if (tone === "positive") {
    return "tone-positive";
  }
  if (tone === "negative") {
    return "tone-negative";
  }
  return "tone-neutral";
}

function mapSensitivity(level) {
  if (level === "critical") {
    return "high";
  }
  return level || "none";
}

function formatList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "none";
  }
  return items.join(", ");
}

function countNestedComments(comments) {
  if (!Array.isArray(comments)) {
    return 0;
  }

  let count = 0;
  for (const comment of comments) {
    count += 1;
    count += countNestedComments(comment.replies);
  }
  return count;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function compactText(value, maxLen = 220) {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= maxLen) {
    return normalized;
  }

  return `${normalized.slice(0, maxLen - 1)}...`;
}

function flattenCommentsById(comments, map = {}) {
  if (!Array.isArray(comments)) {
    return map;
  }

  for (const comment of comments) {
    if (!comment || typeof comment !== "object") {
      continue;
    }

    if (comment.id) {
      map[comment.id] = comment;
    }

    if (Array.isArray(comment.replies) && comment.replies.length > 0) {
      flattenCommentsById(comment.replies, map);
    }
  }

  return map;
}

function extractSignalToken(raw) {
  const input = String(raw || "");
  const splitIndex = input.indexOf(" (");
  const token = splitIndex === -1 ? input : input.slice(0, splitIndex);
  return token.trim();
}

function getByPath(root, path) {
  if (!path) {
    return undefined;
  }
  const parts = path.split(".");
  let current = root;
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

function isEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function evaluateCheck(dataset, check) {
  const actual = getByPath(dataset, check.path);
  const expected = check.expected;
  let pass = false;

  if (check.op === "eq") {
    pass = isEqual(actual, expected);
  } else if (check.op === "neq") {
    pass = !isEqual(actual, expected);
  } else if (check.op === "gte") {
    pass = Number(actual) >= Number(expected);
  } else if (check.op === "lte") {
    pass = Number(actual) <= Number(expected);
  } else if (check.op === "includesAll") {
    const actualList = Array.isArray(actual) ? actual : [];
    const expectedList = Array.isArray(expected) ? expected : [];
    pass = expectedList.every((item) => actualList.includes(item));
  }

  return {
    id: check.id,
    label: check.label,
    op: check.op,
    path: check.path,
    pass,
    actual,
    expected
  };
}

function formatValue(value) {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}

function buildMetrics(result) {
  const comments = result.comments || [];
  const roles = Object.values(result.summary?.userRoles || {});
  const roleCounts = roles.reduce((acc, role) => {
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  return {
    commentCount: comments.length,
    suppressedTone: comments.filter((item) => item.toneLabel === null).length,
    suppressedIntent: comments.filter((item) => item.intentLabel === null).length,
    roleCounts
  };
}

function evaluatePerCommentExpectations(result, perCommentExpectations, sourceCommentsById) {
  if (!perCommentExpectations || typeof perCommentExpectations !== "object") {
    return [];
  }

  const commentsById = Object.fromEntries((result.comments || []).map((item) => [item.id, item]));
  const entries = Object.entries(perCommentExpectations);
  const evaluation = [];

  for (const [commentId, expected] of entries) {
    const actual = commentsById[commentId];
    if (!actual) {
      evaluation.push({
        id: `comment-${commentId}`,
        commentId,
        label: `Comment ${commentId}`,
        pass: false,
        meta: `missing actual comment ${commentId}`,
        commentText: compactText(sourceCommentsById?.[commentId]?.text || sourceCommentsById?.[commentId]?.body || "")
      });
      continue;
    }

    const mismatches = [];
    for (const [field, expectedValue] of Object.entries(expected)) {
      const actualValue = actual[field];
      if (!isEqual(actualValue, expectedValue)) {
        mismatches.push(`${field}: expected ${formatValue(expectedValue)} actual ${formatValue(actualValue)}`);
      }
    }

    evaluation.push({
      id: `comment-${commentId}`,
      commentId,
      label: `Comment ${commentId}`,
      pass: mismatches.length === 0,
      meta:
        mismatches.length === 0
          ? `fields matched: ${Object.keys(expected).join(", ")}`
          : mismatches.join(" | "),
      commentText: compactText(sourceCommentsById?.[commentId]?.text || sourceCommentsById?.[commentId]?.body || "")
    });
  }

  return evaluation;
}

function highlightTextWithTokens(text, tokens) {
  let rendered = escapeHtml(text);
  const unique = Array.from(new Set((tokens || []).map((item) => String(item || "").trim()).filter(Boolean))).sort(
    (a, b) => b.length - a.length
  );

  for (const token of unique) {
    if (token.length < 3) {
      continue;
    }
    const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escapedToken, "gi");
    rendered = rendered.replace(pattern, (match) => `<mark class=\"token-hit\">${match}</mark>`);
  }

  return rendered;
}

function renderThreadNode(node, depth = 0) {
  const wrapper = document.createElement("article");
  wrapper.className = "thread-comment";
  wrapper.dataset.commentId = node.id;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = `u/${node.author || "unknown"} | score ${node.score ?? 0} | depth ${depth}`;

  const body = document.createElement("div");
  body.className = "body";
  body.dataset.originalText = node.text || node.body || "";
  body.textContent = body.dataset.originalText;

  wrapper.appendChild(meta);
  wrapper.appendChild(body);

  if (Array.isArray(node.replies) && node.replies.length > 0) {
    const children = document.createElement("div");
    children.className = "thread-children";
    for (const reply of node.replies) {
      children.appendChild(renderThreadNode(reply, depth + 1));
    }
    wrapper.appendChild(children);
  }

  return wrapper;
}

function renderThread(mock, threadRoot) {
  threadRoot.innerHTML = "";

  const postCard = document.createElement("article");
  postCard.className = "thread-post";
  postCard.innerHTML = `
    <div class="meta">OP by u/${escapeHtml(mock.post?.author || "unknown")} in r/${escapeHtml(mock.post?.subreddit || "reddit")}</div>
    <div class="body"><strong>${escapeHtml(mock.post?.title || "")}</strong><br/><br/>${escapeHtml(mock.post?.body || "")}</div>
  `;
  threadRoot.appendChild(postCard);

  for (const comment of mock.comments || []) {
    threadRoot.appendChild(renderThreadNode(comment, comment.depth || 0));
  }
}

function applyThreadHighlight(state) {
  const cards = document.querySelectorAll(".thread-comment");

  for (const card of cards) {
    const commentId = card.dataset.commentId;
    const body = card.querySelector(".body");
    const originalText = body?.dataset.originalText || "";
    const isHighlighted = state.highlightedCommentIds.has(commentId);

    card.classList.toggle("highlighted", isHighlighted);
    body.classList.toggle("full-highlight", isHighlighted);

    // Keep rendering plain text; highlight is applied to the entire comment body.
    body.textContent = originalText;
  }

  const idsToScroll = Array.isArray(state.scrollToCommentIds) ? state.scrollToCommentIds : [];
  if (idsToScroll.length > 0) {
    if (idsToScroll.length === 1) {
      const target = document.querySelector(`.thread-comment[data-comment-id=\"${idsToScroll[0]}\"]`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else if (idsToScroll.length <= 8) {
      idsToScroll.forEach((id, index) => {
        setTimeout(() => {
          const target = document.querySelector(`.thread-comment[data-comment-id=\"${id}\"]`);
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, index * 450);
      });
    } else {
      const target = document.querySelector(`.thread-comment[data-comment-id=\"${idsToScroll[0]}\"]`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    state.scrollToCommentIds = [];
  }
}

function setHighlight(state, commentIds, tokenMap = {}, scrollToCommentId = null) {
  const normalizedIds = Array.from(new Set(commentIds || [])).filter(Boolean);
  state.highlightedCommentIds = new Set(normalizedIds);
  state.highlightTokensByCommentId = tokenMap || {};

  if (scrollToCommentId) {
    state.scrollToCommentIds = [scrollToCommentId];
  } else {
    state.scrollToCommentIds = normalizedIds;
  }

  applyThreadHighlight(state);
}

function activateTab(tab) {
  const buttons = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");

  for (const btn of buttons) {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  }

  for (const panel of panels) {
    panel.classList.toggle("hidden", panel.id !== `tab-${tab}`);
  }
}

function renderOverviewTab(tabOverview, data, state) {
  const { result, sourceCommentsById, analysisById } = data;
  const roles = result.summary?.userRoles || {};
  const roleCounts = Object.values(roles).reduce((acc, role) => {
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const roleButtons = Object.entries(roleCounts)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([role, count]) =>
        `<button class=\"mini-btn\" data-role=\"${escapeHtml(role)}\" type=\"button\">${escapeHtml(role)} (${count})</button>`
    )
    .join("");

  tabOverview.innerHTML = `
    <div class="stack">
      <div class="card">
        <span class="label">Content Sensitivity</span>
        <span class="value">${escapeHtml(mapSensitivity(result.summary?.threadTopicRisk?.level))}</span>
      </div>
      <div class="card">
        <span class="label">Conversation Climate</span>
        <span class="value">${escapeHtml(result.summary?.conversationClimate?.label || "unknown")}</span>
      </div>
      <div class="card">
        <span class="label">Conversation Alignment</span>
        <span class="value">${escapeHtml(result.summary?.alignment?.label || "unknown")}</span>
      </div>
      <div class="card">
        <span class="label">Topic Evidence</span>
        <span class="value">${escapeHtml(formatList(result.summary?.threadTopicRisk?.evidenceSnippets || []))}</span>
      </div>
    </div>

    <h3>Role Map</h3>
    <div class="mini-grid">${roleButtons}</div>

    <h3>Topic Evidence Highlight</h3>
    <button id="highlight-topic-evidence" class="mini-btn" type="button">Highlight Evidence Snippets In Thread</button>
  `;

  for (const roleBtn of tabOverview.querySelectorAll("button[data-role]")) {
    roleBtn.addEventListener("click", () => {
      const role = roleBtn.dataset.role;
      const ids = Object.entries(roles)
        .filter(([, value]) => value === role)
        .map(([id]) => id)
        .filter((id) => sourceCommentsById[id]);
      setHighlight(state, ids);
    });
  }

  const topicEvidenceButton = tabOverview.querySelector("#highlight-topic-evidence");
  topicEvidenceButton?.addEventListener("click", () => {
    const snippets = result.summary?.threadTopicRisk?.evidenceSnippets || [];
    const tokenMap = {};
    const ids = [];

    for (const [id, source] of Object.entries(sourceCommentsById)) {
      const text = String(source.text || source.body || "").toLowerCase();
      const hits = snippets.filter((snippet) => text.includes(String(snippet).toLowerCase()));
      if (hits.length > 0) {
        ids.push(id);
        tokenMap[id] = hits;
      }
    }

    setHighlight(state, ids, tokenMap);
  });
}

function renderAnalysisTab(tabAnalysis, data, state) {
  const { result, sourceCommentsById, analysisById } = data;
  const comments = result.comments || [];

  const countBy = (key, value) => comments.filter((item) => item[key] === value).length;

  const toneButtons = ["positive", "negative", "neutral"]
    .map((tone) => `<button class=\"mini-btn\" data-tone=\"${tone}\" type=\"button\">Tone: ${tone} (${countBy("tone", tone)})</button>`)
    .join("");

  const nuanceEntries = Object.entries(result.uiIndex?.counts?.nuance || {}).sort((a, b) => b[1] - a[1]);
  const nuanceButtons = nuanceEntries
    .map(
      ([nuance, count]) =>
        `<button class=\"mini-btn\" data-nuance=\"${escapeHtml(nuance)}\" type=\"button\">Nuance: ${escapeHtml(
          nuance
        )} (${count})</button>`
    )
    .join("");

  const intentValues = ["supportive", "critical", "curious", "adversarial", "neutral"];
  const intentButtons = intentValues
    .map(
      (intent) =>
        `<button class=\"mini-btn\" data-intent=\"${intent}\" type=\"button\">Intent: ${intent} (${countBy("intent", intent)})</button>`
    )
    .join("");

  const riskValues = ["critical", "high", "moderate", "low", "none"];
  const riskButtons = riskValues
    .map((risk) => `<button class=\"mini-btn\" data-risk=\"${risk}\" type=\"button\">Risk: ${risk} (${countBy("riskLevel", risk)})</button>`)
    .join("");

  const topSignals = Object.entries(result.uiIndex?.counts?.signals || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(
      ([signal, count]) =>
        `<button class=\"mini-btn\" data-signal=\"${escapeHtml(signal)}\" type=\"button\">Signal: ${escapeHtml(signal)} (${count})</button>`
    )
    .join("");

  tabAnalysis.innerHTML = `
    <h3>Tone Lens</h3>
    <div class="mini-grid">${toneButtons}</div>

    <h3>Behavioral Nuance Lens</h3>
    <div class="mini-grid">${nuanceButtons || "<span class=\"validation-meta\">No nuance data</span>"}</div>

    <h3>Intent Lens</h3>
    <div class="mini-grid">${intentButtons}</div>

    <h3>Risk Lens</h3>
    <div class="mini-grid">${riskButtons}</div>

    <h3>Signal Lens</h3>
    <div class="mini-grid">${topSignals}</div>
  `;

  for (const btn of tabAnalysis.querySelectorAll("button[data-tone]")) {
    btn.addEventListener("click", () => {
      const tone = btn.dataset.tone;
      const matched = comments.filter((item) => item.tone === tone).map((item) => item.id);
      setHighlight(state, matched);
    });
  }

  for (const btn of tabAnalysis.querySelectorAll("button[data-nuance]")) {
    btn.addEventListener("click", () => {
      const nuance = btn.dataset.nuance;
      const matched = comments.filter((item) => item.nuance === nuance).map((item) => item.id);
      setHighlight(state, matched);
    });
  }

  for (const btn of tabAnalysis.querySelectorAll("button[data-intent]")) {
    btn.addEventListener("click", () => {
      const intent = btn.dataset.intent;
      const matched = comments.filter((item) => item.intent === intent).map((item) => item.id);
      setHighlight(state, matched);
    });
  }

  for (const btn of tabAnalysis.querySelectorAll("button[data-risk]")) {
    btn.addEventListener("click", () => {
      const risk = btn.dataset.risk;
      const matched = comments.filter((item) => item.riskLevel === risk).map((item) => item.id);
      setHighlight(state, matched);
    });
  }

  for (const btn of tabAnalysis.querySelectorAll("button[data-signal]")) {
    btn.addEventListener("click", () => {
      const signal = btn.dataset.signal;
      const matchedComments = comments.filter((item) => (item.signals || []).includes(signal));
      const ids = matchedComments.map((item) => item.id);
      const tokenMap = {};

      for (const item of matchedComments) {
        const tokens = (item.signalEvidence || []).map((entry) => extractSignalToken(entry));
        if (tokens.length > 0) {
          tokenMap[item.id] = tokens;
        }
      }

      setHighlight(state, ids, tokenMap);
    });
  }
}

function renderValidationTab(tabValidation, data, state) {
  const { expectedSpec, result, metrics, sourceCommentsById } = data;

  if (!expectedSpec) {
    tabValidation.innerHTML = `<div class=\"card\"><span class=\"value\">No expected outcome spec loaded</span></div>`;
    return;
  }

  const dataset = { result, metrics };
  const globalResults = (expectedSpec.checks || []).map((check) => evaluateCheck(dataset, check));
  const commentResults = evaluatePerCommentExpectations(result, expectedSpec.perCommentExpectations, sourceCommentsById);
  const allResults = [...globalResults, ...commentResults];
  const passedCount = allResults.filter((item) => item.pass).length;

  const globalRows = globalResults
    .map(
      (item) => `
      <div class=\"validation-row ${item.pass ? "pass" : "fail"}\">
        <div class=\"validation-header\">
          <span class=\"status-pill ${item.pass ? "pass" : "fail"}\">${item.pass ? "pass" : "fail"}</span>
          <strong>${escapeHtml(item.label || item.id)}</strong>
        </div>
        <div class=\"validation-meta\">path: ${escapeHtml(item.path)} | op: ${escapeHtml(item.op)} | expected: ${escapeHtml(formatValue(item.expected))} | actual: ${escapeHtml(formatValue(item.actual))}</div>
      </div>`
    )
    .join("");

  const commentRows = commentResults
    .map(
      (item) => `
      <button class=\"validation-row ${item.pass ? "pass" : "fail"} validation-comment-row\" data-comment-id=\"${escapeHtml(item.commentId || "")}\" type=\"button\">
        <div class=\"validation-header\">
          <span class=\"status-pill ${item.pass ? "pass" : "fail"}\">${item.pass ? "pass" : "fail"}</span>
          <strong>${escapeHtml(item.label)}</strong>
        </div>
        <div class=\"validation-meta\">${escapeHtml(item.meta)}</div>
        <div class=\"validation-comment\">comment: ${escapeHtml(item.commentText || "(not found)")}</div>
      </button>`
    )
    .join("");

  tabValidation.innerHTML = `
    <div class=\"stack\">
      <div class=\"card\">
        <span class=\"label\">Validation Summary</span>
        <span class=\"value\">${passedCount}/${allResults.length} checks passed</span>
      </div>

      <h3>Global Checks</h3>
      <div class=\"stack\">${globalRows}</div>

      <h3>Per-Comment Checks (click row to focus)</h3>
      <div class=\"stack\">${commentRows}</div>
    </div>
  `;

  for (const row of tabValidation.querySelectorAll(".validation-comment-row")) {
    row.addEventListener("click", () => {
      const commentId = row.dataset.commentId;
      if (!commentId) {
        return;
      }

      const sourceText = sourceCommentsById?.[commentId]?.text || sourceCommentsById?.[commentId]?.body || "";
      const tokens = sourceText ? sourceText.split(/\s+/).slice(0, 8) : [];
      const tokenMap = tokens.length > 0 ? { [commentId]: tokens } : {};

      setHighlight(state, [commentId], tokenMap, commentId);
    });
  }
}

function renderRawTab(tabRaw, data) {
  const { result, expectedSpec } = data;
  tabRaw.innerHTML = `
    <h3>Summary JSON</h3>
    <pre>${escapeHtml(JSON.stringify(result.summary, null, 2))}</pre>
    <h3>Expected Outcomes JSON</h3>
    <pre>${escapeHtml(JSON.stringify(expectedSpec || {}, null, 2))}</pre>
  `;
}

function renderTabs(data, state) {
  const tabOverview = document.getElementById("tab-overview");
  const tabAnalysis = document.getElementById("tab-analysis");
  const tabValidation = document.getElementById("tab-validation");
  const tabRaw = document.getElementById("tab-raw");

  renderOverviewTab(tabOverview, data, state);
  renderAnalysisTab(tabAnalysis, data, state);
  renderValidationTab(tabValidation, data, state);
  renderRawTab(tabRaw, data);

  const tabsRow = document.getElementById("tabs-row");
  tabsRow?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const tab = target.dataset.tab;
    if (!tab) {
      return;
    }
    activateTab(tab);
  });
}

function renderCommentsTable(tabAnalysis, result, sourceCommentsById) {
  const rows = (result.comments || [])
    .map((comment) => {
      return `
      <tr>
        <td>${escapeHtml(comment.id)}</td>
        <td class=\"${toToneClass(comment.tone)}\">${escapeHtml(comment.tone)}</td>
        <td>${escapeHtml((comment.toneSubLabels || []).join(", ") || "none")}</td>
        <td>${escapeHtml(comment.nuance || "neutral")}</td>
        <td>${escapeHtml((comment.nuanceSecondary || []).join(", ") || "none")}</td>
        <td>${escapeHtml(comment.intent)}</td>
        <td>${escapeHtml((comment.intentSubLabels || []).join(", ") || "none")}</td>
        <td>${escapeHtml(`${comment.tone} - ${comment.nuance || "neutral"}`)}</td>
        <td>${escapeHtml(comment.riskLevel)}</td>
        <td>${escapeHtml(compactText(sourceCommentsById?.[comment.id]?.text || sourceCommentsById?.[comment.id]?.body || "", 160))}</td>
        <td>${escapeHtml((comment.signals || []).slice(0, 8).join(", "))}</td>
      </tr>`;
    })
    .join("");

  const tableWrap = document.createElement("div");
  tableWrap.className = "table-wrap";
  tableWrap.innerHTML = `
    <h3>Analyzed Comments (Audit Table)</h3>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Tone</th>
          <th>Tone Sub-labels</th>
          <th>Nuance</th>
          <th>Nuance Secondary</th>
          <th>Intent</th>
          <th>Intent Sub-labels</th>
          <th>Combined View</th>
          <th>Risk</th>
          <th>Comment Text</th>
          <th>Signals</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  tabAnalysis.appendChild(tableWrap);
}

async function main() {
  const [mockRes, analysisRes, expectedRes] = await Promise.all([
    fetch("./mockThread.json"),
    fetch("./analysis-output.json"),
    fetch("./expected-outcomes.json")
  ]);

  const mock = await mockRes.json();
  const result = await analysisRes.json();
  const expectedSpec = expectedRes.ok ? await expectedRes.json() : null;

  const sourceCommentsById = flattenCommentsById(mock.comments || {});
  const analysisById = Object.fromEntries((result.comments || []).map((item) => [item.id, item]));
  const metrics = buildMetrics(result);

  const threadInfo = document.getElementById("thread-info");
  const quickMetrics = document.getElementById("quick-metrics");
  const threadRoot = document.getElementById("thread-root");
  const clearHighlightButton = document.getElementById("clear-highlight");

  const totalComments = Array.isArray(mock.messages)
    ? Math.max(0, mock.messages.length - 1)
    : countNestedComments(mock.comments || []);

  threadInfo.appendChild(createCard("OP Author", mock.post.author || "unknown"));
  threadInfo.appendChild(createCard("Post Title", mock.post.title || "unknown"));
  threadInfo.appendChild(createCard("Subreddit", mock.post.subreddit || "unknown"));
  threadInfo.appendChild(createCard("Date/Time", formatUnixDate(mock.post.created_utc)));
  threadInfo.appendChild(createCard("Total Comments", String(totalComments)));

  const sensitivity = mapSensitivity(result.summary?.threadTopicRisk?.level);
  quickMetrics.appendChild(createCard("Thread Content Sensitivity", sensitivity));
  quickMetrics.appendChild(createCard("Conversation Climate", result.summary?.conversationClimate?.label || "unknown"));
  quickMetrics.appendChild(createCard("Conversation Alignment", result.summary?.alignment?.label || "unknown"));
  quickMetrics.appendChild(
    createCard("Topic-Risk Evidence", formatList(result.summary?.threadTopicRisk?.evidenceSnippets || []))
  );

  renderThread(mock, threadRoot);

  const state = {
    highlightedCommentIds: new Set(),
    highlightTokensByCommentId: {},
    scrollToCommentIds: []
  };

  clearHighlightButton?.addEventListener("click", () => {
    setHighlight(state, [], {});
  });

  const renderData = {
    mock,
    result,
    expectedSpec,
    sourceCommentsById,
    analysisById,
    metrics
  };

  renderTabs(renderData, state);
  renderCommentsTable(document.getElementById("tab-analysis"), result, sourceCommentsById);
  activateTab("overview");
}

main().catch((error) => {
  const container = document.querySelector("main");
  const pre = document.createElement("pre");
  pre.textContent = `Failed to load dev data: ${error?.message || String(error)}`;
  container.appendChild(pre);
});
