# JS Execution Playground

A developer tool for visually understanding how JavaScript executes — step by step.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Features

### AST Parsing
Click **Analyze AST** to parse your JavaScript using **@babel/parser**. The AST is traversed to extract variable declarations, function declarations, calls, loops, conditionals, and expressions. Click any line in the editor to see a human-readable explanation derived from the AST node type.

### Step-by-Step Execution Simulator
Click **Run Step By Step** to generate an execution trace. The simulator walks the AST symbolically, tracking:
- Variable declarations and assignments
- Function calls (push stack frame) and returns (pop stack frame)
- Conditional branches
- Loop iterations (capped at 50 to prevent infinite loops)
- console.log output
- async patterns (setTimeout, Promise.resolve)

Use the **Prev / Next** buttons or the timeline slider to travel through execution steps.

### Call Stack Visualization (D3.js)
Rendered with D3 as animated stack frames. When a function is called, its frame is pushed; when it returns, the frame is popped.

### Variable Watch
Shows all variables currently in scope with their types and values, grouped by scope level.

### Scope Chain
Displays the lexical scope chain from Global down to the innermost function scope, with variables at each level.

### Event Loop Visualization
Illustrates the four components of the JavaScript runtime:
- **Call Stack** — synchronous execution (LIFO)
- **Web APIs** — host-provided async operations (setTimeout, fetch, etc.)
- **Microtask Queue** — Promise callbacks (run before macrotasks)
- **Callback Queue** — macrotask callbacks (setTimeout, setInterval)

### Heap Memory
Objects and arrays allocated during execution appear as nodes in the Heap Memory panel, helping visualize pass-by-reference vs pass-by-value.

### Console Output
Captures `console.log()` calls during the simulated execution and displays them in order.

---

## Tech Stack

| Concern | Library |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Code Editor | Monaco Editor |
| AST Parsing | @babel/parser |
| Visualization | D3.js v7 |
| State | Zustand |
| Styling | Tailwind CSS |

---

## Architecture

```
src/
  components/
    CodeEditor.tsx        # Monaco editor with line click + decorations
    LineExplainer.tsx     # AST node → human-readable explanation
    CallStackViz.tsx      # D3-rendered call stack frames
    VariableWatch.tsx     # Live variable values
    ExecutionControls.tsx # Step forward/back, timeline slider
    EventLoopViz.tsx      # Call Stack / Web APIs / Queues display
    ScopeChainViz.tsx     # Lexical scope chain display
    HeapMemoryViz.tsx     # Heap object nodes
    ConsoleOutput.tsx     # console.log capture

  store/
    usePlaygroundStore.ts # Zustand global state

  utils/
    astParser.ts          # Babel parse + explainNode + findNodeAtLine
    executionSimulator.ts # Symbolic AST interpreter → ExecutionStep[]
```

## Limitations
- The execution simulator is a **symbolic interpreter**, not a real JS engine. It supports common patterns but not every JS feature.
- Loop iterations are capped at 50 to prevent infinite loops.
- Async execution (setTimeout, Promises) shows the event loop model but does not actually run async code.
