import { usePlaygroundStore } from '../store/usePlaygroundStore'
import type { VariableValue } from '../store/usePlaygroundStore'

function formatValue(v: unknown): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (typeof v === 'string') return `"${v}"`
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v, null, 0)
    } catch {
      return String(v)
    }
  }
  return String(v)
}

function ValueBadge({ v }: { v: VariableValue }) {
  const typeColors: Record<string, { bg: string; color: string; border: string }> = {
    number:   { bg: '#ffd60a10', color: '#ffd60a', border: '#ffd60a33' },
    string:   { bg: '#00ff8710', color: '#00ff87', border: '#00ff8733' },
    boolean:  { bg: '#a855f710', color: '#a855f7', border: '#a855f733' },
    object:   { bg: '#ff6b3510', color: '#ff6b35', border: '#ff6b3533' },
    array:    { bg: '#00e5ff10', color: '#00e5ff', border: '#00e5ff33' },
    function: { bg: '#ff2d7810', color: '#ff2d78', border: '#ff2d7833' },
    null:     { bg: '#37415110', color: '#6b7280', border: '#37415133' },
    undefined:{ bg: '#37415110', color: '#6b7280', border: '#37415133' },
  }
  const colors = typeColors[v.type] || { bg: '#16162a', color: '#c4c4e0', border: '#1e1e35' }

  const displayVal = formatValue(v.value)
  const truncated = displayVal.length > 28 ? displayVal.slice(0, 28) + '…' : displayVal

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '7px 10px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 5,
        gap: 8,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 12,
            color: '#e2e2f0',
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          {v.name}
        </span>
        <span style={{ color: '#374151', fontSize: 11 }}>=</span>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 12,
            color: colors.color,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={displayVal}
        >
          {truncated}
        </span>
      </div>
      <span
        style={{
          fontSize: 9,
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: colors.color,
          opacity: 0.7,
          flexShrink: 0,
        }}
      >
        {v.type}
      </span>
    </div>
  )
}

export function VariableWatch() {
  const { variables } = usePlaygroundStore()
  const varList = Object.values(variables)

  const grouped = varList.reduce((acc, v) => {
    const scope = v.scope || 'global'
    if (!acc[scope]) acc[scope] = []
    acc[scope].push(v)
    return acc
  }, {} as Record<string, VariableValue[]>)

  return (
    <div className="panel flex flex-col" style={{ minHeight: 120 }}>
      <div className="panel-header">
        <span className="dot" style={{ background: '#00ff87' }} />
        Variables
        <span className="tag tag-green" style={{ marginLeft: 'auto' }}>
          {varList.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {varList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#374151', fontSize: 12, fontFamily: '"JetBrains Mono", monospace' }}>
            No variables yet
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(grouped).map(([scope, vars]) => (
              <div key={scope}>
                <div
                  style={{
                    fontSize: 10,
                    color: '#4b5563',
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 4,
                    paddingLeft: 2,
                  }}
                >
                  {scope} scope
                </div>
                <div className="space-y-1">
                  {vars.map((v) => (
                    <ValueBadge key={v.name} v={v} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
