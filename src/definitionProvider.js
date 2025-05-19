const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;

// Список ключевых слов, которые не должны распознаваться как макросы
const reservedKeywords = ['if', 'for', 'while', 'switch', 'do', 'else'];

async function findMacroInFile(filePath, macroName, visitedFiles = new Set()) {
    if (visitedFiles.has(filePath)) {
        return null; // Избегаем циклических включений
    }
    visitedFiles.add(filePath);

    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        // Учитываем макросы с параметрами: macro имя (параметры?) {
        const macroRegex = new RegExp(`macro\\s+${macroName}\\s*\\([^)]*\\)\\s*{`, 'm');

        // Проверяем текущий файл
        if (macroRegex.test(fileContent)) {
            const match = fileContent.match(macroRegex);
            const line = fileContent.substr(0, match.index).split('\n').length - 1;
            return { filePath, line };
        }

        // Ищем все include-директивы
        // Обновлённое регулярное выражение для обработки экранированных символов
        const includeRegex = /include\s+"((?:[^"\\]|\\.)+)"/g;
        const includes = [];
        let match;
        while ((match = includeRegex.exec(fileContent)) !== null) {
            // Удаляем экранирование из пути
            const includePath = match[1].replace(/\\(.)/g, '$1');
            includes.push(includePath);
        }

        // Проверяем каждый include рекурсивно
        for (const includePath of includes) {
            const absolutePath = path.resolve(path.dirname(filePath), includePath);
            const result = await findMacroInFile(absolutePath, macroName, visitedFiles);
            if (result) {
                return result;
            }
        }
    } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
    }

    return null;
}

class TestoDefinitionProvider {
    async provideDefinition(document, position, token) {
        const line = document.lineAt(position.line).text.trim();
        // Обновлённое регулярное выражение для обработки экранированных символов
        const includeRegex = /include\s+"((?:[^"\\]|\\.)+)"/;
        const includeMatch = line.match(includeRegex);

        // Проверяем, является ли строка include
        if (includeMatch) {
            // Удаляем экранирование из пути
            const includePath = includeMatch[1].replace(/\\(.)/g, '$1');
            const absolutePath = path.resolve(path.dirname(document.uri.fsPath), includePath);
            try {
                await fs.access(absolutePath);
                return new vscode.Location(
                    vscode.Uri.file(absolutePath),
                    new vscode.Position(0, 0)
                );
            } catch (err) {
                console.error(`Error accessing file ${absolutePath}:`, err);
                return null;
            }
        }

        // Проверяем, начинается ли строка с macro
        if (line.startsWith('macro')) {
            return null; // Не ищем определение, если это определение макроса
        }

        // Проверяем, находится ли курсор на имени макроса
        const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z_][a-zA-Z0-9_]*(?:\s*\()/);
        if (!wordRange) {
            return null;
        }

        const selectedText = document.getText(wordRange);
        const macroName = selectedText.replace(/\s*\($/, '');
        if (!macroName || reservedKeywords.includes(macroName)) {
            return null; // Игнорируем ключевые слова
        }

        // Ищем макрос
        const result = await findMacroInFile(document.uri.fsPath, macroName, new Set());
        if (result) {
            return new vscode.Location(
                vscode.Uri.file(result.filePath),
                new vscode.Position(result.line, 0)
            );
        }

        return null;
    }
}

function registerDefinitionProvider(context) {
    // Регистрируем провайдер определений для Ctrl+Click и F12
    let disposableDefinitionProvider = vscode.languages.registerDefinitionProvider(
        { scheme: 'file', pattern: '**/*.testo' },
        new TestoDefinitionProvider()
    );

    context.subscriptions.push(disposableDefinitionProvider);
}

module.exports = {
    registerDefinitionProvider
};