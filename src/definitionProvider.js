const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Список ключевых слов, которые не должны распознаваться как макросы
const reservedKeywords = ['if', 'for', 'while', 'switch', 'do', 'else'];

// Список расширений файлов, которые считаются бинарными (изображения)
const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'];

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

async function findImagePathInFile(filePath, imageName, visitedFiles = new Set()) {
    if (visitedFiles.has(filePath)) {
        return null;
    }
    visitedFiles.add(filePath);

    try {
        const fileContent = await fs.readFile(filePath, 'utf8');

        if (path.basename(filePath) === 'images.testo') {
            const escapedImageName = imageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const paramRegex = new RegExp(`param\\s+${escapedImageName}\\s+"([^"]+)"`, 'i');
            const match = fileContent.match(paramRegex);
            if (match) {
                let imagePath = match[1];
                const who = os.userInfo().username;
                if (!who) {
                    vscode.window.showErrorMessage(`Could not determine username for image "${imageName}"`);
                    return null;
                }
                imagePath = imagePath.replace('${WHO}', who);
                return imagePath;
            }
        }

        const includeRegex = /include\s+"((?:[^"\\]|\\.)+)"/g;
        const includes = [];
        let match;
        while ((match = includeRegex.exec(fileContent)) !== null) {
            const includePath = match[1].replace(/\\(.)/g, '$1');
            includes.push(includePath);
        }

        for (const includePath of includes) {
            const absolutePath = path.resolve(path.dirname(filePath), includePath);
            const result = await findImagePathInFile(absolutePath, imageName, visitedFiles);
            if (result) {
                return result;
            }
        }
    } catch (err) {
        // Ошибки игнорируются, чтобы не прерывать выполнение
    }

    return null;
}

class TestoDefinitionProvider {
    async provideDefinition(document, position, token) {
        const line = document.lineAt(position.line).text;
        // Проверяем, является ли строка include
        const includeRegex = /include\s+"((?:[^"\\]|\\.)+)"/;
        const includeMatch = line.match(includeRegex);
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

        // Не обрабатываем строки с "macro"
        if (line.trim().startsWith('macro')) {
            return null;
        }

        // Проверка на img "${}" или find_img("${}")
        const wordRange = document.getWordRangeAtPosition(position, /(?:img\s*"\${[^}]*}"|find_img\s*\("\${[^}]*}"\))/);
        if (wordRange) {
            const selectedText = document.getText(wordRange);
            const imageMatch = selectedText.match(/(?:img\s*"\${([^}]+)}"|find_img\s*\("\${([^}]+)}"\))/);
            if (imageMatch) {
                const imageName = imageMatch[1] || imageMatch[2];
                const imagePath = await findImagePathInFile(document.uri.fsPath, imageName, new Set());
                if (imagePath) {
                    try {
                        await fs.access(imagePath);
                        return new vscode.Location(
                            vscode.Uri.file(imagePath),
                            new vscode.Position(0, 0)
                        );
                    } catch (err) {
                        vscode.window.showErrorMessage(`Cannot access file: ${imagePath}`);
                        return null;
                    }
                }
            }
        }

        // Обработка имени макроса
        const macroRange = document.getWordRangeAtPosition(position, /[a-zA-Z_][a-zA-Z0-9_]*(?:\s*\()/);
        if (macroRange) {
            const selectedText = document.getText(macroRange);
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
        }

        return null;
    }
}

class TestoHoverProvider {
    async provideHover(document, position, token) {
        // Проверяем, включена ли функция в настройках
        const config = vscode.workspace.getConfiguration('testoHelper');
        const isHoverEnabled = config.get('enableHover', true);
        if (!isHoverEnabled) {
            return null; // Если отключено, возвращаем null
        }

        // Регулярное выражение для img "${}" или find_img("${}")
        const wordRange = document.getWordRangeAtPosition(position, /(?:img\s*"\${[^}]*}"|find_img\s*\("\${[^}]*}"\))/);
        if (!wordRange) return null;

        const selectedText = document.getText(wordRange);
        // Проверяем строки с img "${}" или find_img("${}")
        const imageMatch = selectedText.match(/(?:img\s*"\${([^}]+)}"|find_img\s*\("\${([^}]+)}"\))/);

        if (imageMatch) {
            // Извлекаем имя изображения из первой или второй группы захвата
            const imageName = imageMatch[1] || imageMatch[2];
            const imagePath = await findImagePathInFile(document.uri.fsPath, imageName, new Set());

            if (imagePath) {
                const ext = path.extname(imagePath).toLowerCase();
                if (binaryExtensions.includes(ext)) {
                    try {
                        // Читаем содержимое изображения и кодируем в base64
                        const imageBuffer = await fs.readFile(imagePath);
                        const base64Image = imageBuffer.toString('base64');
                        const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg'; // Определяем MIME-тип
                        const dataUri = `data:${mimeType};base64,${base64Image}`;

                        return new vscode.Hover(
                            new vscode.MarkdownString([
                                `![Preview](${dataUri})`
                            ].join('\n\n'))
                        );
                    } catch (err) {
                        return new vscode.Hover(`❌ Ошибка загрузки изображения: ${imagePath}`);
                    }
                } else {
                    return new vscode.Hover(`📄 Файл: ${imageName}\n\nПуть: ${imagePath}`);
                }
            } else {
                return new vscode.Hover(`❓ Изображение "${imageName}" не найдено`);
            }
        }

        return null;
    }
}

function registerProviders(context) {
    // Регистрируем Definition Provider (провайдер определений для Ctrl+Click и F12)
    let disposableDefinitionProvider = vscode.languages.registerDefinitionProvider(
        { scheme: 'file', pattern: '**/*.testo' },
        new TestoDefinitionProvider()
    );

    // Регистрируем Hover Provider (для предварительного просмотра img)
    let disposableHoverProvider = vscode.languages.registerHoverProvider(
        { scheme: 'file', pattern: '**/*.testo' },
        new TestoHoverProvider()
    );

    context.subscriptions.push(disposableDefinitionProvider, disposableHoverProvider);
}

module.exports = {
    registerProviders
};