import type { LanguageConfig } from '../types'

export const LANGUAGES: LanguageConfig[] = [
  {
    id: 'javascript',
    label: 'JavaScript',
    monacoLang: 'javascript',
    color: '#ffd60a',
    defaultCode: `// Welcome to JS Execution Playground
// Click "Analyze Code" to parse, then "Run Step By Step" to simulate

function greet(name) {
  const message = "Hello, " + name + "!";
  console.log(message);
  return message;
}

function add(a, b) {
  return a + b;
}

const x = 10;
const y = 20;
const result = add(x, y);
console.log("Result:", result);

greet("World");
`,
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    monacoLang: 'typescript',
    color: '#3b82f6',
    defaultCode: `// TypeScript Example

interface User {
  name: string;
  age: number;
}

function greet(user: User): string {
  const message = \`Hello, \${user.name}! You are \${user.age} years old.\`;
  console.log(message);
  return message;
}

function add(a: number, b: number): number {
  return a + b;
}

const user: User = { name: "Alice", age: 30 };
const result: number = add(10, 20);

console.log("Result:", result);
greet(user);
`,
  },
  {
    id: 'python',
    label: 'Python',
    monacoLang: 'python',
    color: '#00e5ff',
    defaultCode: `# Python Example

def greet(name: str) -> str:
    message = f"Hello, {name}!"
    print(message)
    return message

def add(a: int, b: int) -> int:
    return a + b

class Counter:
    def __init__(self):
        self.count = 0

    def increment(self):
        self.count += 1
        return self.count

x = 10
y = 20
result = add(x, y)
print("Result:", result)

greet("World")

counter = Counter()
counter.increment()
counter.increment()
print("Count:", counter.count)
`,
  },
  {
    id: 'java',
    label: 'Java',
    monacoLang: 'java',
    color: '#ff6b35',
    defaultCode: `// Java Example

public class Main {

    public static String greet(String name) {
        String message = "Hello, " + name + "!";
        System.out.println(message);
        return message;
    }

    public static int add(int a, int b) {
        return a + b;
    }

    public static void main(String[] args) {
        int x = 10;
        int y = 20;
        int result = add(x, y);
        System.out.println("Result: " + result);

        greet("World");

        for (int i = 0; i < 3; i++) {
            System.out.println("Loop iteration: " + i);
        }
    }
}
`,
  },
  {
    id: 'cpp',
    label: 'C++',
    monacoLang: 'cpp',
    color: '#a855f7',
    defaultCode: `// C++ Example
#include <iostream>
#include <string>

std::string greet(const std::string& name) {
    std::string message = "Hello, " + name + "!";
    std::cout << message << std::endl;
    return message;
}

int add(int a, int b) {
    return a + b;
}

int main() {
    int x = 10;
    int y = 20;
    int result = add(x, y);
    std::cout << "Result: " << result << std::endl;

    greet("World");

    for (int i = 0; i < 3; i++) {
        std::cout << "Loop: " << i << std::endl;
    }

    return 0;
}
`,
  },
  {
    id: 'go',
    label: 'Go',
    monacoLang: 'go',
    color: '#00add8',
    defaultCode: `// Go Example
package main

import "fmt"

func greet(name string) string {
	message := "Hello, " + name + "!"
	fmt.Println(message)
	return message
}

func add(a int, b int) int {
	return a + b
}

type Counter struct {
	count int
}

func (c *Counter) Increment() int {
	c.count++
	return c.count
}

func main() {
	x := 10
	y := 20
	result := add(x, y)
	fmt.Println("Result:", result)

	greet("World")

	for i := 0; i < 3; i++ {
		fmt.Println("Loop:", i)
	}

	c := Counter{}
	c.Increment()
	c.Increment()
	fmt.Println("Count:", c.count)
}
`,
  },
]

export const LANGUAGE_MAP = Object.fromEntries(
  LANGUAGES.map((l) => [l.id, l])
) as Record<string, LanguageConfig>
