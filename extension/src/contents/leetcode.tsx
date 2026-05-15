/**
 * LeetCode AI Analyzer — Content Script
 *
 * Injected on leetcode.com/problems/* pages.
 * Reads user code from Monaco editor, sends to backend,
 * displays complexity + hints in a floating overlay.
 */

import type { PlasmoCSConfig } from "plasmo"
import { useCallback, useEffect, useRef, useState } from "react"
import cssText from "data-text:../overlay.css"
import { analyzeCode, getApiKey, setApiKey, type AnalysisResult } from "../api"
import { extractCode, detectLanguage, extractProblemTitle } from "../editor"

export const config: PlasmoCSConfig = {
  matches: ["https://leetcode.com/problems/*"],
  all_frames: false,
  run_at: "document_idle",
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export const getShadowHostId = () => "lc-ai-analyzer"

// ─── Main Component ─────────────────────────────────────

type Status = "idle" | "loading" | "done" | "error"

function LeetCodeAnalyzer() {
  const [collapsed, setCollapsed] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState("")
  const [language, setLanguage] = useState("cpp")
  const [needApiKey, setNeedApiKey] = useState(false)
  const [keyInput, setKeyInput] = useState("")

  // Drag state
  const [pos, setPos] = useState({ right: 20, top: 80 })
  const dragging = useRef(false)
  const hasMoved = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Debounce
  const lastCode = useRef("")
  const timer = useRef<ReturnType<typeof setTimeout>>()

  // Set initial position
  useEffect(() => {
    setPos({ right: 20, top: 80 })
    setLanguage(detectLanguage())
    getApiKey().then(key => {
      if (!key) setNeedApiKey(true)
    })
  }, [])

  const handleManualAnalyze = async () => {
    const code = await extractCode()
    if (code) {
      lastCode.current = code
      setLanguage(detectLanguage())
      runAnalysis(code)
    }
  }

  const runAnalysis = async (code: string) => {
    setStatus("loading")
    setError("")
    try {
      const lang = detectLanguage()
      const title = extractProblemTitle()
      const res = await analyzeCode(code, lang, title || undefined)
      setResult(res)
      setStatus("done")
    } catch (e: any) {
      if (e.message === "API_KEY_MISSING") {
        setNeedApiKey(true)
        setStatus("idle")
      } else {
        setError(e.message || "Analysis failed")
        setStatus("error")
      }
    }
  }

  const handleRetry = () => {
    if (lastCode.current) runAnalysis(lastCode.current)
  }

  // ─── Drag handlers ───

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    hasMoved.current = false
    const currentRight = window.innerWidth - e.clientX
    dragOffset.current = { x: currentRight - pos.right, y: e.clientY - pos.top }
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      hasMoved.current = true
      const newRight = window.innerWidth - ev.clientX
      setPos({
        right: Math.max(0, Math.min(newRight - dragOffset.current.x, window.innerWidth - (collapsed ? 42 : 340))),
        top: Math.max(0, Math.min(ev.clientY - dragOffset.current.y, window.innerHeight - 100)),
      })
    }
    const onUp = () => {
      dragging.current = false
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
    }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }

  // ─── Collapsed state: show FAB ───

  if (collapsed) {
    return (
      <div 
        className="lca-fab" 
        style={{ right: pos.right, top: pos.top, position: 'fixed', zIndex: 2147483647, cursor: 'pointer', background: '#ffa116', padding: '12px', borderRadius: '50%', border: '1px solid #1e1e1e', userSelect: 'none' }}
        onMouseDown={onMouseDown}
        onClick={() => { if (!hasMoved.current) setCollapsed(false) }}
        title="Open LC Analyzer"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
      </div>
    )
  }

  // ─── Overlay ───

  const isLoading = status === "loading"

  return (
    <div
      className={`lca-overlay ${dragging.current ? "dragging" : ""}`}
      style={{ right: pos.right, top: pos.top }}
    >
      {/* Header */}
      <div className="lca-header" onMouseDown={onMouseDown}>
        <div className="lca-header-left">
          <div className="lca-logo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffa116" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </div>
          <span className="lca-title">LC Analyzer</span>
        </div>
        <div className="lca-btns">
          <button className="lca-btn" onClick={() => setCollapsed(true)} title="Minimize">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="lca-body">
        {needApiKey ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 0' }}>
            <div className="lca-section-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffa116" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              Groq API Key Required
            </div>
            <div className="lca-hint-text" style={{ fontSize: '11.5px', color: '#94a3b8' }}>
              To use LeetComp, please provide your free Groq API key. It will be stored securely on your device.
            </div>
            <input 
              type="password" 
              placeholder="gsk_..." 
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '4px', background: '#222', border: '1px solid #444', color: '#fff', outline: 'none', fontFamily: 'monospace' }}
            />
            <button 
              onClick={async () => {
                if (keyInput.trim()) {
                  await setApiKey(keyInput.trim())
                  setNeedApiKey(false)
                }
              }}
              style={{ background: '#ffa116', color: '#1a1a1a', border: 'none', padding: '8px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Save Key
            </button>
          </div>
        ) : (
          <>
            {/* Complexity Cards */}
          <div className="lca-cards">
            <div className="lca-card">
              <div className="lca-card-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffa116" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Time
              </div>
              {isLoading ? (
                <div className="lca-shimmer"/>
              ) : (
                <div className={`lca-card-value ${result?.time_complexity ? "green" : "muted"}`}>
                  {result?.time_complexity || "—"}
                </div>
              )}
            </div>
            <div className="lca-card">
              <div className="lca-card-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffa116" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4"/><path d="M14 12h4"/></svg>
                Space
              </div>
              {isLoading ? (
                <div className="lca-shimmer"/>
              ) : (
                <div className={`lca-card-value ${result?.space_complexity ? "purple" : "muted"}`}>
                  {result?.space_complexity || "—"}
                </div>
              )}
            </div>
          </div>

          <div className="lca-divider"/>

          {/* Hints */}
          <div>
            <div className="lca-section-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14"/></svg>
              Hints
            </div>
            <div className="lca-hints">
              {isLoading ? (
                <>
                  <div className="lca-shimmer-hint"/>
                  <div className="lca-shimmer-hint" style={{width:"85%"}}/>
                </>
              ) : result?.hints && result.hints.length > 0 ? (
                result.hints.map((hint, i) => (
                  <div className="lca-hint" key={i} style={{marginBottom: "12px"}}>
                    <span className="lca-hint-text" dangerouslySetInnerHTML={{ __html: hint.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </div>
                ))
              ) : result?.time_complexity ? (
                <div className="lca-empty">Solution is completely optimal!</div>
              ) : (
                <div className="lca-empty">Write code to get analysis</div>
              )}
            </div>
          </div>
          </>
        )}

        {/* Error */}
          {status === "error" && (
            <div className="lca-error">
              {error}
              <br/>
              <button className="lca-retry" onClick={handleRetry}>Retry</button>
            </div>
          )}

          {/* Status bar */}
          <div className="lca-status">
            <div className={`lca-dot ${status === "done" ? "green" : status === "loading" ? "yellow" : status === "error" ? "red" : "gray"}`}/>
            <span className="lca-status-text">
              {status === "loading" ? "Analyzing..." : status === "done" ? "Updated" : status === "error" ? "Error" : "Ready"}
            </span>
            <button 
              onClick={handleManualAnalyze} 
              disabled={isLoading || needApiKey} 
              style={{
                marginLeft: "auto", 
                marginRight: "8px", 
                cursor: isLoading || needApiKey ? "not-allowed" : "pointer", 
                padding: "2px 8px", 
                borderRadius: "4px", 
                border: "1px solid #1a1a1a", 
                background: "#ffa116", 
                color: "#1a1a1a",
                fontSize: "11px",
                fontWeight: "bold",
                opacity: needApiKey ? 0.5 : 1
              }}
            >
              Analyze Code
            </button>
            <span className="lca-lang">{language}</span>
          </div>
        </div>
    </div>
  )
}

export default LeetCodeAnalyzer
