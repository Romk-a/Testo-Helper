const vscode = require('vscode');

function formatTestoDocument(document) {
    const lines = document.getText().split('\n');
    let formattedLines = [];
    let indentLevel = 0; // Уровень вложенности
    const indentSize = 4; // 4 пробела на уровень
    let emptyLineCount = 0; // Счётчик последовательных пустых строк
    let isExecBlock = false; // Флаг для многострочного блока exec
    let execIndentLevel = 0; // Уровень вложенности для exec
    let isTypeBlock = false; // Флаг для блока type

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i]; // Сохраняем исходную строку с пробелами
        let trimmedLine = line.trim();
        let indent = ' '.repeat(indentLevel * indentSize);

        // Игнорируем комментарии
        if (trimmedLine.startsWith('#')) {
            formattedLines.push(indent + trimmedLine);
            emptyLineCount = 0;
            continue;
        }

        // Обработка блока type
        if (isTypeBlock) {
            // Если строка содержит """, это конец блока
            if (trimmedLine.includes('"""')) {
                formattedLines.push(line); // Копируем строку без изменений
                isTypeBlock = false;
                emptyLineCount = 0;
            } else {
                // Копируем промежуточные строки без изменений
                formattedLines.push(line);
                emptyLineCount = 0; // Пустые строки внутри type не ограничиваем
            }
            continue;
        }

        // Проверяем, начинается ли строка с type и """
        const typeMatch = trimmedLine.match(/^type\s*"""/);
        if (typeMatch) {
            const prefix = typeMatch[0]; // "type """
            const content = trimmedLine.slice(prefix.length);

            // Если строка заканчивается на """, это однострочник
            if (content.includes('"""')) {
                const formattedLine = `${prefix}${content}`; // Без лишнего пробела
                formattedLines.push(indent + formattedLine); // С текущим отступом
                emptyLineCount = 0;
            } else {
                // Начало многострочного блока
                const formattedLine = `${prefix}${content}`; // Без лишнего пробела
                formattedLines.push(indent + formattedLine); // С текущим отступом
                isTypeBlock = true;
                emptyLineCount = 0;
            }
            continue;
        }

        // Обработка многострочного блока exec
        if (isExecBlock) {
            // Если строка заканчивается на """, это конец блока
            if (trimmedLine.endsWith('"""')) {
                const content = trimmedLine.slice(0, -3).trim();
                if (content) {
                    formattedLines.push(' '.repeat((execIndentLevel + 1) * indentSize) + content);
                }
                formattedLines.push(' '.repeat(execIndentLevel * indentSize) + '"""');
                isExecBlock = false;
                emptyLineCount = 0;
            } else {
                // Добавляем строку с дополнительным отступом
                if (trimmedLine) {
                    formattedLines.push(' '.repeat((execIndentLevel + 1) * indentSize) + trimmedLine);
                    emptyLineCount = 0;
                } else if (emptyLineCount < 1 && formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
                    formattedLines.push('');
                    emptyLineCount++;
                }
            }
            continue;
        }

        // Проверяем, начинается ли строка с exec и """
        const execMatch = trimmedLine.match(/^exec\s+\w+\s*"""/);
        if (execMatch) {
            const prefix = execMatch[0]; // Например, "exec bash """
            const content = trimmedLine.slice(prefix.length).trim();

            // Если строка заканчивается на """, это однострочник
            if (content.endsWith('"""')) {
                const innerContent = content.slice(0, -3).trim();
                const formattedLine = `${prefix}${innerContent ? ' ' + innerContent : ''}"""`;
                formattedLines.push(indent + formattedLine);
                emptyLineCount = 0;
            } else {
                // Начало многострочного блока
                formattedLines.push(indent + prefix);
                if (content) {
                    formattedLines.push(' '.repeat((indentLevel + 1) * indentSize) + content);
                    emptyLineCount = 0;
                }
                isExecBlock = true;
                execIndentLevel = indentLevel;
            }
            continue;
        }

        // Проверяем, начинается ли строка с закрывающей скобки (не комментарий)
        if (trimmedLine.startsWith('}') && !trimmedLine.startsWith('#')) {
            indentLevel = Math.max(0, indentLevel - 1); // Уменьшаем отступ перед этой строкой
            indent = ' '.repeat(indentLevel * indentSize);
        }

        // Обрабатываем строку
        if (trimmedLine.length === 0) {
            emptyLineCount++;
            // Добавляем не более одной пустой строки
            if (emptyLineCount <= 1 && formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
                formattedLines.push('');
            }
        } else {
            emptyLineCount = 0; // Сбрасываем счётчик пустых строк
            // Удаляем ; в конце строки, если это не комментарий
            if (!trimmedLine.startsWith('#') && trimmedLine.endsWith(';')) {
                trimmedLine = trimmedLine.slice(0, -1).trimEnd();
            }
            formattedLines.push(indent + trimmedLine);
        }

        // Проверяем, заканчивается ли строка открывающей скобкой (не комментарий)
        if (trimmedLine.endsWith('{') && !trimmedLine.startsWith('#')) {
            indentLevel++;
        }
    }

    // Удаляем пустые строки в конце, если они есть
    while (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] === '') {
        formattedLines.pop();
    }

    return formattedLines.join('\n');
}

function registerFormatCommand(context) {
    let disposableFormat = vscode.commands.registerCommand('jiraOpener.formatDocument', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor.');
            return;
        }

        const document = editor.document;
        if (!document.uri.fsPath.endsWith('.testo')) {
            vscode.window.showErrorMessage('This command is only available for .testo files.');
            return;
        }

        try {
            const formattedText = formatTestoDocument(document);
            const fullRange = new vscode.Range(
                0, 0,
                document.lineCount, 0
            );

            // Применяем отформатированный текст
            await editor.edit(editBuilder => {
                editBuilder.replace(fullRange, formattedText);
            });
        } catch (err) {
            vscode.window.showErrorMessage('Error formatting document: ' + err.message);
            console.error('FormatDocument: Exception:', err);
        }
    });

    context.subscriptions.push(disposableFormat);
}

module.exports = {
    registerFormatCommand
};