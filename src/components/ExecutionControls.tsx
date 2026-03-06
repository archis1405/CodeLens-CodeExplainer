import { usePlaygroundStore } from '../store/usePlaygroundStore'

export function ExecutionControls() {
  const {
    executionSteps,
    currentStep,
    stepForward,
    stepBackward,
    resetExecution,
    setCurrentStep,
  } = usePlaygroundStore()

  const total = executionSteps.length
  const hasSteps = total > 0
  const atStart = currentStep <= 0
  const atEnd = currentStep >= total - 1
  const progress = total > 1 ? (currentStep / (total - 1)) * 100 : 0

  const currentStepData = currentStep >= 0 && currentStep < total
    ? executionSteps[currentStep]
    : null

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="dot" style={{ background: '#ffd60a' }} />
        Execution Controls
        {hasSteps && (
          <span className="tag tag-yellow" style={{ marginLeft: 'auto' }}>
            {currentStep + 1} / {total}
          </span>
        )}
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Current step description */}
        {currentStepData && (
          <div style={{
            background: '#ffd60a08',
            border: '1px solid #ffd60a22',
            borderRadius: 5,
            padding: '8px 10px',
            fontSize: 12,
            color: '#c4c4e0',
            fontFamily: '"JetBrains Mono", monospace',
            lineHeight: 1.5,
          }}>
            <span style={{ color: '#ffd60a' }}>▶ </span>
            {currentStepData.description}
          </div>
        )}

        {/* Timeline slider */}
        {hasSteps && (
          <div>
            <div style={{ marginBottom: 6 }}>
              <input
                type="range"
                min={0}
                max={Math.max(total - 1, 0)}
                value={currentStep < 0 ? 0 : currentStep}
                onChange={(e) => setCurrentStep(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: '#ffd60a',
                  cursor: 'pointer',
                  height: 4,
                }}
              />
            </div>
            {/* Progress bar */}
            <div style={{
              height: 3,
              background: '#1e1e35',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #00e5ff, #ffd60a)',
                borderRadius: 2,
                transition: 'width 0.2s ease',
              }} />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            className="btn btn-danger"
            style={{ flex: 1 }}
            onClick={resetExecution}
            disabled={!hasSteps}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
            </svg>
            Reset
          </button>

          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={stepBackward}
            disabled={!hasSteps || atStart}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>
            </svg>
            Prev
          </button>

          <button
            className="btn btn-success"
            style={{ flex: 1 }}
            onClick={stepForward}
            disabled={!hasSteps || atEnd}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>
            </svg>
            Next
          </button>
        </div>

        {!hasSteps && (
          <div style={{ textAlign: 'center', color: '#374151', fontSize: 12, fontFamily: '"JetBrains Mono", monospace', padding: 4 }}>
            Click "Run Step By Step" to begin
          </div>
        )}
      </div>
    </div>
  )
}
