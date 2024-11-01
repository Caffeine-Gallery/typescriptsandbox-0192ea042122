import { backend } from 'declarations/backend';
import { AuthClient } from "@dfinity/auth-client";

let editor;
let currentFile = 'main.ts';
const files = {
    'main.ts': `function greet(name: string) {
    console.log(\`Hello, \${name}!\`);
    return \`Welcome to ICP TypeScript PlayGround, \${name}!\`;
}

const result = greet("User");
console.log(result);`
};

let authClient;
let userId;

async function initAuth() {
    authClient = await AuthClient.create();
    if (await authClient.isAuthenticated()) {
        handleAuthenticated();
    }
}

async function handleAuthenticated() {
    userId = await authClient.getIdentity().getPrincipal().toText();
    document.getElementById('loginButton').style.display = 'none';
    document.getElementById('logoutButton').style.display = 'block';
    startCollaboration();
}

function login() {
    authClient.login({
        identityProvider: "https://identity.ic0.app/#authorize",
        onSuccess: handleAuthenticated
    });
}

function logout() {
    authClient.logout();
    document.getElementById('loginButton').style.display = 'block';
    document.getElementById('logoutButton').style.display = 'none';
}

require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.30.1/min/vs' } });

require(['vs/editor/editor.main'], function () {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2015,
        allowNonTsExtensions: true
    });

    editor = monaco.editor.create(document.getElementById('editor'), {
        value: files[currentFile],
        language: 'typescript',
        theme: 'vs-dark',
        minimap: { enabled: false },
        automaticLayout: true
    });

    editor.onDidChangeCursorPosition(e => {
        if (userId) {
            backend.updateUserPosition(userId, currentFile, e.position.lineNumber, e.position.column);
        }
    });

    // Load code from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const sharedCode = urlParams.get('code');
    if (sharedCode) {
        files[currentFile] = atob(sharedCode);
        editor.setValue(files[currentFile]);
    }

    document.getElementById('runButton').addEventListener('click', runCode);
    document.getElementById('shareButton').addEventListener('click', shareCode);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('addFileButton').addEventListener('click', addFile);
    document.getElementById('loginButton').addEventListener('click', login);
    document.getElementById('logoutButton').addEventListener('click', logout);

    window.addEventListener('resize', () => {
        editor.layout();
    });

    updateFileList();
    initAuth();
});

function updateFileList() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    Object.keys(files).forEach(filename => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="material-icons">description</i> ${filename}`;
        li.addEventListener('click', () => switchFile(filename));
        if (filename === currentFile) {
            li.classList.add('active');
        }
        fileList.appendChild(li);
    });
}

function switchFile(filename) {
    files[currentFile] = editor.getValue();
    currentFile = filename;
    editor.setValue(files[currentFile]);
    updateFileList();
}

function addFile() {
    const filename = prompt('Enter file name (e.g., newfile.ts):');
    if (filename && !files[filename]) {
        files[filename] = '';
        switchFile(filename);
    }
}

async function runCode() {
    const code = editor.getValue();
    const resultElement = document.getElementById('result');
    const consoleElement = document.getElementById('console-output');

    resultElement.textContent = '';
    consoleElement.textContent = '';

    try {
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
        await backend.saveCode(currentFile, code);
        const encodedCode = btoa(code);
        const shareUrl = `${window.location.origin}${window.location.pathname}?code=${encodedCode}`;
        alert(`Share this URL: ${shareUrl}`);
    } catch (error) {
        console.error('Error sharing code:', error);
        alert('Failed to share code. Please try again.');
    }
}

function toggleTheme() {
    const currentTheme = editor.getOption(monaco.editor.EditorOption.theme);
    const newTheme = currentTheme === 'vs-dark' ? 'vs-light' : 'vs-dark';
    editor.updateOptions({ theme: newTheme });
    document.body.classList.toggle('light-theme');
}

async function startCollaboration() {
    setInterval(async () => {
        const positions = await backend.getUserPositions();
        updateCollaborators(positions);
    }, 1000);
}

function updateCollaborators(positions) {
    const collaboratorsElement = document.getElementById('collaborators');
    collaboratorsElement.innerHTML = '';
    positions.forEach(([id, position]) => {
        if (id !== userId && position.fileId === currentFile) {
            const marker = document.createElement('div');
            marker.className = 'collaborator-cursor';
            marker.style.backgroundColor = getColorForUser(id);
            marker.style.left = `${position.position.column * 8}px`;
            marker.style.top = `${position.position.line * 18}px`;
            collaboratorsElement.appendChild(marker);
        }
    });
}

function getColorForUser(userId) {
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
    return colors[userId.charCodeAt(0) % colors.length];
}
