import type { SupportedLanguage } from '../types'

// ─── Generic line-level explanation per language ──────────────────────────────
// Since non-JS languages can't be parsed via Babel, we use regex heuristics
// to produce meaningful explanations from raw source lines.

export interface LineExplanation {
  summary: string
  concept?: string
  detail?: string
  tag: string
  tagColor: string
}

export function explainLine(
  line: string,
  lineNumber: number,
  language: SupportedLanguage
): LineExplanation {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed === '{' || trimmed === '}') {
    return generic(trimmed, language)
  }

  switch (language) {
    case 'javascript': return explainJS(trimmed)
    case 'typescript': return explainTS(trimmed)
    case 'python':     return explainPython(trimmed)
    case 'java':       return explainJava(trimmed)
    case 'cpp':        return explainCpp(trimmed)
    case 'go':         return explainGo(trimmed)
    default:           return generic(trimmed, language)
  }
}

// ─── JavaScript ───────────────────────────────────────────────────────────────

function explainJS(line: string): LineExplanation {
  // Variable declarations
  const varMatch = line.match(/^(const|let|var)\s+(\w+)\s*=\s*(.+)/)
  if (varMatch) {
    const [, kind, name, init] = varMatch
    const keyword = kind === 'const' ? 'constant (immutable binding)' : kind === 'let' ? 'block-scoped variable' : 'function-scoped variable'
    return {
      summary: `Declares ${keyword} \`${name}\` and assigns it \`${init.replace(/;$/, '')}\`.`,
      concept: kind === 'const' ? 'Once assigned, the binding cannot be reassigned (though objects can still be mutated).' : kind === 'let' ? 'Scoped to the enclosing block `{}`. Not accessible before declaration (temporal dead zone).' : '`var` is hoisted to the top of its function scope — avoid in modern JS.',
      tag: kind.toUpperCase(),
      tagColor: 'tag-cyan',
    }
  }

  // Function declaration
  const fnMatch = line.match(/^(async\s+)?function\s+(\w+)\s*\(([^)]*)\)/)
  if (fnMatch) {
    const [, asyncKw, name, params] = fnMatch
    return {
      summary: `Declares ${asyncKw ? 'async ' : ''}function \`${name}\` with parameters: ${params || 'none'}.`,
      concept: asyncKw ? 'An async function always returns a Promise. You can use `await` inside it to pause execution until a Promise resolves.' : 'When called, a new stack frame is pushed onto the Call Stack. When it returns, the frame is popped.',
      tag: asyncKw ? 'ASYNC FN' : 'FUNCTION',
      tagColor: 'tag-purple',
    }
  }

  // Arrow function assignment
  const arrowMatch = line.match(/^(const|let|var)\s+(\w+)\s*=\s*(async\s+)?\(([^)]*)\)\s*=>/)
  if (arrowMatch) {
    const [, , name, asyncKw, params] = arrowMatch
    return {
      summary: `Assigns ${asyncKw ? 'async ' : ''}arrow function to \`${name}\` with parameters: ${params || 'none'}.`,
      concept: 'Arrow functions do not have their own `this` — they inherit it from the enclosing lexical scope. They also cannot be used as constructors.',
      tag: 'ARROW FN',
      tagColor: 'tag-purple',
    }
  }

  // Return statement
  if (line.match(/^return\b/)) {
    const val = line.replace(/^return\s*/, '').replace(/;$/, '')
    return {
      summary: `Returns \`${val || 'undefined'}\` from the current function.`,
      concept: 'The current stack frame is popped from the Call Stack and control returns to the caller.',
      tag: 'RETURN',
      tagColor: 'tag-pink',
    }
  }

  // If statement
  if (line.match(/^if\s*\(/)) {
    const cond = line.match(/^if\s*\((.+)\)/)?.[1]
    return {
      summary: `Conditional branch — evaluates \`${cond}\`.`,
      concept: 'If the condition is truthy, the consequent block runs. JavaScript uses "truthy/falsy" coercion: 0, "", null, undefined, NaN, and false are falsy; everything else is truthy.',
      tag: 'IF',
      tagColor: 'tag-yellow',
    }
  }

  // For loop
  if (line.match(/^for\s*\(/)) {
    return {
      summary: 'Starts a `for` loop — init, condition check, and update expression.',
      concept: 'Each iteration creates a new block scope for `let`/`const`. The loop runs until the condition is falsy.',
      tag: 'FOR LOOP',
      tagColor: 'tag-yellow',
    }
  }

  // console.log
  if (line.match(/^console\.(log|warn|error|info)\(/)) {
    return {
      summary: `Writes output to the browser/Node.js console.`,
      concept: 'console.log is a Web API method. It does not block execution and its output appears asynchronously in DevTools.',
      tag: 'CONSOLE',
      tagColor: 'tag-green',
    }
  }

  // Function call
  const callMatch = line.match(/^(\w+)\s*\(/)
  if (callMatch) {
    return {
      summary: `Calls function \`${callMatch[1]}()\`.`,
      concept: 'A new execution context is created and its frame is pushed onto the Call Stack.',
      tag: 'CALL',
      tagColor: 'tag-orange',
    }
  }

  return { summary: line, tag: 'EXPR', tagColor: 'tag-cyan' }
}

// ─── TypeScript ───────────────────────────────────────────────────────────────

function explainTS(line: string): LineExplanation {
  // Interface
  if (line.match(/^(export\s+)?interface\s+\w+/)) {
    const name = line.match(/interface\s+(\w+)/)?.[1]
    return {
      summary: `Declares TypeScript interface \`${name}\`.`,
      concept: 'Interfaces define the shape of an object at compile time only — they are erased at runtime and produce no JavaScript output.',
      tag: 'INTERFACE',
      tagColor: 'tag-cyan',
    }
  }

  // Type alias
  if (line.match(/^(export\s+)?type\s+\w+\s*=/)) {
    const name = line.match(/type\s+(\w+)/)?.[1]
    return {
      summary: `Declares type alias \`${name}\`.`,
      concept: 'Type aliases are compile-time constructs. Unlike interfaces, they can alias primitives, unions, tuples, and more.',
      tag: 'TYPE',
      tagColor: 'tag-cyan',
    }
  }

  // Typed variable
  const varMatch = line.match(/^(const|let|var)\s+(\w+)\s*:\s*(\w[\w<>[\], |&]*)\s*=/)
  if (varMatch) {
    const [, kind, name, type] = varMatch
    return {
      summary: `Declares \`${kind} ${name}: ${type}\`.`,
      concept: `TypeScript enforces that \`${name}\` always holds a value of type \`${type}\`. This is checked at compile time — the type annotation is stripped in the emitted JavaScript.`,
      tag: kind.toUpperCase(),
      tagColor: 'tag-cyan',
    }
  }

  // Typed function
  const fnMatch = line.match(/^(async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*:\s*(.+)/)
  if (fnMatch) {
    const [, asyncKw, name, params, ret] = fnMatch
    return {
      summary: `Declares ${asyncKw ? 'async ' : ''}function \`${name}(${params}): ${ret.replace(/\{$/, '').trim()}\`.`,
      concept: `TypeScript will verify every call site passes the correct argument types and that the function only returns values assignable to \`${ret.trim()}\`.`,
      tag: 'TYPED FN',
      tagColor: 'tag-purple',
    }
  }

  // Enum
  if (line.match(/^(export\s+)?(const\s+)?enum\s+\w+/)) {
    const name = line.match(/enum\s+(\w+)/)?.[1]
    return {
      summary: `Declares enum \`${name}\`.`,
      concept: 'Enums compile to a real JavaScript object (unless `const enum` is used, which is inlined at every usage site).',
      tag: 'ENUM',
      tagColor: 'tag-purple',
    }
  }

  // Generic fallback — delegate to JS explainer for shared syntax
  return explainJS(line)
}

// ─── Python ───────────────────────────────────────────────────────────────────

function explainPython(line: string): LineExplanation {
  // def
  const defMatch = line.match(/^(async\s+)?def\s+(\w+)\s*\(([^)]*)\)(\s*->\s*(.+))?:/)
  if (defMatch) {
    const [, asyncKw, name, params, , ret] = defMatch
    return {
      summary: `Defines ${asyncKw ? 'async ' : ''}function \`${name}(${params})\`${ret ? ` → \`${ret.trim()}\`` : ''}.`,
      concept: asyncKw
        ? 'Async functions return a coroutine. Use `await` inside to pause until an awaitable resolves. Run with `asyncio.run()` or inside another async function.'
        : 'Python functions are first-class objects. They create a new local scope — variables inside are not visible outside unless returned or declared `global`/`nonlocal`.',
      tag: asyncKw ? 'ASYNC DEF' : 'DEF',
      tagColor: 'tag-purple',
    }
  }

  // class
  const classMatch = line.match(/^class\s+(\w+)(\(([^)]*)\))?:/)
  if (classMatch) {
    const [, name, , base] = classMatch
    return {
      summary: `Declares class \`${name}\`${base ? ` inheriting from \`${base}\`` : ''}.`,
      concept: 'Python classes use `__init__` as the constructor. `self` refers to the instance and must be the first parameter of every instance method.',
      tag: 'CLASS',
      tagColor: 'tag-purple',
    }
  }

  // Variable assignment with type hint
  const typedVar = line.match(/^(\w+)\s*:\s*(\w[\w[\], |]*)\s*=\s*(.+)/)
  if (typedVar) {
    const [, name, typ, val] = typedVar
    return {
      summary: `Assigns \`${name}: ${typ} = ${val}\`.`,
      concept: `Python type hints are annotations only — they are not enforced at runtime. Tools like mypy or Pyright use them for static analysis.`,
      tag: 'TYPED VAR',
      tagColor: 'tag-cyan',
    }
  }

  // Variable assignment
  const varMatch = line.match(/^(\w+)\s*=\s*(.+)/)
  if (varMatch) {
    const [, name, val] = varMatch
    return {
      summary: `Assigns \`${val}\` to \`${name}\`.`,
      concept: 'Python variables are dynamically typed — the name is just a reference. Assignment rebinds the name to a new object; it does not mutate the old one (for immutables).',
      tag: 'ASSIGN',
      tagColor: 'tag-green',
    }
  }

  // return
  if (line.match(/^return\b/)) {
    const val = line.replace(/^return\s*/, '')
    return {
      summary: `Returns \`${val || 'None'}\` from the current function.`,
      concept: 'Returning from a function pops the frame from the call stack. Functions without an explicit return statement return `None`.',
      tag: 'RETURN',
      tagColor: 'tag-pink',
    }
  }

  // if
  if (line.match(/^if\s+.+:/)) {
    const cond = line.replace(/^if\s+/, '').replace(/:$/, '')
    return {
      summary: `Evaluates condition \`${cond}\`.`,
      concept: 'Python uses indentation (not braces) to define blocks. Falsy values: `False`, `None`, `0`, `""`, `[]`, `{}`, `()`.',
      tag: 'IF',
      tagColor: 'tag-yellow',
    }
  }

  // for
  if (line.match(/^for\s+.+\s+in\s+.+:/)) {
    const m = line.match(/^for\s+(.+)\s+in\s+(.+):/)
    return {
      summary: `Iterates over \`${m?.[2]}\`, binding each item to \`${m?.[1]}\`.`,
      concept: '`for...in` loops work with any iterable — lists, tuples, strings, generators, dicts, etc. Python `for` loops are always "for-each" style.',
      tag: 'FOR',
      tagColor: 'tag-yellow',
    }
  }

  // while
  if (line.match(/^while\s+.+:/)) {
    const cond = line.replace(/^while\s+/, '').replace(/:$/, '')
    return {
      summary: `Loops while \`${cond}\` is truthy.`,
      concept: 'Use `break` to exit early and `continue` to skip to the next iteration. `while True:` is a common pattern for event loops.',
      tag: 'WHILE',
      tagColor: 'tag-yellow',
    }
  }

  // print
  if (line.match(/^print\s*\(/)) {
    return {
      summary: 'Writes output to stdout.',
      concept: '`print()` is a built-in function in Python 3. It calls `str()` on each argument and writes to `sys.stdout` followed by a newline.',
      tag: 'PRINT',
      tagColor: 'tag-green',
    }
  }

  // import
  if (line.match(/^(import|from)\s+\w+/)) {
    return {
      summary: `Module import: \`${line}\`.`,
      concept: 'Python caches imported modules in `sys.modules`. Subsequent imports of the same module return the cached version without re-executing the module file.',
      tag: 'IMPORT',
      tagColor: 'tag-orange',
    }
  }

  return { summary: line, tag: 'STMT', tagColor: 'tag-cyan' }
}

// ─── Java ─────────────────────────────────────────────────────────────────────

function explainJava(line: string): LineExplanation {
  // Class declaration
  if (line.match(/^(public|private|protected)?\s*(abstract|final)?\s*class\s+\w+/)) {
    const name = line.match(/class\s+(\w+)/)?.[1]
    const ext = line.match(/extends\s+(\w+)/)?.[1]
    const impl = line.match(/implements\s+([\w, ]+)/)?.[1]
    return {
      summary: `Declares class \`${name}\`${ext ? ` extending \`${ext}\`` : ''}${impl ? ` implementing \`${impl}\`` : ''}.`,
      concept: 'Java classes are blueprints for objects. All code must live inside a class. The JVM loads and links classes on demand.',
      tag: 'CLASS',
      tagColor: 'tag-purple',
    }
  }

  // Method declaration
  const methodMatch = line.match(/^(public|private|protected|static|\s)+\s+(\w[\w<>[\]]*)\s+(\w+)\s*\(([^)]*)\)/)
  if (methodMatch) {
    const [, mods, ret, name, params] = methodMatch
    return {
      summary: `Declares method \`${name}(${params})\` returning \`${ret}\`.`,
      concept: `${mods?.includes('static') ? 'Static methods belong to the class, not to any instance — call them via the class name.' : 'Instance methods have access to `this`, which refers to the current object.'} Return type \`${ret}\` is enforced at compile time.`,
      tag: ret === 'void' ? 'VOID METHOD' : 'METHOD',
      tagColor: 'tag-purple',
    }
  }

  // Variable declaration
  const varMatch = line.match(/^(int|long|double|float|boolean|char|String|var|[\w<>[\]]+)\s+(\w+)\s*=\s*(.+);/)
  if (varMatch) {
    const [, type, name, val] = varMatch
    return {
      summary: `Declares \`${type} ${name} = ${val}\`.`,
      concept: `Java is statically typed — \`${name}\` can only hold values of type \`${type}\`. Primitive types (int, boolean, etc.) are stored on the stack; reference types (objects) are stored on the heap.`,
      tag: type === 'var' ? 'INFERRED' : type.toUpperCase(),
      tagColor: 'tag-cyan',
    }
  }

  // System.out.println
  if (line.match(/System\.out\.(println|print|printf)\(/)) {
    return {
      summary: 'Writes output to the standard output stream.',
      concept: '`System.out` is a `PrintStream`. `println` adds a newline; `print` does not. `printf` supports C-style format strings.',
      tag: 'SYSOUT',
      tagColor: 'tag-green',
    }
  }

  // return
  if (line.match(/^return\b/)) {
    const val = line.replace(/^return\s*/, '').replace(/;$/, '')
    return {
      summary: `Returns \`${val || 'void'}\` from this method.`,
      concept: 'The return value must be assignable to the declared return type. Methods declared `void` cannot return a value.',
      tag: 'RETURN',
      tagColor: 'tag-pink',
    }
  }

  // for loop
  if (line.match(/^for\s*\(/)) {
    const enhanced = line.match(/^for\s*\(\s*\w[\w<>[\]]*\s+\w+\s*:\s*/)
    return {
      summary: enhanced ? 'Enhanced `for-each` loop — iterates over an Iterable or array.' : 'Traditional `for` loop with initializer, condition, and update.',
      concept: enhanced ? 'For-each loops use the `Iterable` interface internally (calls `iterator()`). They cannot modify the collection while iterating.' : 'Loop variable declared with `int` is scoped to the loop body.',
      tag: enhanced ? 'FOR-EACH' : 'FOR',
      tagColor: 'tag-yellow',
    }
  }

  // if
  if (line.match(/^if\s*\(/)) {
    const cond = line.match(/^if\s*\((.+)\)/)?.[1]
    return {
      summary: `Conditional: evaluates \`${cond}\`.`,
      concept: 'Java conditionals require a boolean expression — unlike JavaScript, there is no truthy/falsy coercion.',
      tag: 'IF',
      tagColor: 'tag-yellow',
    }
  }

  // new
  if (line.includes('new ')) {
    const cls = line.match(/new\s+(\w+)/)?.[1]
    return {
      summary: `Allocates a new \`${cls}\` instance on the heap.`,
      concept: '`new` calls the constructor, allocates memory on the JVM heap, and returns a reference. The garbage collector reclaims it when no references remain.',
      tag: 'NEW',
      tagColor: 'tag-orange',
    }
  }

  return { summary: line.replace(/;$/, ''), tag: 'STMT', tagColor: 'tag-cyan' }
}

// ─── C++ ──────────────────────────────────────────────────────────────────────

function explainCpp(line: string): LineExplanation {
  // #include
  if (line.match(/^#include\s*/)) {
    const header = line.match(/#include\s*[<"](.+)[>"]/)?.[1]
    return {
      summary: `Includes header \`${header}\`.`,
      concept: 'The preprocessor literally pastes the header file contents here before compilation. Angle brackets `<>` search system paths; quotes `""` search relative paths first.',
      tag: '#INCLUDE',
      tagColor: 'tag-orange',
    }
  }

  // Function definition / declaration
  const fnMatch = line.match(/^([\w:*&<> ]+)\s+(\w+)\s*\(([^)]*)\)\s*(\{|;|const)/)
  if (fnMatch && !line.match(/^(if|for|while|switch)/)) {
    const [, ret, name, params] = fnMatch
    const isRef = ret.includes('&')
    const isPtr = ret.includes('*')
    return {
      summary: `Defines function \`${name}(${params})\` returning \`${ret.trim()}\`.`,
      concept: isRef
        ? 'Returning by reference avoids copying. Be careful not to return a reference to a local variable — it becomes a dangling reference after the function returns.'
        : isPtr
        ? 'Returning a raw pointer — ensure the pointed-to object outlives the caller, or use smart pointers (`std::unique_ptr`, `std::shared_ptr`).'
        : 'Returning by value invokes the copy/move constructor. The compiler often applies RVO (Return Value Optimization) to elide the copy.',
      tag: 'FUNCTION',
      tagColor: 'tag-purple',
    }
  }

  // Variable with type
  const varMatch = line.match(/^(const\s+)?([\w:*&<> ]+)\s+(\w+)\s*=\s*(.+);/)
  if (varMatch && !line.match(/^(if|for|while|return)/)) {
    const [, constKw, type, name, val] = varMatch
    return {
      summary: `Declares \`${constKw || ''}${type.trim()} ${name} = ${val}\`.`,
      concept: constKw
        ? '`const` variables must be initialized at declaration and cannot be reassigned. The compiler may place them in read-only memory.'
        : `\`${name}\` is stack-allocated. Its destructor runs automatically when it goes out of scope (RAII).`,
      tag: constKw ? 'CONST' : type.trim().toUpperCase().slice(0, 6),
      tagColor: 'tag-cyan',
    }
  }

  // std::cout
  if (line.match(/std::cout|cout\s*<</)) {
    return {
      summary: 'Writes output to the standard output stream via `<<` operator.',
      concept: '`std::cout` is a `std::ostream`. `<<` is the stream insertion operator, overloaded for many types. `std::endl` flushes the buffer; `"\\n"` is faster if flushing is not needed.',
      tag: 'COUT',
      tagColor: 'tag-green',
    }
  }

  // return
  if (line.match(/^return\b/)) {
    const val = line.replace(/^return\s*/, '').replace(/;$/, '')
    return {
      summary: `Returns \`${val}\` from this function.`,
      concept: '`return 0` from `main()` signals success to the OS. Non-zero conventionally indicates an error.',
      tag: 'RETURN',
      tagColor: 'tag-pink',
    }
  }

  // for
  if (line.match(/^for\s*\(/)) {
    const rangeFor = line.match(/^for\s*\(\s*(const\s+)?(\w+)&?\s+\w+\s*:\s*/)
    return {
      summary: rangeFor ? 'Range-based `for` loop — iterates over elements of a container.' : 'Traditional C-style `for` loop.',
      concept: rangeFor
        ? 'Use `const auto&` to avoid copies when iterating. The compiler calls `begin()` and `end()` on the range.'
        : 'Loop variable is typically an `int` or `size_t`. Prefer range-based for when possible.',
      tag: rangeFor ? 'RANGE-FOR' : 'FOR',
      tagColor: 'tag-yellow',
    }
  }

  // new
  if (line.match(/\bnew\s+\w+/)) {
    const cls = line.match(/new\s+(\w+)/)?.[1]
    return {
      summary: `Dynamically allocates a \`${cls}\` on the heap.`,
      concept: 'Raw `new` requires a matching `delete` to avoid memory leaks. Prefer `std::make_unique<T>()` or `std::make_shared<T>()` for automatic lifetime management (RAII).',
      tag: 'NEW',
      tagColor: 'tag-orange',
    }
  }

  // if
  if (line.match(/^if\s*\(/)) {
    return {
      summary: `Conditional branch.`,
      concept: 'C++ conditions accept any type convertible to bool. Pointers are falsy when null, integers are falsy when 0.',
      tag: 'IF',
      tagColor: 'tag-yellow',
    }
  }

  return { summary: line.replace(/;$/, ''), tag: 'STMT', tagColor: 'tag-cyan' }
}

// ─── Generic fallback ─────────────────────────────────────────────────────────

function generic(line: string, _lang: SupportedLanguage): LineExplanation {
  if (!line || line === '{' || line === '}') {
    return { summary: 'Block delimiter — opens or closes a scope.', tag: 'BLOCK', tagColor: 'tag-cyan' }
  }
  if (line.startsWith('//') || line.startsWith('#') || line.startsWith('/*') || line.startsWith('*')) {
    return { summary: 'Comment — ignored by the compiler/interpreter.', tag: 'COMMENT', tagColor: 'tag-cyan' }
  }
  return { summary: line, tag: 'CODE', tagColor: 'tag-cyan' }
}

// ─── Go ───────────────────────────────────────────────────────────────────────

export function explainGo(line: string): LineExplanation {
  const trimmed = line.trim()

  // package
  if (trimmed.match(/^package\s+\w+/)) {
    const name = trimmed.match(/^package\s+(\w+)/)?.[1]
    return {
      summary: `Package declaration: \`${name}\`.`,
      concept: 'Every Go file must belong to a package. The `main` package is special — it defines an executable program. Its `main()` function is the entry point.',
      tag: 'PACKAGE',
      tagColor: 'tag-cyan',
    }
  }

  // import
  if (trimmed.match(/^import\s+/)) {
    return {
      summary: `Imports packages into this file.`,
      concept: 'Go imports are resolved at compile time. Unused imports are a compile error. Group imports with parentheses: `import ( "fmt"; "os" )`.',
      tag: 'IMPORT',
      tagColor: 'tag-orange',
    }
  }

  // func with receiver (method)
  const methodMatch = trimmed.match(/^func\s+\((\w+)\s+(\*?\w+)\)\s+(\w+)\s*\(([^)]*)\)(.*)/)
  if (methodMatch) {
    const [, recvName, recvType, name, params, ret] = methodMatch
    const isPointer = recvType.startsWith('*')
    return {
      summary: `Method \`${name}(${params})\` on receiver \`${recvName} ${recvType}\`${ret.trim() ? ` returning ${ret.trim()}` : ''}.`,
      concept: isPointer
        ? 'Pointer receiver `*T` — the method can mutate the struct\'s fields. Use pointer receivers when the method needs to modify state or the struct is large.'
        : 'Value receiver `T` — the method receives a copy. Changes do not affect the original. Use for small, read-only structs.',
      tag: 'METHOD',
      tagColor: 'tag-purple',
    }
  }

  // func declaration
  const fnMatch = trimmed.match(/^func\s+(\w+)\s*\(([^)]*)\)\s*(.*)/)
  if (fnMatch) {
    const [, name, params, ret] = fnMatch
    const isAsync = ret.includes('chan') || ret.includes('error')
    return {
      summary: `Declares function \`${name}(${params})\`${ret.trim() ? ` → \`${ret.replace('{', '').trim()}\`` : ''}.`,
      concept: isAsync
        ? 'Returns include an `error` — idiomatic Go error handling. Always check returned errors: `if err != nil { ... }`.'
        : 'Go functions are first-class values. Multiple return values are common — no exceptions, errors are returned explicitly.',
      tag: 'FUNC',
      tagColor: 'tag-purple',
    }
  }

  // struct declaration
  const structMatch = trimmed.match(/^type\s+(\w+)\s+struct/)
  if (structMatch) {
    return {
      summary: `Declares struct \`${structMatch[1]}\`.`,
      concept: 'Structs are Go\'s primary way to group data. They are value types — assigning a struct copies all its fields. Use a pointer (`*T`) to share and mutate.',
      tag: 'STRUCT',
      tagColor: 'tag-purple',
    }
  }

  // interface declaration
  const ifaceMatch = trimmed.match(/^type\s+(\w+)\s+interface/)
  if (ifaceMatch) {
    return {
      summary: `Declares interface \`${ifaceMatch[1]}\`.`,
      concept: 'Go interfaces are satisfied implicitly — no `implements` keyword. Any type with the required methods satisfies the interface. This enables duck typing with compile-time safety.',
      tag: 'INTERFACE',
      tagColor: 'tag-cyan',
    }
  }

  // type alias
  const typeMatch = trimmed.match(/^type\s+(\w+)\s+(\w+)/)
  if (typeMatch) {
    return {
      summary: `Declares type \`${typeMatch[1]}\` as \`${typeMatch[2]}\`.`,
      concept: 'Named types in Go are distinct from their underlying type — you cannot mix them without an explicit conversion. This adds type safety around primitives.',
      tag: 'TYPE',
      tagColor: 'tag-cyan',
    }
  }

  // short variable declaration :=
  const shortVarMatch = trimmed.match(/^(\w+(?:,\s*\w+)*)\s*:=\s*(.+)/)
  if (shortVarMatch) {
    const [, names, val] = shortVarMatch
    return {
      summary: `Short variable declaration: \`${names} := ${val}\`.`,
      concept: '`:=` infers the type and declares + assigns in one step. It can only be used inside functions. At least one variable on the left must be new.',
      tag: ':=',
      tagColor: 'tag-green',
    }
  }

  // var declaration
  const varMatch = trimmed.match(/^var\s+(\w+)\s+(\w+)/)
  if (varMatch) {
    const [, name, typ] = varMatch
    return {
      summary: `Declares variable \`${name}\` of type \`${typ}\`.`,
      concept: '`var` declarations are zero-initialized: numbers → 0, strings → "", booleans → false, pointers/slices/maps → nil.',
      tag: 'VAR',
      tagColor: 'tag-cyan',
    }
  }

  // const
  if (trimmed.match(/^const\s+/)) {
    const name = trimmed.match(/^const\s+(\w+)/)?.[1]
    return {
      summary: `Declares constant \`${name}\`.`,
      concept: 'Constants in Go are compile-time values. Untyped constants have arbitrary precision and are given a type when used in context. `iota` creates auto-incrementing enum-like constants.',
      tag: 'CONST',
      tagColor: 'tag-cyan',
    }
  }

  // goroutine
  if (trimmed.match(/^go\s+\w+/)) {
    return {
      summary: `Launches a goroutine: \`${trimmed}\`.`,
      concept: 'Goroutines are lightweight threads managed by the Go runtime (not the OS). They are cheap to create — a Go program can run millions simultaneously. Communicate via channels, not shared memory.',
      tag: 'GOROUTINE',
      tagColor: 'tag-orange',
    }
  }

  // channel send/receive
  if (trimmed.includes('<-')) {
    const isSend = trimmed.match(/\w+\s*<-\s*\w+/)
    return {
      summary: isSend ? `Channel send: \`${trimmed}\`.` : `Channel receive: \`${trimmed}\`.`,
      concept: isSend
        ? 'Sends a value into a channel. Blocks until a receiver is ready (for unbuffered channels).'
        : 'Receives a value from a channel. Blocks until a sender is ready.',
      tag: 'CHANNEL',
      tagColor: 'tag-orange',
    }
  }

  // defer
  if (trimmed.match(/^defer\s+/)) {
    return {
      summary: `Defers \`${trimmed.replace(/^defer\s+/, '')}\` until the surrounding function returns.`,
      concept: '`defer` pushes a function call onto a stack that executes LIFO when the enclosing function exits — even on panic. Commonly used for cleanup: `defer file.Close()`.',
      tag: 'DEFER',
      tagColor: 'tag-yellow',
    }
  }

  // return
  if (trimmed.match(/^return\b/)) {
    const val = trimmed.replace(/^return\s*/, '')
    return {
      summary: `Returns \`${val || 'nothing'}\` from this function.`,
      concept: 'Go supports multiple return values. Named return values can use a bare `return` — but avoid in long functions for clarity.',
      tag: 'RETURN',
      tagColor: 'tag-pink',
    }
  }

  // for range
  if (trimmed.match(/^for\s+.+:=\s+range\s+/)) {
    const m = trimmed.match(/^for\s+(.+):=\s+range\s+(\w+)/)
    return {
      summary: `Range-based loop over \`${m?.[2]}\`, yielding \`${m?.[1].trim()}\`.`,
      concept: 'Go `range` works on arrays, slices, strings (UTF-8 runes), maps, and channels. Use `_` to discard the index or value: `for _, v := range slice`.',
      tag: 'RANGE',
      tagColor: 'tag-yellow',
    }
  }

  // for loop
  if (trimmed.match(/^for\s+/)) {
    return {
      summary: `\`for\` loop — Go\'s only loop construct.`,
      concept: 'Go has no `while` — use `for condition { }` instead. An infinite loop is `for { }`. The init/post statements in a 3-clause for are optional.',
      tag: 'FOR',
      tagColor: 'tag-yellow',
    }
  }

  // if
  if (trimmed.match(/^if\s+/)) {
    const m = trimmed.match(/^if\s+(.+?)\s*\{/)
    return {
      summary: `Conditional: \`if ${m?.[1] ?? ''}\`.`,
      concept: 'Go `if` can include an init statement: `if err := doSomething(); err != nil { }`. Variables declared in the init are scoped to the if/else blocks.',
      tag: 'IF',
      tagColor: 'tag-yellow',
    }
  }

  // fmt.Println / fmt.Printf
  if (trimmed.match(/^fmt\.(Print|Println|Printf|Sprintf)\(/)) {
    const fn = trimmed.match(/^fmt\.(\w+)/)?.[1]
    return {
      summary: `Formatted output via \`fmt.${fn}\`.`,
      concept: '`fmt.Println` adds spaces between args and a newline. `fmt.Printf` uses format verbs: `%v` (default), `%T` (type), `%d` (int), `%s` (string), `%+v` (struct with field names).',
      tag: 'FMT',
      tagColor: 'tag-green',
    }
  }

  // make
  if (trimmed.match(/\bmake\s*\(/)) {
    return {
      summary: `\`make()\` allocates and initializes a built-in type.`,
      concept: '`make` is used for slices, maps, and channels only — it returns an initialized (not zeroed) value of the given type. For other types use `new()` or a composite literal.',
      tag: 'MAKE',
      tagColor: 'tag-orange',
    }
  }

  return { summary: trimmed, tag: 'STMT', tagColor: 'tag-cyan' }
}
