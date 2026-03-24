import type { QuickScanUIResult } from "~content/engine"
import type { ThreadExtractionCache } from "~hooks/useThreadExtraction"
import {
  buttonStyle,
  panelCardElevatedStyle,
  panelStackWideStyle,
  pillStyle,
} from "~ui/components/shared/LinaPanelHtmlStyles"

interface OverviewTabHtmlParams {
  cache: ThreadExtractionCache | null
  scan: QuickScanUIResult | null
  hasAnalysis: boolean
  escapeHtml: (value: string) => string
  toSnippet: (value: string, max?: number) => string
  activeOverviewSection: "topic" | "climate" | "alignment" | null
}

const LABEL_TONES = {
  topic: {
    background: "rgba(124, 58, 237, 0.08)",
    border: "rgba(124, 58, 237, 0.18)",
    color: "#6D28D9",
  },
  climate: {
    background: "rgba(37, 99, 235, 0.08)",
    border: "rgba(37, 99, 235, 0.18)",
    color: "#1D4ED8",
  },
  alignment: {
    background: "rgba(13, 148, 136, 0.08)",
    border: "rgba(13, 148, 136, 0.18)",
    color: "#0F766E",
  },
  nuance: {
    background: "rgba(79, 70, 229, 0.08)",
    border: "rgba(79, 70, 229, 0.18)",
    color: "#4338CA",
  },
} as const

function riskBadge(level: "low" | "medium" | "high" | null, escapeHtml: (value: string) => string): string {
  if (!level) {
    return `<span style="${pillStyle({
      background: "#F1F5F9",
      border: "#CBD5E1",
      color: "#64748B",
      textTransform: "uppercase",
      letterSpacing: ".05em",
      fontSize: "10px",
    })}">Scanning...</span>`
  }

  const palette = level === "high"
    ? { background: "#FEF2F2", border: "#FECACA", color: "#DC2626", label: "High Risk" }
    : level === "medium"
      ? { background: "#FFF7ED", border: "#FED7AA", color: "#EA580C", label: "Moderate" }
      : { background: "#F0FDF4", border: "#BBF7D0", color: "#16A34A", label: "Low Risk" }

  return `<span style="${pillStyle({
    background: palette.background,
    border: palette.border,
    color: palette.color,
    textTransform: "uppercase",
    letterSpacing: ".05em",
    fontSize: "10px",
    fontWeight: "700",
  })}">${escapeHtml(palette.label)}</span>`
}

function labelBadge(label: string, tone: keyof typeof LABEL_TONES, escapeHtml: (value: string) => string): string {
  const palette = LABEL_TONES[tone]
  return `<span style="${pillStyle({
    background: palette.background,
    border: palette.border,
    color: palette.color,
    textTransform: "capitalize",
    letterSpacing: ".02em",
  })}">${escapeHtml(label)}</span>`
}

function friendlyClimateIntent(value: string | undefined): string {
  const key = String(value || "mixed").toLowerCase().replace(/_/g, " ").trim()
  if (key === "supportive") return "Supportive"
  if (key === "curious") return "Questioning"
  if (key === "critical") return "Judgmental"
  if (key === "adversarial") return "Combative"
  if (key === "mixed") return "Mixed intent"
  return "Mixed intent"
}

function friendlyClimateLabel(value: string | undefined): string {
  const key = String(value || "mixed").toLowerCase().replace(/_/g, " ").trim()
  if (key === "supportive") return "Supportive"
  if (key === "curious") return "Curious"
  if (key === "critical") return "Tense / critical"
  if (key === "volatile") return "Unstable"
  if (key === "hostile") return "Hostile"
  if (key === "calm") return "Calm"
  return "Mixed"
}

function friendlyAlignmentStance(value: string | undefined): string {
  const key = String(value || "unclear").toLowerCase().replace(/_/g, " ").trim()
  if (key === "condemn abuse") return "Condemning abuse"
  if (key === "support victim") return "Supporting victims"
  if (key === "defend accused") return "Defending accused"
  if (key === "neutral observational") return "Informational"
  if (key === "unclear") return "Mixed"
  return key.replace(/\b\w/g, (c) => c.toUpperCase())
}

function engagementRiskLabel(level: string | undefined): { label: string; color: string; bg: string; border: string } {
  const key = String(level || "unknown").toLowerCase()
  if (key === "low" || key === "none") return { label: "Low Risk", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" }
  if (key === "moderate" || key === "medium") return { label: "Medium Risk", color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA" }
  if (key === "high" || key === "critical") return { label: "High Risk", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" }
  return { label: "Unknown", color: "#64748B", bg: "#F1F5F9", border: "#CBD5E1" }
}

function cleanTopicLabel(topic: string): string {
  return topic
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

function renderOverviewCard(options: {
  section: "topic" | "climate" | "alignment"
  title: string
  value: string
  badgeHtml: string
  expanded: boolean
  summary: string
  detailHtml: string
  accentColor: string
  isPrimary?: boolean
}): string {
  const { section, title, value, badgeHtml, expanded, summary, detailHtml, accentColor, isPrimary = false } = options

  // Primary card (Content Sensitivity) gets more visual weight
  const cardPadding = isPrimary ? "16px 16px 14px" : "14px 14px 12px"
  const titleSize = isPrimary ? "12px" : "11px"
  const valueSize = isPrimary ? "15px" : "14px"
  const summarySize = isPrimary ? "13px" : "12px"
  const borderWidth = isPrimary && expanded ? "2px" : "1px"
  const borderColor = expanded ? accentColor : "rgba(203, 213, 225, 0.46)"
  const boxShadow = expanded 
    ? (isPrimary ? "0 18px 38px rgba(148, 163, 184, 0.18)" : "0 16px 34px rgba(148, 163, 184, 0.16)")
    : "0 12px 30px rgba(148, 163, 184, 0.12)"

  return `
    <div style="${panelCardElevatedStyle}padding:${cardPadding};display:flex;flex-direction:column;gap:10px;border:${borderWidth} solid ${borderColor};box-shadow:${boxShadow};">
      <button
        type="button"
        data-lina-action="toggle-overview-section-${section}"
        aria-expanded="${expanded ? "true" : "false"}"
        style="width:100%;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;background:transparent;border:none;padding:0;text-align:left;cursor:pointer;color:#0F172A;"
      >
        <span style="display:flex;flex-direction:column;gap:${isPrimary ? "5px" : "4px"};min-width:0;flex:1;">
          <span style="font-size:${titleSize};font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748B;">${title}</span>
          <span style="font-size:${valueSize};font-weight:${isPrimary ? "800" : "700"};line-height:1.35;color:#0F172A;">${value}</span>
        </span>
        <span style="display:flex;align-items:center;gap:8px;flex-shrink:0;margin-top:1px;">
          ${badgeHtml}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;">
            <path d="${expanded ? 'M12 10L8 6L4 10' : 'M4 6L8 10L12 6'}" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </button>
      ${summary && !expanded ? `<span style="font-size:${summarySize};line-height:1.45;color:#64748B;margin-top:-4px;">${summary}</span>` : ""}
      ${expanded ? `
        <div style="display:flex;flex-direction:column;gap:10px;padding-top:2px;border-top:1px solid rgba(226, 232, 240, 0.6);margin-top:2px;">
          <div style="font-size:12px;line-height:1.5;color:#475569;">${detailHtml}</div>
        </div>
      ` : ""}
    </div>
  `
}

export function buildOverviewTabHtml({
  cache,
  scan,
  hasAnalysis,
  escapeHtml,
  toSnippet,
  activeOverviewSection,
}: OverviewTabHtmlParams): string {
  if (!cache && !scan) {
    return `<div style="padding:16px;font-size:13px;color:#6B7280;">Loading thread information...</div>`
  }

  const postTitle = cache?.conversation?.title || cache?.jsonExtract?.post?.title || "Reddit Thread"
  const postAuthor = cache?.jsonExtract?.post?.author || "unknown"
  const subreddit = cache?.jsonExtract?.post?.subreddit || "reddit"
  const createdUtc = cache?.jsonExtract?.post?.created_utc || 0
  const extractedCommentCount = cache?.commentCount || 0
  const totalCommentCount = cache?.jsonExtract?.post?.num_comments || extractedCommentCount
  const topicSensitivity = scan?.topicSensitivity ?? null
  const conversationClimate = scan?.conversationClimate ?? null
  const commentAlignment = scan?.commentAlignment ?? null

  const postAge = (() => {
    if (!createdUtc) return "Unknown time"
    const diffSec = Math.max(0, Math.floor(Date.now() / 1000) - createdUtc)
    const minute = 60
    const hour = 60 * minute
    const day = 24 * hour
    if (diffSec < hour) return `${Math.max(1, Math.floor(diffSec / minute))}m ago`
    if (diffSec < day) return `${Math.floor(diffSec / hour)}h ago`
    return `${Math.floor(diffSec / day)}d ago`
  })()

  const climateValue = conversationClimate
    ? friendlyClimateLabel(conversationClimate.primaryLabel) || "Mixed"
    : "Scanning..."

  const climateSummary = conversationClimate
    ? (() => {
        const intent = friendlyClimateIntent(conversationClimate.socialIntent)
        const intensity = String(conversationClimate.emotionalIntensity || "calm").replace(/_/g, " ")
        
        if (intensity === "calm" && intent === "Supportive") return "People are being helpful and supportive."
        if (intensity === "calm" && intent === "Questioning") return "People are asking questions calmly."
        if (intensity === "calm") return "The conversation is calm and measured."
        
        if (intensity === "volatile" && intent === "Critical") return "People are expressing strong criticism."
        if (intensity === "volatile") return "Emotions are running high in the replies."
        
        if (intensity === "hostile" && intent === "Adversarial") return "The thread has become hostile and combative."
        if (intensity === "hostile") return "Replies are hostile and aggressive."
        
        if (intent === "Supportive") return "Most replies are trying to be supportive."
        if (intent === "Critical") return "People are being critical or judgmental."
        if (intent === "Adversarial") return "People are arguing or attacking each other."
        
        return "The conversation has a variety of tones."
      })()
    : ""

  const alignmentValue = commentAlignment
    ? commentAlignment.label === "consensus"
      ? "Mostly in agreement"
      : commentAlignment.label === "split"
        ? "Mixed opinions"
        : commentAlignment.label === "polarized"
          ? "Strongly divided"
          : commentAlignment.label === "fragmented"
          ? "Scattered views"
          : "No clear pattern"
    : "Scanning..."

  const alignmentSummary = commentAlignment
    ? commentAlignment.label === "consensus"
      ? "Most people share a similar view."
      : commentAlignment.label === "split"
        ? "Several different opinions are present."
        : commentAlignment.label === "polarized"
          ? "Strong disagreement between opposing views."
          : commentAlignment.label === "fragmented"
          ? "Many disconnected viewpoints."
          : ""
    : ""

  const alignmentDetail = commentAlignment
    ? `
      <div style="display:flex;flex-direction:column;gap:8px;">
        <span>Main stance: <strong>${escapeHtml(friendlyAlignmentStance(commentAlignment.dominantStance))}</strong></span>
        <span>Pushback pressure: <strong>${Math.round((commentAlignment.dissentPressure || 0) * 100)}%</strong></span>
      </div>
    `
    : "Still analyzing comment patterns..."

  const topicDetail = topicSensitivity
    ? `
      <div style="display:flex;flex-direction:column;gap:8px;">
        <span>${escapeHtml(topicSensitivity.summary)}</span>
        ${Array.isArray(topicSensitivity.detectedTopics) && topicSensitivity.detectedTopics.length > 0 ? `
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${topicSensitivity.detectedTopics.slice(0, 6).map((topic) => labelBadge(cleanTopicLabel(topic), "topic", escapeHtml)).join("")}
          </div>
        ` : ""}
      </div>
    `
    : "Still checking topic sensitivity..."

  const climateDetail = conversationClimate
    ? `
      <div style="display:flex;flex-direction:column;gap:10px;">
        <span style="font-size:12px;line-height:1.5;color:#475569;">${escapeHtml(climateSummary)}</span>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${labelBadge(friendlyClimateIntent(conversationClimate.socialIntent), "climate", escapeHtml)}
          ${labelBadge(String(conversationClimate.emotionalIntensity || "calm").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()), "climate", escapeHtml)}
        </div>
      </div>
    `
    : "Still analyzing conversation patterns..."



  return `
    <div style="${panelStackWideStyle}gap:14px;">
      <div style="display:flex;flex-direction:column;gap:5px;padding:12px 14px;background:rgba(248, 250, 252, 0.5);border-radius:8px;">
        <div style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#94A3B8;font-weight:600;">Thread Details</div>
        <div style="font-size:13px;font-weight:600;line-height:1.35;color:#475569;">${escapeHtml(toSnippet(postTitle, 110))}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px 10px;font-size:11px;line-height:1.4;color:#94A3B8;">
          <span>r/${escapeHtml(subreddit)}</span>
          <span>u/${escapeHtml(postAuthor)}</span>
          <span>${postAge}</span>
          <span>${extractedCommentCount}/${totalCommentCount} comments</span>
        </div>
      </div>

      ${renderOverviewCard({
        section: "topic",
        title: "Content Sensitivity",
        value: topicSensitivity 
          ? topicSensitivity.level === "low" 
            ? "No sensitive topics"
            : topicSensitivity.level === "medium"
              ? "Moderate sensitivity"
              : "High sensitivity"
          : "Scanning...",
        badgeHtml: riskBadge(topicSensitivity?.level ?? null, escapeHtml),
        expanded: activeOverviewSection === "topic",
        summary: topicSensitivity && !activeOverviewSection ? escapeHtml(toSnippet(topicSensitivity.summary, 85)) : "",
        detailHtml: topicDetail,
        accentColor: "rgba(124, 58, 237, 0.22)",
        isPrimary: true,
      })}

      ${renderOverviewCard({
        section: "climate",
        title: "Conversation Climate",
        value: escapeHtml(climateValue),
        badgeHtml: conversationClimate ? `<span style="display:flex;gap:6px;">${labelBadge(friendlyClimateLabel(conversationClimate.primaryLabel || conversationClimate.level), "climate", escapeHtml)}</span>` : "",
        expanded: activeOverviewSection === "climate",
        summary: conversationClimate && activeOverviewSection !== "climate" ? escapeHtml(climateSummary) : "",
        detailHtml: climateDetail,
        accentColor: "rgba(37, 99, 235, 0.18)",
      })}

      ${renderOverviewCard({
        section: "alignment",
        title: "Conversation Alignment",
        value: escapeHtml(alignmentValue),
        badgeHtml: commentAlignment ? labelBadge("Alignment", "alignment", escapeHtml) : "",
        expanded: activeOverviewSection === "alignment",
        summary: alignmentSummary && activeOverviewSection !== "alignment" ? escapeHtml(alignmentSummary) : "",
        detailHtml: alignmentDetail,
        accentColor: "rgba(13, 148, 136, 0.18)",
      })}

      <div style="padding-top:4px;display:flex;justify-content:center;">
        <button type="button" data-lina-action="analyze-thread" style="min-width:200px;min-height:40px;padding:0 20px;border-radius:12px;font-size:14px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:8px;line-height:1;border:none;cursor:pointer;color:#ffffff;background:linear-gradient(135deg, #667EEA 0%, #764BA2 100%);box-shadow:0 4px 14px rgba(102, 126, 234, 0.4);transition:all 0.2s ease;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          ${hasAnalysis ? "View Full Analysis" : "Run Full Analysis"}
        </button>
      </div>
    </div>
  `
}
