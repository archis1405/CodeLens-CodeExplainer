import { CodeEditor } from './components/CodeEditor'
import { LineExplainer } from './components/LineExplainer'
import { CallStackViz } from './components/CallStackViz'
import { VariableWatch } from './components/VariableWatch'
import { ExecutionControls } from './components/ExecutionControls'
import { EventLoopViz } from './components/EventLoopViz'
import { ScopeChainViz } from './components/ScopeChainViz'
import { HeapMemoryViz } from './components/HeapMemoryViz'
import { ConsoleOutput } from './components/ConsoleOutput'

export default function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-primary)',
        overflow: 'hidden',
      }}
    >
      {/* ── Top Bar ── */}
      <header
        style={{
          height: 46,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border-dim)',
          gap: 12,
          flexShrink: 0,
        }}
      >
        {/* Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            {/* Lens Icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="16.65" y1="16.65" x2="21" y2="21" />
            </svg>
          </div>

          <span
            style={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 700,
              fontSize: 15,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            CodeLens
          </span>
        </div>

        <div
          style={{
            width: 1,
            height: 18,
            background: 'var(--border-dim)',
            margin: '0 4px',
          }}
        />

        {/* Feature Tags */}
        <span className="tag tag-blue">AST Parser</span>
        <span className="tag tag-purple">Step Debugger</span>
        <span className="tag tag-green">Runtime Visualizer</span>

        <div
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            color: 'var(--text-secondary)',
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          Powered by Babel · D3 · Zustand
        </div>
      </header>

      {/* ── Three Panel Layout ── */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 320px 300px',
          gridTemplateRows: '1fr',
          gap: 12,
          padding: 12,
          minHeight: 0,
        }}
      >
        {/* ── LEFT: Code Editor ── */}
        <div
          style={{
            border: '1px solid var(--border-dim)',
            borderRadius: 8,
            overflow: 'hidden',
            background: 'var(--bg-panel)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <CodeEditor />
        </div>

        {/* ── CENTER: Execution Visualization ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          <ExecutionControls />
          <CallStackViz />
          <EventLoopViz />
          <ConsoleOutput />
        </div>

        {/* ── RIGHT: Inspector ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          <LineExplainer />
          <VariableWatch />
          <ScopeChainViz />
          <HeapMemoryViz />
        </div>
      </div>
    </div>
  )
}