import type { ExtensionAnalyzeThreadResponse } from "~types/extension-api"
import {
  buttonStyle,
  errorInlineStyle,
  panelCardElevatedStyle,
  panelCardSoftStyle,
  panelStackStyle,
  pillStyle,
} from "~ui/components/shared/LinaPanelHtmlStyles"

interface AnalysisTabHtmlParams {
  analysis: ExtensionAnalyzeThreadResponse | null
  analysisError: string | null
  isAnalyzing: boolean
  isEvidenceHighlightEnabled: boolean
  hasNewerData: boolean
  escapeHtml: (value: string) => string
  commentTypeCounts: {
    supportive: number
    critical: number
    neutral: number
  }
  commentMatchingDiagnostics?: {
    extractedTotal: number
    domTargets: number
    directIdMatches: number
    fuzzyMatches: number
    unmatched: number
  }
  activeCommentTypeFilter: "all" | "supportive" | "critical" | "neutral"
  activeAnalysisLens: "tone" | "intent" | "nuance" | null
}

const CHIP_COLORS = {
  supportive: {
    background: "rgba(255, 255, 255, 0.92)",
    border: "rgba(14, 165, 233, 0.16)",
    color: "#334155",
    activeBorder: "rgba(14, 165, 233, 0.42)",
    activeShadow: "0 10px 26px rgba(56, 189, 248, 0.12)",
  },
  critical: {
    background: "rgba(255, 255, 255, 0.92)",
    border: "rgba(249, 115, 22, 0.16)",
    color: "#334155",
    activeBorder: "rgba(249, 115, 22, 0.44)",
    activeShadow: "0 10px 26px rgba(249, 115, 22, 0.14)",
  },
  neutral: {
    background: "rgba(255, 255, 255, 0.92)",
    border: "rgba(148, 163, 184, 0.26)",
    color: "#334155",
    activeBorder: "rgba(100, 116, 139, 0.42)",
    activeShadow: "0 10px 26px rgba(148, 163, 184, 0.14)",
  },
  indigo: {
    background: "rgba(79, 70, 229, 0.08)",
    border: "rgba(79, 70, 229, 0.18)",
    color: "#4338CA",
  },
} as const

function commentTypeChip(options: {
  key: "supportive" | "critical" | "neutral"
  count: number
  active: boolean
  label: string
}): string {
  const { key, count, active, label } = options
  const palette = CHIP_COLORS[key]

  return `
    <button
      type="button"
      data-lina-action="filter-comments-${key}"
      aria-pressed="${active ? "true" : "false"}"
      style="min-height:34px;padding:0 12px;border-radius:999px;border:1px solid ${active ? palette.activeBorder : palette.border};background:${palette.background};color:${palette.color};display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;box-sizing:border-box;box-shadow:${active ? palette.activeShadow : "none"};font-size:12px;font-weight:700;line-height:1;"
    >
      <span>${label}</span>
      <span style="${pillStyle({
        background: active ? "rgba(255,255,255,0.84)" : "rgba(248,250,252,0.92)",
        border: active ? palette.activeBorder : palette.border,
        color: palette.color,
        fontSize: 11,
        fontWeight: 700,
      })}">${count}</span>
    </button>
  `
}

function analysisLensButton(options: {
  key: "tone" | "intent" | "nuance"
  title: string
  subtitle: string
  active: boolean
  disabled?: boolean
}): string {
  const { key, title, subtitle, active, disabled = false } = options
  const opacity = disabled ? "0.5" : "1"
  const cursor = disabled ? "not-allowed" : "pointer"
  
  return `
    <button
      type="button"
      data-lina-action="analysis-focus-${key}"
      aria-pressed="${active ? "true" : "false"}"
      ${disabled ? "disabled" : ""}
      style="${panelCardSoftStyle}padding:12px 13px;border-color:${active ? "rgba(79, 70, 229, 0.34)" : "rgba(203, 213, 225, 0.4)"};box-shadow:${active ? "0 14px 28px rgba(99, 102, 241, 0.14)" : "0 10px 24px rgba(148,163,184,0.1)"};width:100%;min-height:76px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:6px;text-align:left;cursor:${cursor};box-sizing:border-box;appearance:none;-webkit-appearance:none;overflow:visible;opacity:${opacity};"
    >
      <span style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;">
        <span style="font-size:13px;font-weight:700;color:#0F172A;">${title}</span>
      </span>
      <span style="font-size:12px;line-height:1.45;color:#64748B;">${subtitle}</span>
      ${disabled ? `<span style="font-size:11px;color:#94A3B8;margin-top:2px;font-style:italic;">Client-side pattern matching</span>` : ""}
    </button>
  `
}

function clampSummary(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim()
  if (compact.length <= 190) return compact
  return `${compact.slice(0, 187)}...`
}

export function buildAnalysisTabHtml({
  analysis,
  analysisError,
  isAnalyzing,
  isEvidenceHighlightEnabled,
  hasNewerData,
  escapeHtml,
  commentTypeCounts,
  commentMatchingDiagnostics,
  activeCommentTypeFilter,
  activeAnalysisLens,
}: AnalysisTabHtmlParams): string {
  const newerDataBanner = hasNewerData ? `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid rgba(191, 219, 254, 0.8);border-radius:12px;background:rgba(239, 246, 255, 0.92);">
      <span style="font-size:12px;line-height:1.45;color:#1D4ED8;">New comments have appeared since this analysis ran.</span>
      <button type="button" data-lina-action="reanalyze-thread" style="${buttonStyle({ variant: "ghost", size: "sm" })}border-color:rgba(59,130,246,0.2);color:#1D4ED8;flex-shrink:0;">
        Re-run
      </button>
    </div>
  ` : ""

  if (!analysis) {
    return `
      <div style="${panelStackStyle}">
        ${newerDataBanner}
        <div style="${panelCardElevatedStyle}padding:22px 18px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px;">
          <div style="font-size:16px;font-weight:700;color:#0F172A;">Analysis is ready when you are</div>
          <div style="font-size:13px;line-height:1.5;color:#64748B;max-width:240px;">Run the full analysis to unlock comment filters, tone and intent highlights, and on-page evidence review.</div>
          ${analysisError ? `<div style="${errorInlineStyle}margin:0;width:100%;">${escapeHtml(analysisError)}</div>` : ""}
          <button type="button" data-lina-action="analyze-thread" ${isAnalyzing ? "disabled" : ""} style="${buttonStyle({ variant: "secondary", size: "md", disabled: isAnalyzing })}width:100%;justify-content:center;border-color:rgba(79,70,229,0.18);background:rgba(255,255,255,0.94);box-shadow:0 12px 28px rgba(148,163,184,0.12);">
            ${isAnalyzing ? "Analyzing..." : "Run Full Analysis"}
          </button>
        </div>
      </div>
    `
  }

  const summary = clampSummary(analysis.thread_summary || "LINA summarized the visible thread for you.")
  const toneLensSubtitle = analysis.analysis_lenses?.tone || "Highlight emotionally charged or supportive language."
  const intentLensSubtitle = analysis.analysis_lenses?.intent || "Find questioning, supportive, or adversarial comments."
  const nuanceLensSubtitle = analysis.analysis_lenses?.nuance || "Detect hedging, sarcasm, and ambiguous phrasing."

  const matchingStatus = commentMatchingDiagnostics
    ? `<div style="font-size:11px;line-height:1.45;color:#64748B;margin-top:4px;">Matched ${commentMatchingDiagnostics.directIdMatches + commentMatchingDiagnostics.fuzzyMatches}/${commentMatchingDiagnostics.domTargets} DOM comments to extracted data (${commentMatchingDiagnostics.directIdMatches} id, ${commentMatchingDiagnostics.fuzzyMatches} fuzzy, ${commentMatchingDiagnostics.unmatched} unmatched; extracted total ${commentMatchingDiagnostics.extractedTotal}).</div>`
    : ""

  return `
    <div style="${panelStackStyle}gap:14px;">
      ${newerDataBanner}

      <div style="${panelCardElevatedStyle}padding:14px 14px 12px;display:flex;flex-direction:column;gap:8px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748B;">Summary</div>
        <div style="font-size:13px;line-height:1.5;color:#334155;">${escapeHtml(summary)}</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748B;">Comment type filters</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${commentTypeChip({ key: "supportive", label: "Supportive", count: commentTypeCounts.supportive, active: activeCommentTypeFilter === "supportive" })}
          ${commentTypeChip({ key: "critical", label: "Critical", count: commentTypeCounts.critical, active: activeCommentTypeFilter === "critical" })}
          ${commentTypeChip({ key: "neutral", label: "Neutral", count: commentTypeCounts.neutral, active: activeCommentTypeFilter === "neutral" })}
          <button type="button" data-lina-action="filter-comments-all" aria-pressed="${activeCommentTypeFilter === "all" ? "true" : "false"}" style="min-height:34px;padding:0 12px;border-radius:999px;border:1px solid ${activeCommentTypeFilter === "all" ? "rgba(79, 70, 229, 0.26)" : "rgba(203, 213, 225, 0.46)"};background:rgba(255,255,255,0.92);color:#475569;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;box-sizing:border-box;font-size:12px;font-weight:700;line-height:1;box-shadow:${activeCommentTypeFilter === "all" ? "0 10px 26px rgba(99,102,241,0.12)" : "none"};">
            Show all
          </button>
        </div>
        ${matchingStatus}
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748B;">Analyze comment patterns</div>
        <div style="display:grid;grid-template-columns:1fr;gap:8px;">
          ${analysisLensButton({ key: "tone", title: "Tone", subtitle: escapeHtml(toneLensSubtitle), active: activeAnalysisLens === "tone" })}
          ${analysisLensButton({ key: "intent", title: "Intent", subtitle: escapeHtml(intentLensSubtitle), active: activeAnalysisLens === "intent" })}
          ${analysisLensButton({ key: "nuance", title: "Nuance", subtitle: escapeHtml(nuanceLensSubtitle), active: activeAnalysisLens === "nuance" })}
        </div>
      </div>

      <div style="${panelCardSoftStyle}padding:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <div style="display:flex;flex-direction:column;gap:3px;min-width:0;">
          <span style="font-size:12px;font-weight:700;color:#0F172A;">Show Evidence</span>
          <span style="font-size:11px;line-height:1.4;color:#64748B;">Inline highlights use scanner phrase matches directly on the Reddit thread.</span>
        </div>
        <button type="button" data-lina-action="toggle-evidence-highlight" aria-pressed="${isEvidenceHighlightEnabled ? "true" : "false"}" style="${buttonStyle({ variant: isEvidenceHighlightEnabled ? "secondary" : "ghost", size: "sm" })}flex-shrink:0;border-color:${isEvidenceHighlightEnabled ? "rgba(79,70,229,0.22)" : "rgba(203,213,225,0.46)"};color:${isEvidenceHighlightEnabled ? "#4338CA" : "#475569"};background:${isEvidenceHighlightEnabled ? "rgba(238,242,255,0.92)" : "rgba(255,255,255,0.78)"};">
          ${isEvidenceHighlightEnabled ? "Evidence On" : "Evidence Off"}
        </button>
      </div>

      <div style="display:flex;gap:8px;">
        <button type="button" data-lina-action="tab-response" style="${buttonStyle({ variant: "secondary", size: "md" })}flex:1;justify-content:center;border-color:rgba(79,70,229,0.18);background:rgba(255,255,255,0.94);box-shadow:0 10px 24px rgba(148,163,184,0.1);">
          Response Tools
        </button>
        <button type="button" data-lina-action="reanalyze-thread" ${isAnalyzing ? "disabled" : ""} style="${buttonStyle({ variant: "ghost", size: "md", disabled: isAnalyzing })}justify-content:center;">
          Refresh
        </button>
      </div>
    </div>
  `
}
