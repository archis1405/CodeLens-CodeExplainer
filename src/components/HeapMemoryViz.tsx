import { usePlaygroundStore } from '../store/usePlaygroundStore'
import type { HeapObject } from '../store/usePlaygroundStore'

function HeapNode({ obj }: { obj: HeapObject }) {
  const typeConfig = {
    object:   { color: '#ff6b35', bg: '#ff6b3508', border: '#ff6b3533', icon: '{}' },
    array:    { color: '#00e5ff', bg: '#00e5ff08', border: '#00e5ff33', icon: '[]' },
    function: { color: '#ff2d78', bg: '#ff2d7808', border: '#ff2d7833', icon: 'fn' },
  }
  const cfg = typeConfig[obj.type]

  const formatContent = (value: unknown): string => {
    if (Array.isArray(value)) {
      const items = (value as unknown[]).map((v) =>
        v === null ? 'null' : v === undefined ? 'undef' : typeof v === 'string' ? `"${String(v).slice(0, 8)}"` : String(v)
      )
      return `[ ${items.slice(0, 4).join(', ')}${items.length > 4 ? ', …' : ''} ]`
    }
    if (value && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>)
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${v === null ? 'null' : typeof v === 'string' ? `"${String(v).slice(0, 8)}"` : String(v)}`)
      return `{ ${entries.join(', ')}${Object.keys(value as object).length > 3 ? ', …' : ''} }`
    }
    return String(value)
  }

  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 6,
      padding: '8px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize: 10,
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 700,
          color: cfg.color,
          background: `${cfg.color}18`,
          border: `1px solid ${cfg.border}`,
          borderRadius: 3,
          padding: '1px 5px',
        }}>
          {cfg.icon}
        </span>
        <span style={{
          fontSize: 10,
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 600,
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {obj.type}
        </span>
        <span style={{
          fontSize: 9,
          color: '#374151',
          fontFamily: '"JetBrains Mono", monospace',
          marginLeft: 'auto',
        }}>
          #{obj.id.split('_').pop()}
        </span>
      </div>
      <div style={{
        fontSize: 11,
        fontFamily: '"JetBrains Mono", monospace',
        color: '#c4c4e0',
        wordBreak: 'break-all',
        lineHeight: 1.5,
      }}>
        {formatContent(obj.value)}
      </div>
    </div>
  )
}

export function HeapMemoryViz() {
  const { heapMemory } = usePlaygroundStore()

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="dot" style={{ background: '#ff6b35' }} />
        Heap Memory
        <span className="tag tag-orange" style={{ marginLeft: 'auto' }}>
          {heapMemory.length} obj{heapMemory.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {heapMemory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: '#374151', fontSize: 12, fontFamily: '"JetBrains Mono", monospace' }}>
            No heap objects yet
          </div>
        ) : (
          heapMemory.map((obj) => (
            <HeapNode key={obj.id} obj={obj} />
          ))
        )}
      </div>
    </div>
  )
}
