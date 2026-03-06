import { create } from 'zustand'
import type {
  ExecutionStep,
  VariableValue,
  StackFrame,
  HeapObject,
  ScopeLevel,
  EventLoopState,
  ParsedAST,
  SupportedLanguage,
} from '../types'
import { LANGUAGE_MAP } from '../utils/languageConfigs'

// Re-export types so existing component imports from the store still work
export type {
  ExecutionStep,
  VariableValue,
  StackFrame,
  HeapObject,
  ScopeLevel,
  EventLoopState,
  ParsedAST,
} from '../types'

// ─── Store interface ──────────────────────────────────────────────────────────

interface PlaygroundState {
  // Language
  activeLanguage: SupportedLanguage

  // Editor
  editorCode: string
  selectedLine: number | null

  // AST (JS/TS only)
  parsedAST: ParsedAST | null
  astError: string | null

  // Execution
  executionSteps: ExecutionStep[]
  currentStep: number
  isRunning: boolean
  hasAnalyzed: boolean

  // Visualization data (derived from current step)
  callStack: StackFrame[]
  variables: Record<string, VariableValue>
  heapMemory: HeapObject[]
  scopeChain: ScopeLevel[]
  eventLoopState: EventLoopState | null
  consoleOutput: string[]

  // Actions
  setActiveLanguage: (lang: SupportedLanguage) => void
  setEditorCode: (code: string) => void
  setSelectedLine: (line: number | null) => void
  setParsedAST: (ast: ParsedAST | null, error?: string | null) => void
  setExecutionSteps: (steps: ExecutionStep[]) => void
  setCurrentStep: (step: number) => void
  stepForward: () => void
  stepBackward: () => void
  resetExecution: () => void
  setHasAnalyzed: (v: boolean) => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePlaygroundStore = create<PlaygroundState>((set, get) => ({
  activeLanguage: 'javascript',
  editorCode: LANGUAGE_MAP['javascript'].defaultCode,
  selectedLine: null,
  parsedAST: null,
  astError: null,
  executionSteps: [],
  currentStep: -1,
  isRunning: false,
  hasAnalyzed: false,
  callStack: [],
  variables: {},
  heapMemory: [],
  scopeChain: [],
  eventLoopState: null,
  consoleOutput: [],

  setActiveLanguage: (lang) => {
    const config = LANGUAGE_MAP[lang]
    set({
      activeLanguage: lang,
      editorCode: config.defaultCode,
      // reset execution state on language switch
      parsedAST: null,
      astError: null,
      executionSteps: [],
      currentStep: -1,
      hasAnalyzed: false,
      callStack: [],
      variables: {},
      heapMemory: [],
      scopeChain: [],
      eventLoopState: null,
      consoleOutput: [],
      selectedLine: null,
    })
  },

  setEditorCode: (code) => set({ editorCode: code }),
  setSelectedLine: (line) => set({ selectedLine: line }),

  setParsedAST: (ast, error = null) =>
    set({ parsedAST: ast, astError: error, hasAnalyzed: !!ast }),

  setExecutionSteps: (steps) =>
    set({
      executionSteps: steps,
      currentStep: -1,
      callStack: [],
      variables: {},
      heapMemory: [],
      scopeChain: [],
      eventLoopState: null,
      consoleOutput: [],
    }),

  setCurrentStep: (step) => {
    const { executionSteps } = get()
    if (step < 0 || step >= executionSteps.length) return
    const s = executionSteps[step]
    const outputs = executionSteps
      .slice(0, step + 1)
      .filter((es) => es.output)
      .map((es) => es.output as string)
    set({
      currentStep: step,
      callStack: s.callStack,
      variables: s.variables,
      heapMemory: s.heapMemory,
      scopeChain: s.scopeChain,
      eventLoopState: s.eventLoop || null,
      consoleOutput: outputs,
      selectedLine: s.line,
    })
  },

  stepForward: () => {
    const { currentStep, executionSteps, setCurrentStep } = get()
    if (currentStep < executionSteps.length - 1) setCurrentStep(currentStep + 1)
  },

  stepBackward: () => {
    const { currentStep, setCurrentStep } = get()
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  },

  resetExecution: () =>
    set({
      currentStep: -1,
      callStack: [],
      variables: {},
      heapMemory: [],
      scopeChain: [],
      eventLoopState: null,
      consoleOutput: [],
      selectedLine: null,
    }),

  setHasAnalyzed: (v) => set({ hasAnalyzed: v }),
}))
