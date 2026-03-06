import { usePlaygroundStore } from '../store/usePlaygroundStore'

export function ScopeChainViz() {
  const { scopeChain } = usePlaygroundStore()

  const SCOPE_COLORS = ['#00e5ff', '#a855f7', '#00ff87', '#ff6b35', '#ffd60a']

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="dot" style={{ background: '#00ff87' }} />
        Scope Chain
      </div>

      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {scopeChain.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: '#374151', fontSize: 12, fontFamily: '"JetBrains Mono", monospace' }}>
            No scopes yet
          </div>
        ) : (
          scopeChain.map((scope, i) => {
            const color = SCOPE_COLORS[i % SCOPE_COLORS.length]
            const vars = Object.entries(scope.variables)
            const isLast = i === scopeChain.length - 1

            return (
              <div key={scope.name + i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                {/* Scope box */}
                <div style={{
                  background: `${color}08`,
                  border: `1px solid ${color}33`,
                  borderRadius: 6,
                  padding: '7px 10px',
                  position: 'relative',
                  marginLeft: i * 12,
                }}>
                  {/* Scope title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: vars.length ? 5 : 0 }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: color, flexShrink: 0, display: 'inline-block',
                    }} />
                    <span style={{
                      fontSize: 11,
                      fontFamily: '"Space Grotesk", sans-serif',
                      fontWeight: 600,
                      color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      {scope.name}
                    </span>
                    <span style={{
                      fontSize: 9,
                      color: '#4b5563',
                      fontFamily: '"JetBrains Mono", monospace',
                      marginLeft: 2,
                    }}>
                      {scope.type}
                    </span>
                  </div>

                  {/* Variables */}
                  {vars.map(([k, v]) => (
                    <div key={k} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontFamily: '"JetBrains Mono", monospace',
                      padding: '2px 0',
                    }}>
                      <span style={{ color: '#c4c4e0', paddingLeft: 12 }}>{k}</span>
                      <span style={{ color: '#374151' }}>:</span>
                      <span style={{ color }}>
                        {v === null ? 'null' : v === undefined ? 'undefined' : typeof v === 'string' ? `"${String(v).slice(0, 18)}"` : JSON.stringify(v)?.slice(0, 20)}
                      </span>
                    </div>
                  ))}
                  {vars.length === 0 && (
                    <div style={{ fontSize: 10, color: '#374151', fontFamily: '"JetBrains Mono", monospace', paddingLeft: 12 }}>
                      (empty)
                    </div>
                  )}
                </div>

                {/* Connector arrow */}
                {!isLast && (
                  <div style={{
                    marginLeft: (i + 1) * 12 + 8,
                    height: 16,
                    width: 1,
                    background: `${SCOPE_COLORS[(i + 1) % SCOPE_COLORS.length]}44`,
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: -3,
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: `6px solid ${SCOPE_COLORS[(i + 1) % SCOPE_COLORS.length]}44`,
                    }} />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
