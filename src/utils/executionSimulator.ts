// Execution Simulator
// Walks the AST and produces an ordered array of ExecutionStep objects.
// This is a simplified symbolic interpreter — not a full JS engine.

import type {
  ExecutionStep,
  VariableValue,
  StackFrame,
  HeapObject,
  ScopeLevel,
  ParsedAST,
  ASTNode,
  Value,
  FnValue,
  SimEnv,
} from '../types'

let _stepIdx = 0

function cloneCallStack(env: SimEnv): StackFrame[] {
  return env.callStack.map((f) => ({ ...f }))
}

function cloneVariables(env: SimEnv): Record<string, VariableValue> {
  const result: Record<string, VariableValue> = {}
  for (let i = env.scopes.length - 1; i >= 0; i--) {
    for (const [k, v] of Object.entries(env.scopes[i])) {
      if (!result[k]) {
        result[k] = {
          name: k,
          value: serializeValue(v),
          type: getType(v),
          scope: i === 0 ? 'global' : env.frameNames[i] || 'block',
        }
      }
    }
  }
  return result
}

function cloneHeap(env: SimEnv): HeapObject[] {
  return env.heap.map((h) => ({ ...h, refs: [...h.refs] }))
}

function cloneScopeChain(env: SimEnv): ScopeLevel[] {
  return env.scopes.map((s, i) => ({
    name: i === 0 ? 'Global' : env.frameNames[i] || `Block-${i}`,
    type: i === 0 ? 'global' : 'function',
    variables: Object.fromEntries(Object.entries(s).map(([k, v]) => [k, serializeValue(v)])),
    depth: i,
  }))
}

function serializeValue(v: Value): unknown {
  if (v === null || v === undefined) return v
  if (typeof v === 'object' && !Array.isArray(v)) {
    const vv = v as Record<string, Value>
    if (vv.__fn) return `[Function: ${(vv as unknown as FnValue).name}]`
    return Object.fromEntries(Object.entries(vv).map(([k, val]) => [k, serializeValue(val)]))
  }
  if (Array.isArray(v)) return (v as Value[]).map(serializeValue)
  return v
}

function getType(v: Value): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (Array.isArray(v)) return 'array'
  if (typeof v === 'object') {
    const vv = v as Record<string, Value>
    if (vv.__fn) return 'function'
    return 'object'
  }
  return typeof v
}

function addStep(
  env: SimEnv,
  line: number,
  description: string,
  type: ExecutionStep['type'],
  output?: string,
) {
  env.steps.push({
    stepIndex: _stepIdx++,
    line,
    description,
    type,
    variables: cloneVariables(env),
    callStack: cloneCallStack(env),
    heapMemory: cloneHeap(env),
    scopeChain: cloneScopeChain(env),
    output,
  })
}

function lookupVar(env: SimEnv, name: string): Value {
  for (let i = env.scopes.length - 1; i >= 0; i--) {
    if (name in env.scopes[i]) return env.scopes[i][name]
  }
  return undefined
}

function setVar(env: SimEnv, name: string, value: Value, declare = false): void {
  if (declare) {
    env.scopes[env.scopes.length - 1][name] = value
    return
  }
  for (let i = env.scopes.length - 1; i >= 0; i--) {
    if (name in env.scopes[i]) {
      env.scopes[i][name] = value
      return
    }
  }
  // If not found, set in global
  env.scopes[0][name] = value
}

function allocHeap(env: SimEnv, type: HeapObject['type'], value: unknown, label?: string): string {
  const id = `heap_${env.heapCounter++}`
  env.heap.push({ id, type, value, refs: [], label })
  return id
}

function getLine(node: ASTNode): number {
  return node.loc?.start?.line ?? 0
}

// ─── Main evaluator ───────────────────────────────────────────────────────────

function evalExpression(env: SimEnv, node: ASTNode): Value {
  if (!node) return undefined
  switch (node.type) {
    case 'NumericLiteral': return node.value as number
    case 'StringLiteral': return node.value as string
    case 'BooleanLiteral': return node.value as boolean
    case 'NullLiteral': return null
    case 'Identifier': return lookupVar(env, node.name as string)
    case 'TemplateLiteral': {
      const quasis = (node.quasis as ASTNode[]) || []
      const exprs = (node.expressions as ASTNode[]) || []
      let result = ''
      for (let i = 0; i < quasis.length; i++) {
        const q = quasis[i] as unknown as { value: { cooked: string } }
        result += q.value.cooked
        if (i < exprs.length) result += String(evalExpression(env, exprs[i]))
      }
      return result
    }
    case 'BinaryExpression': {
      const left = evalExpression(env, node.left as ASTNode)
      const right = evalExpression(env, node.right as ASTNode)
      const op = node.operator as string
      if (typeof left === 'number' && typeof right === 'number') {
        switch (op) {
          case '+': return left + right
          case '-': return left - right
          case '*': return left * right
          case '/': return right !== 0 ? left / right : Infinity
          case '%': return left % right
          case '**': return Math.pow(left, right)
          case '<': return left < right
          case '>': return left > right
          case '<=': return left <= right
          case '>=': return left >= right
          case '===': case '==': return left === right
          case '!==': case '!=': return left !== right
        }
      }
      if (op === '+') return String(left) + String(right)
      if (op === '===') return left === right
      if (op === '!==') return left !== right
      if (op === '==') return left == right // eslint-disable-line
      if (op === '!=') return left != right // eslint-disable-line
      return undefined
    }
    case 'LogicalExpression': {
      const left = evalExpression(env, node.left as ASTNode)
      const op = node.operator as string
      if (op === '&&') return left ? evalExpression(env, node.right as ASTNode) : left
      if (op === '||') return left ? left : evalExpression(env, node.right as ASTNode)
      if (op === '??') return left !== null && left !== undefined ? left : evalExpression(env, node.right as ASTNode)
      return undefined
    }
    case 'UnaryExpression': {
      const arg = evalExpression(env, node.argument as ASTNode)
      const op = node.operator as string
      if (op === '!') return !arg
      if (op === '-') return -(arg as number)
      if (op === '+') return +(arg as number)
      if (op === 'typeof') return typeof arg
      return undefined
    }
    case 'MemberExpression': {
      const obj = evalExpression(env, node.object as ASTNode) as Record<string, Value>
      if (!obj || typeof obj !== 'object') return undefined
      const prop = node.computed
        ? evalExpression(env, node.property as ASTNode)
        : (node.property as ASTNode).name
      return obj[String(prop)]
    }
    case 'ObjectExpression': {
      const props = (node.properties as ASTNode[]) || []
      const obj: Record<string, Value> = {}
      for (const prop of props) {
        const key = (prop.key as ASTNode)?.name as string || String((prop.key as ASTNode)?.value)
        const val = evalExpression(env, prop.value as ASTNode)
        obj[key] = val
      }
      allocHeap(env, 'object', obj)
      return obj
    }
    case 'ArrayExpression': {
      const elems = (node.elements as ASTNode[]) || []
      const arr = elems.map((e) => evalExpression(env, e))
      allocHeap(env, 'array', arr)
      return arr
    }
    case 'ArrowFunctionExpression':
    case 'FunctionExpression': {
      const params = ((node.params as ASTNode[]) || []).map((p) => (p.name as string) || '?')
      const fn: FnValue = { __fn: true, name: 'anonymous', params, body: node.body as ASTNode }
      return fn as unknown as Value
    }
    case 'AssignmentExpression': {
      const val = evalExpression(env, node.right as ASTNode)
      const left = node.left as ASTNode
      if (left.type === 'Identifier') setVar(env, left.name as string, val)
      return val
    }
    case 'CallExpression': {
      return evalCall(env, node)
    }
    default:
      return undefined
  }
}

function evalCall(env: SimEnv, node: ASTNode): Value {
  const callee = node.callee as ASTNode
  const args = (node.arguments as ASTNode[]) || []
  const line = getLine(node)

  // console.log
  if (
    callee.type === 'MemberExpression' &&
    (callee.object as ASTNode).name === 'console' &&
    ((callee.property as ASTNode).name === 'log' || (callee.property as ASTNode).name === 'warn')
  ) {
    const vals = args.map((a) => String(serializeValue(evalExpression(env, a))))
    const output = vals.join(' ')
    addStep(env, line, `console.log(${vals.join(', ')})`, 'log', output)
    return undefined
  }

  // setTimeout
  if (callee.type === 'Identifier' && (callee.name as string) === 'setTimeout') {
    addStep(env, line, `setTimeout() — callback sent to Web APIs, queued in Callback Queue after delay`, 'async')
    return undefined
  }

  // Promise.resolve
  if (
    callee.type === 'MemberExpression' &&
    (callee.object as ASTNode).name === 'Promise' &&
    (callee.property as ASTNode).name === 'resolve'
  ) {
    addStep(env, line, `Promise.resolve() — resolved Promise; .then callback enters Microtask Queue`, 'async')
    return undefined
  }

  // User-defined function
  const fnName =
    callee.type === 'Identifier'
      ? (callee.name as string)
      : callee.type === 'MemberExpression'
      ? `${(callee.object as ASTNode).name}.${(callee.property as ASTNode).name}`
      : 'fn'

  const fnVal = callee.type === 'Identifier' ? lookupVar(env, callee.name as string) : undefined
  const fn = fnVal as FnValue | undefined

  const argVals = args.map((a) => evalExpression(env, a))

  // Push call stack frame
  const frameId = `frame_${Date.now()}_${Math.random()}`
  const frame: StackFrame = { id: frameId, name: fnName, line }
  env.callStack.push(frame)

  addStep(env, line, `Call \`${fnName}(${argVals.map((v) => JSON.stringify(serializeValue(v as Value))).join(', ')})\` — push stack frame`, 'call')

  let returnVal: Value = undefined

  if (fn && fn.__fn && fn.body) {
    // Push new scope for this function
    const scope: Record<string, Value> = {}
    fn.params.forEach((p, i) => { scope[p] = argVals[i] as Value })
    env.scopes.push(scope)
    env.frameNames.push(fnName)

    try {
      returnVal = execBlock(env, fn.body)
    } catch (e) {
      if (e instanceof ReturnSignal) {
        returnVal = e.value
      }
    }

    env.scopes.pop()
    env.frameNames.pop()
  }

  // Pop call stack frame
  env.callStack.pop()
  addStep(env, line, `\`${fnName}\` returns ${JSON.stringify(serializeValue(returnVal))} — pop stack frame`, 'return')

  return returnVal
}

class ReturnSignal {
  constructor(public value: Value) {}
}

function execStatement(env: SimEnv, node: ASTNode): void {
  if (!node) return
  const line = getLine(node)

  switch (node.type) {
    case 'VariableDeclaration': {
      const kind = node.kind as string
      const decls = (node.declarations as ASTNode[]) || []
      for (const decl of decls) {
        const name = ((decl.id as ASTNode)?.name as string) || '?'
        const val = decl.init ? evalExpression(env, decl.init as ASTNode) : undefined
        setVar(env, name, val as Value, true)
        addStep(env, line, `${kind} \`${name}\` = ${JSON.stringify(serializeValue(val as Value))}`, 'declaration')
      }
      break
    }

    case 'FunctionDeclaration': {
      const name = ((node.id as ASTNode)?.name as string) || 'anonymous'
      const params = ((node.params as ASTNode[]) || []).map((p) => (p.name as string) || '?')
      const fn: FnValue = { __fn: true, name, params, body: node.body as ASTNode }
      setVar(env, name, fn as unknown as Value, true)
      addStep(env, line, `Function declaration: \`${name}(${params.join(', ')})\` hoisted into scope`, 'declaration')
      break
    }

    case 'ExpressionStatement': {
      evalExpression(env, node.expression as ASTNode)
      const expr = node.expression as ASTNode
      if (expr.type !== 'CallExpression') {
        addStep(env, line, `Expression: ${expr.type}`, 'expression')
      }
      break
    }

    case 'ReturnStatement': {
      const val = node.argument ? evalExpression(env, node.argument as ASTNode) : undefined
      addStep(env, line, `return ${JSON.stringify(serializeValue(val as Value))}`, 'return')
      throw new ReturnSignal(val as Value)
    }

    case 'IfStatement': {
      const test = evalExpression(env, node.test as ASTNode)
      addStep(env, line, `if (${JSON.stringify(serializeValue(test as Value))}) → branch ${test ? 'taken' : 'skipped'}`, 'branch')
      if (test) {
        execBlock(env, node.consequent as ASTNode)
      } else if (node.alternate) {
        execBlock(env, node.alternate as ASTNode)
      }
      break
    }

    case 'ForStatement': {
      if (node.init) execStatement(env, node.init as ASTNode)
      let iterations = 0
      while (iterations++ < 50) {
        const test = node.test ? evalExpression(env, node.test as ASTNode) : true
        addStep(env, line, `for — condition: ${JSON.stringify(serializeValue(test as Value))}`, 'loop')
        if (!test) break
        try {
          execBlock(env, node.body as ASTNode)
        } catch (e) {
          if (e instanceof ReturnSignal) throw e
          break
        }
        if (node.update) evalExpression(env, node.update as ASTNode)
      }
      break
    }

    case 'WhileStatement': {
      let iterations = 0
      while (iterations++ < 50) {
        const test = evalExpression(env, node.test as ASTNode)
        addStep(env, line, `while — condition: ${JSON.stringify(serializeValue(test as Value))}`, 'loop')
        if (!test) break
        try {
          execBlock(env, node.body as ASTNode)
        } catch (e) {
          if (e instanceof ReturnSignal) throw e
          break
        }
      }
      break
    }

    case 'BlockStatement':
      execBlock(env, node)
      break

    default:
      // Skip unsupported nodes silently
      break
  }
}

function execBlock(env: SimEnv, node: ASTNode): Value {
  if (!node) return undefined
  if (node.type === 'BlockStatement') {
    const body = (node.body as ASTNode[]) || []
    for (const stmt of body) {
      execStatement(env, stmt)
    }
  } else {
    execStatement(env, node)
  }
  return undefined
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function simulateExecution(ast: ParsedAST): ExecutionStep[] {
  _stepIdx = 0
  const env: SimEnv = {
    steps: [],
    callStack: [],
    heap: [],
    scopes: [{}],
    frameNames: ['global'],
    heapCounter: 0,
    consoleOutput: [],
  }

  // Initial step
  addStep(env, 1, 'Program starts — Global Execution Context created', 'expression')

  const body = (ast.body as ASTNode[]) || []
  for (const stmt of body) {
    try {
      execStatement(env, stmt)
    } catch (e) {
      if (e instanceof ReturnSignal) break
    }
  }

  addStep(env, 0, 'Program complete — Global Execution Context destroyed', 'expression')

  return env.steps
}
