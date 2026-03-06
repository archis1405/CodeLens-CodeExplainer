import { usePlaygroundStore } from '../store/usePlaygroundStore'
import { findNodeAtLine, explainNode } from '../utils/astParser'
import { explainLine } from '../utils/languageExplainer'
import { LANGUAGE_MAP } from '../utils/languageConfigs'

export function LineExplainer() {
  const {
    selectedLine,
    parsedAST,
    editorCode,
    currentStep,
    executionSteps,
    activeLanguage,
  } = usePlaygroundStore()

  const isJSLike = activeLanguage === 'javascript' || activeLanguage === 'typescript'
  const langConfig = LANGUAGE_MAP[activeLanguage]

  // For JS/TS: use AST node; for others: use regex heuristic
  const astNode = isJSLike && parsedAST && selectedLine
    ? findNodeAtLine(parsedAST, selectedLine)
    : null

  const astExplanation = astNode ? explainNode(astNode, editorCode) : null

  // Heuristic line explanation (all languages)
  const lineText = selectedLine
    ? (editorCode.split('\n')[selectedLine - 1] ?? '')
    : null

  const lineExp = lineText !== null && lineText !== undefined
    ? explainLine(lineText, selectedLine ?? 1, activeLanguage)
    : null

  const currentExecStep = isJSLike && currentStep >= 0 && currentStep < executionSteps.length
    ? executionSteps[currentStep]
    : null

  return (
    <div className="panel flex flex-col" style={{ minHeight: 140 }}>
      <div className="panel-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="dot" style={{ background: '#a855f7' }} />
          Line Explanation
        </div>
        <span style={{
          fontSize: 10,
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 700,
          color: langConfig.color,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}>
          {langConfig.label}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        {/* ── JS/TS: current execution step ── */}
        {currentExecStep && (
          <div style={{
            background: '#00e5ff08',
            border: '1px solid #00e5ff22',
            borderRadius: 6,
            padding: '10px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#00e5ff', boxShadow: '0 0 6px #00e5ff',
                flexShrink: 0, display: 'inline-block',
              }} />
              <span style={{ fontSize: 10, color: '#00e5ff', fontFamily: '"JetBrains Mono",monospace', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Step {currentExecStep.stepIndex + 1}
              </span>
              <span className={`tag ${getTypeTag(currentExecStep.type)}`} style={{ marginLeft: 'auto' }}>
                {currentExecStep.type}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#c4c4e0', margin: 0, lineHeight: 1.6 }}>
              {currentExecStep.description}
            </p>
          </div>
        )}

        {/* ── Heuristic line explanation (all languages) ── */}
        {lineExp && lineText?.trim() && (
          <div style={{
            background: `${langConfig.color}08`,
            border: `1px solid ${langConfig.color}22`,
            borderRadius: 6,
            padding: '10px 12px',
          }}>
            {/* Tag + line number */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                fontSize: 9,
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: langConfig.color,
                background: `${langConfig.color}15`,
                border: `1px solid ${langConfig.color}33`,
                padding: '2px 6px',
                borderRadius: 3,
              }}>
                {lineExp.tag}
              </span>
              {selectedLine && (
                <span style={{ fontSize: 10, color: '#4b5563', fontFamily: '"JetBrains Mono",monospace' }}>
                  line {selectedLine}
                </span>
              )}
            </div>

            {/* Summary */}
            <p style={{ fontSize: 13, color: '#c4c4e0', margin: '0 0 8px', lineHeight: 1.65 }}>
              {lineExp.summary}
            </p>

            {/* Concept / detail */}
            {lineExp.concept && (
              <div style={{
                borderTop: `1px solid ${langConfig.color}18`,
                paddingTop: 8,
                fontSize: 12,
                color: '#6b7280',
                lineHeight: 1.6,
              }}>
                <span style={{ color: langConfig.color, fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Concept ·{' '}
                </span>
                {lineExp.concept}
              </div>
            )}
          </div>
        )}

        {/* ── JS/TS: AST node explanation ── */}
        {astNode && astExplanation && (
          <div style={{
            background: '#a855f708',
            border: '1px solid #a855f722',
            borderRadius: 6,
            padding: '10px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: '#6b7280', fontFamily: '"JetBrains Mono",monospace', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                AST Node
              </span>
              <span className="tag tag-purple" style={{ marginLeft: 'auto' }}>{astNode.type}</span>
            </div>
            <p style={{ fontSize: 12, color: '#9d9db8', margin: 0, lineHeight: 1.65 }}>
              {astExplanation}
            </p>
            {astNode.loc && (
              <div style={{ marginTop: 6, fontSize: 10, color: '#374151', fontFamily: '"JetBrains Mono",monospace' }}>
                {astNode.loc.start.line}:{astNode.loc.start.column} → {astNode.loc.end.line}:{astNode.loc.end.column}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!currentExecStep && !lineExp && (
          <div style={{ textAlign: 'center', padding: '20px 12px', color: '#374151' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 12, fontFamily: '"JetBrains Mono",monospace', color: '#4b5563' }}>
              Click a line in the editor to see its explanation
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getTypeTag(type: string): string {
  const map: Record<string, string> = {
    declaration: 'tag-cyan', assignment: 'tag-green', call: 'tag-orange',
    return: 'tag-pink', branch: 'tag-yellow', loop: 'tag-yellow',
    expression: 'tag-purple', async: 'tag-orange', log: 'tag-green',
  }
  return map[type] || 'tag-cyan'
}
