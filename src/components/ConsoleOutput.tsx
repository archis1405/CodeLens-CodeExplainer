import { usePlaygroundStore } from '../store/usePlaygroundStore'

export function ConsoleOutput() {
  const { consoleOutput } = usePlaygroundStore()

  return (
    <div className="panel flex flex-col" style={{ minHeight: 80 }}>
      <div className="panel-header">
        <span className="dot" style={{ background: '#00ff87' }} />
        Console Output
        {consoleOutput.length > 0 && (
          <span className="tag tag-green" style={{ marginLeft: 'auto' }}>
            {consoleOutput.length} line{consoleOutput.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 12px',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 12,
        lineHeight: 1.7,
        minHeight: 40,
      }}>
        {consoleOutput.length === 0 ? (
          <div style={{ color: '#374151', fontStyle: 'italic' }}>
            {'>'}  No output yet
          </div>
        ) : (
          consoleOutput.map((line, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: '#374151', flexShrink: 0 }}>{i + 1}</span>
              <span style={{ color: '#00ff87' }}>{line}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
