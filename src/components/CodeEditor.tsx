import { useCallback, useRef, useState } from 'react'
import MonacoEditor, { type OnMount } from '@monaco-editor/react'
import { usePlaygroundStore } from '../store/usePlaygroundStore'
import { parseCode } from '../utils/astParser'
import { simulateExecution } from '../utils/executionSimulator'
import { LANGUAGES, LANGUAGE_MAP } from '../utils/languageConfigs'
import type * as MonacoType from 'monaco-editor'
import type { SupportedLanguage } from '../types'

import { SiJavascript, SiTypescript, SiPython, SiCplusplus, SiGo } from "react-icons/si"
import { FaJava } from "react-icons/fa"

const LANG_ICONS = {
  java: <FaJava color="#f89820" size={16} />,
  cpp: <SiCplusplus color="#00599c" size={16} />,
  javascript: <SiJavascript color="#f7df1e" size={16} />,
  python: <SiPython color="#3776ab" size={16} />,
  go: <SiGo color="#00ADD8" size={16} />,
  typescript: <SiTypescript color="#3178c6" size={16} />,
}

export function CodeEditor() {
  const {
    editorCode,
    setEditorCode,
    setParsedAST,
    setExecutionSteps,
    setSelectedLine,
    selectedLine,
    currentStep,
    hasAnalyzed,
    setCurrentStep,
    activeLanguage,
    setActiveLanguage,
  } = usePlaygroundStore()

  const editorRef = useRef<MonacoType.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof MonacoType | null>(null)
  const decorationsRef = useRef<string[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const activeLangConfig = LANGUAGE_MAP[activeLanguage]
  const isJSLike = activeLanguage === 'javascript' || activeLanguage === 'typescript'

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    monaco.editor.defineTheme('playground-light', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'keyword', foreground: '7c3aed', fontStyle: 'bold' },
            { token: 'string', foreground: '16a34a' },
            { token: 'number', foreground: 'ea580c' },
            { token: 'comment', foreground: '9ca3af', fontStyle: 'italic' },
            { token: 'identifier', foreground: '111827' },
        ],
        colors: {
            'editor.background': '#ffffff',
            'editor.foreground': '#111827',
            'editorLineNumber.foreground': '#9ca3af',
            'editorLineNumber.activeForeground': '#2563eb',
            'editor.lineHighlightBackground': '#f1f5f9',
            'editor.selectionBackground': '#dbeafe',
            'editorCursor.foreground': '#2563eb',
            'editorWidget.background': '#ffffff',
            'editorWidget.border': '#e5e7eb',
            'scrollbar.shadow': '#00000000',
            'scrollbarSlider.background': '#d1d5db',
        'scrollbarSlider.hoverBackground': '#9ca3af',
    },
})
    monaco.editor.setTheme('playground-dark')

    editor.onMouseDown((e) => {
      const pos = e.target.position
      if (pos) setSelectedLine(pos.lineNumber)
    })
  }, [setSelectedLine])

  // Sync active line decoration
  if (editorRef.current && monacoRef.current && selectedLine) {
    const monaco = monacoRef.current
    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      [{
        range: new monaco.Range(selectedLine, 1, selectedLine, 1),
        options: {
          isWholeLine: true,
          className: 'active-line-highlight',
          overviewRuler: { color: '#00e5ff88', position: monaco.editor.OverviewRulerLane.Left },
        },
      }]
    )
    if (currentStep >= 0) {
      editorRef.current.revealLineInCenter(selectedLine, monaco.editor.ScrollType.Smooth)
    }
  }

  const handleAnalyze = useCallback(() => {
    if (!isJSLike) return
    const { ast, error } = parseCode(editorCode)
    setParsedAST(ast, error)
  }, [editorCode, setParsedAST, isJSLike])

  const handleRunStepByStep = useCallback(() => {
    if (!isJSLike) return
    const { ast, error } = parseCode(editorCode)
    if (error || !ast) { setParsedAST(null, error || 'Parse failed'); return }
    setParsedAST(ast)
    const steps = simulateExecution(ast)
    setExecutionSteps(steps)
    setCurrentStep(0)
  }, [editorCode, setParsedAST, setExecutionSteps, setCurrentStep, isJSLike])

  const handleLanguageChange = useCallback((lang: SupportedLanguage) => {
    setActiveLanguage(lang)
    setDropdownOpen(false)
  }, [setActiveLanguage])

  return (
    <div className="flex flex-col h-full" style={{ position: 'relative' }}>

      {/* ── Header ── */}
      <div className="panel-header" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>

        {/* Left: title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span className="dot" style={{ background: '#00e5ff' }} />
          <span>Code Editor</span>
        </div>

        {/* Center: Language dropdown */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 12px',
              borderRadius: 6,
              border: `1px solid ${activeLangConfig.color}55`,
              background: `${activeLangConfig.color}12`,
              color: activeLangConfig.color,
              fontFamily: '"Space Grotesk", sans-serif',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              letterSpacing: '0.02em',
              minWidth: 148,
              justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 14, lineHeight: 1 }}>{LANG_ICONS[activeLanguage]}</span>
              {activeLangConfig.label}
            </span>
            {/* Chevron */}
            <svg
              width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"
              style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <>
              {/* Backdrop to close */}
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setDropdownOpen(false)}
              />
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                zIndex: 50,
                background: '#12121e',
                border: '1px solid #2d2d55',
                borderRadius: 8,
                overflow: 'hidden',
                minWidth: 180,
                boxShadow: '0 8px 32px #00000088',
                animation: 'slideUp 0.15s ease-out',
              }}>
                {/* Dropdown header */}
                <div style={{
                  padding: '8px 12px 6px',
                  fontSize: 10,
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#4b5563',
                  borderBottom: '1px solid #1e1e35',
                }}>
                  Select Language
                </div>

                {LANGUAGES.map((lang) => {
                  const isActive = lang.id === activeLanguage
                  return (
                    <button
                      key={lang.id}
                      onClick={() => handleLanguageChange(lang.id as SupportedLanguage)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '9px 14px',
                        background: isActive ? `${lang.color}15` : 'transparent',
                        border: 'none',
                        borderLeft: `3px solid ${isActive ? lang.color : 'transparent'}`,
                        color: isActive ? lang.color : '#9d9db8',
                        fontFamily: '"Space Grotesk", sans-serif',
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.1s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = '#ffffff08'
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                      }}
                    >
                      <span style={{ fontSize: 16, lineHeight: 1 }}>{LANG_ICONS[lang.id]}</span>
                      <span style={{ flex: 1 }}>{lang.label}</span>
                      {(lang.id === 'javascript' || lang.id === 'typescript') && (
                        <span style={{
                          fontSize: 9,
                          padding: '1px 5px',
                          borderRadius: 3,
                          background: '#00e5ff15',
                          color: '#00e5ff',
                          border: '1px solid #00e5ff33',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                        }}>
                          AST
                        </span>
                      )}
                      {isActive && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Right: action buttons */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            className="btn btn-primary"
            onClick={handleAnalyze}
            disabled={!isJSLike}
            title={!isJSLike ? 'AST parsing is only available for JavaScript / TypeScript' : undefined}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Analyze AST
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleRunStepByStep}
            disabled={!isJSLike}
            title={!isJSLike ? 'Step-by-step execution is only available for JavaScript / TypeScript' : undefined}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Run Step By Step
          </button>
        </div>
      </div>

      {/* ── Non-JS info banner ── */}
      {!isJSLike && (
        <div style={{
          padding: '6px 14px',
          background: `${activeLangConfig.color}0a`,
          borderBottom: `1px solid ${activeLangConfig.color}22`,
          fontSize: 11,
          color: activeLangConfig.color,
          fontFamily: '"JetBrains Mono", monospace',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {activeLangConfig.label} mode — click any line for an explanation. AST parsing &amp; step execution are JS/TS only.
        </div>
      )}

      {/* ── Monaco Editor ── */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <MonacoEditor
          height="100%"
          language={activeLangConfig.monacoLang}
          value={editorCode}
          onChange={(v) => setEditorCode(v ?? '')}
          onMount={handleEditorMount}
          options={{
            minimap:              { enabled: false },
            fontSize:             13,
            fontFamily:           '"JetBrains Mono", "Fira Code", monospace',
            fontLigatures:        true,
            lineNumbers:          'on',
            scrollBeyondLastLine: false,
            wordWrap:             'on',
            glyphMargin:          false,
            folding:              true,
            renderLineHighlight:  'line',
            cursorBlinking:       'smooth',
            smoothScrolling:      true,
            padding:              { top: 12, bottom: 12 },
            scrollbar:            { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
          }}
        />
      </div>

      {/* ── Status bar ── */}
      <div style={{
        padding: '5px 14px',
        borderTop: '1px solid #1e1e35',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: 11,
        color: '#4b5563',
        fontFamily: '"JetBrains Mono", monospace',
      }}>
        {selectedLine && <span style={{ color: '#00e5ff' }}>Line {selectedLine}</span>}
        {hasAnalyzed  && <span style={{ color: '#00ff87' }}>✓ AST parsed</span>}
        <span style={{ color: activeLangConfig.color, fontWeight: 600 }}>
          {LANG_ICONS[activeLanguage]} {activeLangConfig.label}
        </span>
        <span style={{ marginLeft: 'auto' }}>UTF-8</span>
      </div>
    </div>
  )
}
