// AST Parser — wraps @babel/parser and extracts structured info
import * as babelParser from '@babel/parser'
import type { ParsedAST, ASTNode } from '../types'

export function parseCode(code: string): { ast: ParsedAST | null; error: string | null } {
  try {
    const result = babelParser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
      attachComment: true,
      ranges: false,
      tokens: false,
    })

    return {
      ast: result.program as unknown as ParsedAST,
      error: null,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ast: null, error: msg }
  }
}

// ─── Node type → human-readable explanation ──────────────────────────────────

export function explainNode(node: ASTNode, code: string): string {
  if (!node) return 'Select a line to see its explanation.'
  const lines = code.split('\n')

  switch (node.type) {
    case 'VariableDeclaration': {
      const kind = node.kind as string
      const decls = (node.declarations as ASTNode[]) || []
      if (decls.length === 0) return `Declares ${kind} variable(s).`
      const parts = decls.map((d) => {
        const id = d.id as ASTNode
        const init = d.init as ASTNode | null
        const name = (id?.name as string) || '?'
        if (!init) return `\`${name}\` (uninitialized)`
        const initDesc = describeExpression(init)
        return `\`${name}\` = ${initDesc}`
      })
      const keyword = kind === 'const' ? 'constant' : kind === 'let' ? 'block-scoped' : 'function-scoped'
      return `Declares ${keyword} variable${parts.length > 1 ? 's' : ''}: ${parts.join(', ')}.`
    }

    case 'FunctionDeclaration': {
      const name = ((node.id as ASTNode)?.name as string) || 'anonymous'
      const params = ((node.params as ASTNode[]) || []).map((p) => (p.name as string) || '?')
      return `Defines function \`${name}\` with parameter${params.length !== 1 ? 's' : ''} ${params.length ? params.map((p) => `\`${p}\``).join(', ') : '(none)'}. When called, it executes the body block.`
    }

    case 'ArrowFunctionExpression': {
      const params = ((node.params as ASTNode[]) || []).map((p) => (p.name as string) || '?')
      return `Arrow function with parameter${params.length !== 1 ? 's' : ''} ${params.length ? params.map((p) => `\`${p}\``).join(', ') : '(none)'}. Arrow functions capture \`this\` from their enclosing scope.`
    }

    case 'ExpressionStatement': {
      const expr = node.expression as ASTNode
      return explainNode(expr, code)
    }

    case 'CallExpression': {
      const callee = node.callee as ASTNode
      const calleeName = getCalleeName(callee)
      const args = ((node.arguments as ASTNode[]) || []).map(describeExpression)
      if (calleeName === 'console.log') {
        return `Logs to the browser console: ${args.join(', ')}.`
      }
      if (calleeName === 'setTimeout') {
        return `Schedules a callback via \`setTimeout\`. The callback is sent to Web APIs and queued in the Callback Queue after the delay.`
      }
      if (calleeName === 'Promise.resolve') {
        return `Creates a resolved Promise. Its \`.then\` callback will be queued in the Microtask Queue before any macrotasks run.`
      }
      return `Calls function \`${calleeName}\`${args.length ? ` with argument${args.length > 1 ? 's' : ''}: ${args.join(', ')}` : ' with no arguments'}.`
    }

    case 'ReturnStatement': {
      const arg = node.argument as ASTNode | null
      return arg
        ? `Returns the value: ${describeExpression(arg)}. The stack frame for this function will be popped.`
        : `Returns \`undefined\`. Exits the current function, popping its stack frame.`
    }

    case 'IfStatement': {
      const test = node.test as ASTNode
      return `Conditional branch. Evaluates \`${describeExpression(test)}\`. If truthy, executes the consequent block; otherwise falls through to the alternate (else) block, if present.`
    }

    case 'ForStatement':
      return `\`for\` loop — initializes counter, checks condition before each iteration, and updates after each iteration. Creates a new block scope per iteration with \`let\`/\`const\`.`

    case 'WhileStatement': {
      const test = node.test as ASTNode
      return `\`while\` loop — repeatedly executes its body as long as \`${describeExpression(test)}\` is truthy.`
    }

    case 'ForOfStatement':
      return `\`for...of\` loop — iterates over the values of an iterable (Array, String, Map, Set, etc.).`

    case 'ForInStatement':
      return `\`for...in\` loop — iterates over the enumerable string keys of an object.`

    case 'AssignmentExpression': {
      const left = node.left as ASTNode
      const right = node.right as ASTNode
      const op = node.operator as string
      const leftName = (left.name as string) || describeExpression(left)
      return `Assigns \`${describeExpression(right)}\` to \`${leftName}\` using the \`${op}\` operator.`
    }

    case 'BinaryExpression': {
      const left = node.left as ASTNode
      const right = node.right as ASTNode
      const op = node.operator as string
      return `Binary expression: \`${describeExpression(left)} ${op} ${describeExpression(right)}\`. Evaluates both operands and applies the \`${op}\` operator.`
    }

    case 'MemberExpression': {
      const obj = node.object as ASTNode
      const prop = node.property as ASTNode
      return `Property access: reads \`${(prop.name as string) || describeExpression(prop)}\` from \`${describeExpression(obj)}\`.`
    }

    case 'ObjectExpression': {
      const props = (node.properties as ASTNode[]) || []
      return `Creates an object literal with ${props.length} propert${props.length !== 1 ? 'ies' : 'y'} and allocates it on the heap.`
    }

    case 'ArrayExpression': {
      const elems = (node.elements as ASTNode[]) || []
      return `Creates an array literal with ${elems.length} element${elems.length !== 1 ? 's' : ''} and allocates it on the heap.`
    }

    case 'TemplateLiteral':
      return `Template literal — interpolates expressions inside \`\${...}\` into a string.`

    case 'AwaitExpression':
      return `\`await\` pauses execution of the async function until the Promise resolves, then continues. Behind the scenes the function's continuation is placed in the Microtask Queue.`

    case 'ImportDeclaration': {
      const src = (node.source as ASTNode)?.value as string
      return `ES module import from "${src}". At runtime the module is loaded and bindings are created in the current scope.`
    }

    case 'Identifier':
      return `Reference to identifier \`${node.name as string}\`. Looks up the value in the current scope chain.`

    case 'NumericLiteral':
    case 'StringLiteral':
    case 'BooleanLiteral':
    case 'NullLiteral':
      return `Literal value: \`${JSON.stringify(node.value)}\`.`

    case 'BlockStatement':
      return `Block statement — a group of statements enclosed in \`{}\`. Creates a new block scope for \`let\` and \`const\`.`

    case 'Program':
      return `Top-level program. JavaScript starts execution here in the Global Execution Context.`

    default: {
      const lineNo = node.loc?.start?.line
      const src = lineNo ? lines[lineNo - 1]?.trim() : ''
      return `AST node type: \`${node.type}\`${src ? ` — \`${src.slice(0, 60)}\`` : ''}.`
    }
  }
}

function describeExpression(node: ASTNode | null): string {
  if (!node) return 'undefined'
  switch (node.type) {
    case 'Identifier': return node.name as string
    case 'NumericLiteral': return String(node.value)
    case 'StringLiteral': return `"${node.value as string}"`
    case 'BooleanLiteral': return String(node.value)
    case 'NullLiteral': return 'null'
    case 'TemplateLiteral': return '`...`'
    case 'BinaryExpression': {
      const l = node.left as ASTNode
      const r = node.right as ASTNode
      return `${describeExpression(l)} ${node.operator as string} ${describeExpression(r)}`
    }
    case 'CallExpression': {
      const callee = node.callee as ASTNode
      return `${getCalleeName(callee)}(...)`
    }
    case 'MemberExpression': {
      const obj = node.object as ASTNode
      const prop = node.property as ASTNode
      return `${describeExpression(obj)}.${(prop.name as string) || describeExpression(prop)}`
    }
    case 'ObjectExpression': return '{...}'
    case 'ArrayExpression': return '[...]'
    case 'ArrowFunctionExpression': return '(...) => {...}'
    case 'UnaryExpression': return `${node.operator as string}${describeExpression(node.argument as ASTNode)}`
    case 'AssignmentExpression': return describeExpression(node.right as ASTNode)
    default: return node.type
  }
}

function getCalleeName(callee: ASTNode): string {
  if (callee.type === 'Identifier') return callee.name as string
  if (callee.type === 'MemberExpression') {
    const obj = callee.object as ASTNode
    const prop = callee.property as ASTNode
    return `${getCalleeName(obj)}.${(prop.name as string) || '?'}`
  }
  return '(expr)'
}

// ─── Find node at line ────────────────────────────────────────────────────────

export function findNodeAtLine(ast: ParsedAST | null, line: number): ASTNode | null {
  if (!ast) return null
  let found: ASTNode | null = null

  function walk(node: unknown): void {
    if (!node || typeof node !== 'object') return
    const n = node as ASTNode
    if (n.loc) {
      const start = n.loc.start.line
      const end = n.loc.end.line
      if (start === line || (start <= line && end >= line)) {
        if (!found || (n.loc.start.line >= (found.loc?.start.line ?? 0))) {
          found = n
        }
      }
    }
    for (const key of Object.keys(n)) {
      if (key === 'loc' || key === 'type') continue
      const child = n[key]
      if (Array.isArray(child)) child.forEach(walk)
      else if (child && typeof child === 'object') walk(child)
    }
  }

  walk(ast)
  return found
}
