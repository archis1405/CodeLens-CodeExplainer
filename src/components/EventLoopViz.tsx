import { usePlaygroundStore } from '../store/usePlaygroundStore'

interface QueueBoxProps {
  title: string
  items: string[]
  color: string
  bg: string
  border: string
  description: string
}

function QueueBox({ title, items, color, bg, border, description }: QueueBoxProps) {
  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 6,
      padding: '8px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{
        fontSize: 10,
        fontFamily: '"Space Grotesk", sans-serif',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color,
        marginBottom: 2,
      }}>
        {title}
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 10, color: '#374151', fontFamily: '"JetBrains Mono", monospace', fontStyle: 'italic' }}>
          empty
        </div>
      ) : (
        items.map((item, i) => (
          <div key={i} style={{
            fontSize: 11,
            fontFamily: '"JetBrains Mono", monospace',
            color: '#c4c4e0',
            background: '#ffffff08',
            borderRadius: 3,
            padding: '3px 6px',
            animation: 'taskMove 0.4s ease-out',
            border: `1px solid ${border}`,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {item}
          </div>
        ))
      )}
      <div style={{ fontSize: 9, color: '#374151', marginTop: 2 }}>{description}</div>
    </div>
  )
}

export function EventLoopViz() {
  const { eventLoopState, currentStep, executionSteps, callStack } = usePlaygroundStore()

  // Build a simple representation even without async code
  const currentStepData = currentStep >= 0 && currentStep < executionSteps.length
    ? executionSteps[currentStep]
    : null

  const callStackNames = callStack.map((f) => f.name + '()')

  // Use event loop state if available; otherwise infer from execution
  const el = eventLoopState || {
    callStack: callStackNames,
    webApis: [],
    callbackQueue: [],
    microtaskQueue: [],
    phase: currentStepData?.type === 'async' ? 'async' : 'sync',
  }

  // When an async step happens, populate the right queue
  if (currentStepData?.type === 'async') {
    const desc = currentStepData.description.toLowerCase()
    if (desc.includes('settimeout')) {
      el.webApis = ['setTimeout callback']
    }
    if (desc.includes('promise') || desc.includes('microtask')) {
      el.microtaskQueue = ['Promise.then callback']
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="dot" style={{ background: '#ff6b35' }} />
        Event Loop
        {el.phase === 'async' && (
          <span className="tag tag-orange" style={{ marginLeft: 'auto' }}>async</span>
        )}
      </div>

      <div style={{ padding: '10px 10px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Call Stack */}
        <QueueBox
          title="Call Stack"
          items={el.callStack}
          color="#00e5ff"
          bg="#00e5ff08"
          border="#00e5ff22"
          description="LIFO — sync execution"
        />

        {/* Arrow */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          fontSize: 10,
          color: '#374151',
          fontFamily: '"JetBrains Mono", monospace',
        }}>
          <div style={{ flex: 1, height: 1, background: '#1e1e35' }} />
          <span style={{ color: '#4b5563' }}>event loop tick</span>
          <div style={{ flex: 1, height: 1, background: '#1e1e35' }} />
        </div>

        {/* Web APIs + Queues */}
        <div style={{ display: 'flex', gap: 6 }}>
          <QueueBox
            title="Web APIs"
            items={el.webApis}
            color="#ff6b35"
            bg="#ff6b3508"
            border="#ff6b3522"
            description="async I/O"
          />
          <QueueBox
            title="Microtasks"
            items={el.microtaskQueue}
            color="#a855f7"
            bg="#a855f708"
            border="#a855f722"
            description="Promise .then"
          />
          <QueueBox
            title="Callbacks"
            items={el.callbackQueue}
            color="#ffd60a"
            bg="#ffd60a08"
            border="#ffd60a22"
            description="setTimeout etc"
          />
        </div>

        {/* Phase indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 8px',
          background: '#ffffff04',
          borderRadius: 4,
          border: '1px solid #1e1e35',
          fontSize: 10,
          fontFamily: '"JetBrains Mono", monospace',
          color: '#4b5563',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: el.phase === 'async' ? '#ff6b35' : '#00e5ff',
            boxShadow: `0 0 6px ${el.phase === 'async' ? '#ff6b35' : '#00e5ff'}`,
            display: 'inline-block', flexShrink: 0,
          }} />
          Phase: <span style={{ color: '#c4c4e0' }}>{el.phase === 'async' ? 'Async / Web API dispatch' : 'Synchronous execution'}</span>
        </div>
      </div>
    </div>
  )
}
