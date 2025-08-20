// stepCounter.js
const vscode = require('vscode');

// Декоратор: задаём стили один раз
const stepDecorationType = vscode.window.createTextEditorDecorationType({
    after: {
        margin: '0 0 0 1em',
        fontStyle: 'italic',
        opacity: '0.7',
        color: '#888'
    }
});

async function updateStepDecorations(editor) {
    if (!editor || !editor.document.uri.fsPath.endsWith('.testo')) {
        return;
    }

    const document = editor.document;
    const decorations = [];
    let stepNumber = 1;

    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const rawText = line.text;
        const trimmedText = rawText.trim();

        if (trimmedText.startsWith('#')) {
            continue;
        }

        if (/^\s*step\b/.test(rawText)) {
            const range = new vscode.Range(
                i,
                rawText.length,
                i,
                rawText.length
            );

            // Передаём только текст — стили берутся из stepDecorationType
            decorations.push({
                range,
                renderOptions: {
                    after: {
                        contentText: `// Шаг ${stepNumber}`
                    }
                }
            });

            stepNumber++;
        }
    }

    editor.setDecorations(stepDecorationType, decorations);
}

async function registerStepCounter(context) {
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
        if (editor && editor.document.uri.fsPath.endsWith('.testo')) {
            await updateStepDecorations(editor);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.activeTextEditor;
        if (
            editor &&
            event.document === editor.document &&
            editor.document.uri.fsPath.endsWith('.testo')
        ) {
            updateStepDecorations(editor);
        }
    }, null, context.subscriptions);

    if (vscode.window.activeTextEditor) {
        await updateStepDecorations(vscode.window.activeTextEditor);
    }
}

module.exports = {
    registerStepCounter
};