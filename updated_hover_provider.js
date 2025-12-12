// This is the updated content for the TestoHoverProvider class
        // Получаем слово под курсором
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) return null;

        const word = document.getText(wordRange).trim();

        // Проверяем, является ли слово специальным ключевым словом Testo
        if (keywordDocumentation[word]) {
            const doc = keywordDocumentation[word];
            const markdownString = new vscode.MarkdownString();
            markdownString.appendMarkdown(`**${doc.title}**  \n`);
            markdownString.appendMarkdown(`${doc.description}  \n\n`);
            markdownString.appendMarkdown("***Использование:***  \n");
            markdownString.appendCodeblock(doc.usage, 'testo');
            if (doc.example) {
                markdownString.appendMarkdown("\n***Пример:***  \n");
                markdownString.appendCodeblock(doc.example, 'testo');
            }
            
            return new vscode.Hover(markdownString);
        }

        // Регулярное выражение для img "${}" или find_img("${}")
        const imageWordRange = document.getWordRangeAtPosition(position, /(?:img\s*"\${[^}]*}"|find_img\("${[^}]*}"\))/);
        if (!imageWordRange) return null;

        const selectedText = document.getText(imageWordRange);
        // Проверяем строки с img "${}" или find_img("${}")
        const imageMatch = selectedText.match(/(?:img\s*"\${([^}]*)}"|find_img\("${([^}]*)}"\))/);

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