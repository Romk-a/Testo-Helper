const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const builtinDocs = require('./builtinDocs');

// Список ключевых слов, которые не должны распознаваться как макросы
const reservedKeywords = ['if', 'for', 'while', 'switch', 'do', 'else'];

// Список расширений файлов, которые считаются бинарными (изображения)
const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'];

// Собирает блок комментариев-«шапки» прямо над строкой определения макроса.
// Идёт вверх, пока строки начинаются с #, пропуская пустые строки вплотную к macro.
function extractMacroComment(lines, defLineIndex) {
    const block = [];
    for (let i = defLineIndex - 1; i >= 0; i--) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('#')) {
            block.unshift(lines[i]);
        } else if (block.length === 0 && (trimmed === '' || /^param\b/.test(trimmed))) {
            continue; // пустые строки и объявления param между комментарием и macro игнорируем
        } else {
            break; // комментарий закончился
        }
    }
    return block.join('\n');
}

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
            const lines = fileContent.split('\n');
            const line = fileContent.substring(0, match.index).split('\n').length - 1;
            const comment = extractMacroComment(lines, line);
            return { filePath, line, comment };
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
            // Ищем как `param имя "путь"` так и `image имя "путь"`
            const declarationRegex = new RegExp(`(?:param|image)\\s+${escapedImageName}\\s+"([^"]+)"`, 'i');
            const match = fileContent.match(declarationRegex);
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

// Превращает блок комментария-маски в оформленный MarkdownString для hover.
// Маркеры вида [_Заголовок_] становятся жирными заголовками,
// тело секции [_Пример_] выводится код-блоком с подсветкой testo.
function renderMacroComment(comment, macroName) {
    const md = new vscode.MarkdownString();

    // Убираем ведущий # (и один пробел после) и хвостовые пробелы
    const cleaned = comment
        .split('\n')
        .map(l => l.replace(/^\s*#\s?/, '').replace(/\s+$/, ''));

    md.appendMarkdown(`**macro** \`${macroName}\`\n\n`);

    // В hover показываем только эти секции маски
    const allowedSections = [/условия/i, /параметры/i, /результат/i];
    let showSection = false;
    let inExample = false;
    let exampleLines = [];

    const flushExample = () => {
        // Срезаем пустые строки в начале и конце примера
        while (exampleLines.length && exampleLines[0].trim() === '') exampleLines.shift();
        while (exampleLines.length && exampleLines[exampleLines.length - 1].trim() === '') exampleLines.pop();
        if (exampleLines.length) {
            // Убираем общий отступ маски, сохраняя относительные отступы кода
            const indents = exampleLines
                .filter(l => l.trim() !== '')
                .map(l => l.match(/^\s*/)[0].length);
            const minIndent = indents.length ? Math.min(...indents) : 0;
            const dedented = exampleLines.map(l => l.slice(minIndent));
            md.appendCodeblock(dedented.join('\n'), 'testo');
        }
        exampleLines = [];
    };

    for (const line of cleaned) {
        const headerMatch = line.match(/^\[_(.+?)_\]$/);
        if (headerMatch) {
            flushExample();
            const title = headerMatch[1];
            // Показываем секцию только если она в белом списке
            showSection = allowedSections.some(re => re.test(title));
            inExample = showSection && /пример/i.test(title);
            if (showSection) {
                md.appendMarkdown(`\n**${title}**\n\n`);
            }
            continue;
        }

        if (!showSection) {
            continue;
        }
        if (inExample) {
            exampleLines.push(line);
        } else if (line.trim() !== '') {
            // Два пробела в конце — перенос строки в markdown
            md.appendMarkdown(`${line.trim()}  \n`);
        }
    }
    flushExample();

    return md;
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

        // Проверяем, наведён ли курсор на встроенную функцию
        const isDocsHoverEnabled = config.get('enableDocsHover', true);
        if (isDocsHoverEnabled) {
            const wordRange = document.getWordRangeAtPosition(position, /\b[a-zA-Z_]+\b/);
            if (wordRange) {
                const word = document.getText(wordRange);
                const doc = builtinDocs[word];
                if (doc) {
                    const md = new vscode.MarkdownString();
                    md.isTrusted = true; // Разрешаем command-ссылки
                    md.appendCodeblock(doc.syntax, 'testo');
                    md.appendMarkdown(`\n${doc.description}\n\n`);
                    // Добавляем ссылку на список клавиш для press
                    if (word === 'press') {
                        md.appendMarkdown('[Список всех клавиш](command:testoHelper.showKeysReference)\n\n');
                    }
                    if (doc.params && doc.params.length > 0) {
                        md.appendMarkdown('**Параметры:**\n');
                        doc.params.forEach(p => md.appendMarkdown(`- ${p}\n`));
                        md.appendMarkdown('\n');
                    }
                    md.appendMarkdown('**Пример:**\n');
                    md.appendCodeblock(doc.example, 'testo');
                    return new vscode.Hover(md);
                }
            }
        }

        // Проверяем, наведён ли курсор на вызов (или определение) макроса
        const macroRange = document.getWordRangeAtPosition(position, /[a-zA-Z_][a-zA-Z0-9_]*(?:\s*\()/);
        if (macroRange) {
            const macroName = document.getText(macroRange).replace(/\s*\($/, '');
            if (macroName && !reservedKeywords.includes(macroName) && !builtinDocs[macroName]) {
                const result = await findMacroInFile(document.uri.fsPath, macroName, new Set());
                if (result && result.comment) {
                    return new vscode.Hover(renderMacroComment(result.comment, macroName));
                }
            }
        }

        // Регулярное выражение для img "${}" или find_img("${}")
        const imgRange = document.getWordRangeAtPosition(position, /(?:img\s*"\${[^}]*}"|find_img\s*\("\${[^}]*}"\))/);
        if (!imgRange) return null;

        const selectedText = document.getText(imgRange);
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
                        // FixMe: Base64 в какой-то момент обрезается и превью перестаёт работать. Известно что 67КБ открывает, 77КБ уже нет.
                        // Проверяем размер файла
                        const stats = await fs.stat(imagePath);
                        const maxSizeInBytes = 70 * 1024; // 70 КБ

                        if (stats.size > maxSizeInBytes) {
                            return new vscode.Hover(
                                new vscode.MarkdownString(
                                    `Превью для img размером больше 70КБ не поддерживается. Используйте **Ctrl + Click**, чтобы посмотреть img.`
                                )
                            );
                        }

                        // Читаем и отображаем только если размер <= 70 КБ
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