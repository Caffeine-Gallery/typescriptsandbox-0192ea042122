import { backend } from 'declarations/backend';

let editor;
const defaultCode = `function greet(name: string) {
    console.log(\`Hello, \${name}!\`);
    return \`Welcome to TypeScript Playground, \${name}!\`;
}

const result = greet("User");
console.log(result);`;

require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.30.1/min/vs' } });

require(['vs/editor/editor.main'], function () {
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: defaultCode,
        language: 'typescript',
        theme: 'vs-dark'
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
    const consoleElement = document.getElementById('console');

    resultElement.textContent = '';
    consoleElement.textContent = '';

    try {
        // Compile TypeScript
        const result = await transpileAndExecute(code);
        resultElement.textContent = result;
    } catch (error) {
        consoleElement.textContent = `Error: ${error.message}`;
    }
}

async function transpileAndExecute(code) {
    return new Promise((resolve, reject) => {
        require(['vs/language/typescript/tsWorker'], function (tsWorker) {
            const worker = tsWorker.create(function () {
                return monaco.languages.typescript.getTypeScriptWorker();
            });

            worker().then(function (client) {
                client.getEmitOutput(editor.getModel().uri.toString()).then(function (result) {
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
                            document.getElementById('console').textContent = logs.join('\n');
                            resolve(executionResult !== undefined ? executionResult.toString() : 'Executed successfully');
                        } catch (error) {
                            console.log = originalConsoleLog;
                            reject(error);
                        }
                    } else {
                        reject(new Error('Compilation failed'));
                    }
                });
            });
        });
    });
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
