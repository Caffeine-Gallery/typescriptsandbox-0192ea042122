import { backend } from 'declarations/backend';

let editor;
const defaultCode = `function greet(name: string) {
    console.log(\`Hello, \${name}!\`);
    return \`Welcome to TypeScript Playground v0, \${name}!\`;
}

const result = greet("User");
console.log(result);`;

require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.30.1/min/vs' } });

require(['vs/editor/editor.main'], function () {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2015,
        allowNonTsExtensions: true
    });

    editor = monaco.editor.create(document.getElementById('editor'), {
        value: defaultCode,
        language: 'typescript',
        theme: 'vs-dark',
        minimap: { enabled: false },
        automaticLayout: true
    });

    // Load code from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const sharedCode = urlParams.get('code');
    if (sharedCode) {
        editor.setValue(atob(sharedCode));
    }

    document.getElementById('runButton').addEventListener('click', runCode);
    document.getElementById('shareButton').addEventListener('click', shareCode);
});

async function runCode() {
    const code = editor.getValue();
    const resultElement = document.getElementById('result');
    const consoleElement = document.getElementById('console-output');

    resultElement.textContent = '';
    consoleElement.textContent = '';

    try {
        // Compile TypeScript
        const worker = await monaco.languages.typescript.getTypeScriptWorker();
        const uri = editor.getModel().uri;
        const client = await worker(uri);
        const result = await client.getEmitOutput(uri.toString());

        if (result.outputFiles[0]) {
            const transpiledCode = result.outputFiles[0].text;
            const originalConsoleLog = console.log;
            const logs = [];

            console.log = function (...args) {
                logs.push(args.map(arg => JSON.stringify(arg)).join(' '));
                originalConsoleLog.apply(console, args);
            };

            try {
                const executionResult = new Function(transpiledCode)();
                console.log = originalConsoleLog;
                consoleElement.textContent = logs.join('\n');
                resultElement.textContent = executionResult !== undefined ? executionResult.toString() : 'Executed successfully';
            } catch (error) {
                console.log = originalConsoleLog;
                consoleElement.textContent = `Runtime Error: ${error.message}`;
            }
        } else {
            consoleElement.textContent = 'Compilation failed';
        }
    } catch (error) {
        consoleElement.textContent = `Error: ${error.message}`;
    }
}

async function shareCode() {
    const code = editor.getValue();
    try {
        const id = await backend.saveCode(code);
        const encodedCode = btoa(code);
        const shareUrl = `${window.location.origin}${window.location.pathname}?code=${encodedCode}`;
        alert(`Share this URL: ${shareUrl}\nOr use this ID: ${id}`);
    } catch (error) {
        console.error('Error sharing code:', error);
        alert('Failed to share code. Please try again.');
    }
}
