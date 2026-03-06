// ─── Language support ─────────────────────────────────────────────────────────

export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'go'

export interface LanguageConfig {
  id: SupportedLanguage
  label: string
  monacoLang: string
  color: string
  defaultCode: string
}

// ─── Execution ────────────────────────────────────────────────────────────────

export interface ExecutionStep {
  stepIndex: number
  line: number
  description: string
  type: 'declaration' | 'assignment' | 'call' | 'return' | 'branch' | 'loop' | 'expression' | 'async' | 'log'
  variables: Record<string, VariableValue>
  callStack: StackFrame[]
  heapMemory: HeapObject[]
  scopeChain: ScopeLevel[]
  eventLoop?: EventLoopState
  output?: string
}

// ─── Variables ────────────────────────────────────────────────────────────────

export interface VariableValue {
  name: string
  value: unknown
  type: string
  scope: string
  isNew?: boolean
  changed?: boolean
}

// ─── Call Stack ───────────────────────────────────────────────────────────────

export interface StackFrame {
  id: string
  name: string
  line: number
  args?: Record<string, unknown>
}

// ─── Heap ─────────────────────────────────────────────────────────────────────

export interface HeapObject {
  id: string
  type: 'object' | 'array' | 'function'
  value: unknown
  refs: string[]
  label?: string
}

// ─── Scope ────────────────────────────────────────────────────────────────────

export interface ScopeLevel {
  name: string
  type: 'global' | 'function' | 'block'
  variables: Record<string, unknown>
  depth: number
}

// ─── Event Loop ───────────────────────────────────────────────────────────────

export interface EventLoopState {
  callStack: string[]
  webApis: string[]
  callbackQueue: string[]
  microtaskQueue: string[]
  phase: string
}

// ─── AST ──────────────────────────────────────────────────────────────────────

export interface ParsedAST {
  type: string
  body: ASTNode[]
}

export interface ASTNode {
  type: string
  start: number
  end: number
  loc?: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
  [key: string]: unknown
}

// ─── Simulator internals ─────────────────────────────────────────────────────

export type Value =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, Value>
  | Value[]
  | FnValue

export interface FnValue {
  __fn: true
  name: string
  params: string[]
  body: ASTNode
}

export interface SimEnv {
  steps: ExecutionStep[]
  callStack: StackFrame[]
  heap: HeapObject[]
  scopes: Array<Record<string, Value>>
  frameNames: string[]
  heapCounter: number
  consoleOutput: string[]
}
