const vscode = require('vscode');
const builtinDocs = require('./builtinDocs');

class DocsPanelManager {
    static currentPanel = undefined;

    static createOrShow(extensionUri) {
        const column = vscode.ViewColumn.Beside;

        if (DocsPanelManager.currentPanel) {
            DocsPanelManager.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'testoDocsPanel',
            'Testo: Справка',
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        DocsPanelManager.currentPanel = new DocsPanelManager(panel);
    }

    constructor(panel) {
        this.panel = panel;
        this.panel.webview.html = this.getWebviewContent();

        this.panel.onDidDispose(() => {
            DocsPanelManager.currentPanel = undefined;
        });
    }

    getWebviewContent() {
        const nonce = getNonce();

        // Извлекаем уникальные категории в порядке появления
        const categories = [...new Set(Object.values(builtinDocs).map(doc => doc.category))];
        const categoriesHtml = `
            <button class="category-btn active" data-category="">Все</button>
            ${categories.map(cat => `<button class="category-btn" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`).join('')}
        `;

        const docsHtml = Object.entries(builtinDocs).map(([name, doc]) => {
            const paramsHtml = doc.params.length > 0
                ? `<div class="params"><strong>Параметры:</strong><ul>${doc.params.map(p => `<li>${escapeHtml(p).replace(/`([^`]+)`/g, '<code>$1</code>')}</li>`).join('')}</ul></div>`
                : '';

            return `
                <div class="card" data-name="${name}" data-syntax="${escapeHtml(doc.syntax)}" data-description="${escapeHtml(doc.description)}" data-category="${escapeHtml(doc.category)}">
                    <div class="card-header">
                        <span class="func-name">${name}</span>
                    </div>
                    <div class="syntax"><code>${escapeHtml(doc.syntax)}</code></div>
                    <div class="description">${escapeHtml(doc.description)}</div>
                    ${paramsHtml}
                    <div class="example">
                        <strong>Пример:</strong>
                        <pre><code>${escapeHtml(doc.example)}</code></pre>
                    </div>
                </div>
            `;
        }).join('');

        return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Testo: Справка</title>
    <style nonce="${nonce}">
        * {
            box-sizing: border-box;
        }
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 16px;
            margin: 0;
        }
        .search-container {
            position: sticky;
            top: 0;
            background-color: var(--vscode-editor-background);
            padding: 8px 0 16px 0;
            z-index: 100;
        }
        #search {
            width: 100%;
            padding: 8px 12px;
            font-size: 14px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
        }
        #search:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        #search::placeholder {
            color: var(--vscode-input-placeholderForeground);
        }
        .cards-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .card {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 12px;
        }
        .card.hidden {
            display: none;
        }
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        .func-name {
            font-size: 16px;
            font-weight: bold;
            color: var(--vscode-symbolIcon-functionForeground, var(--vscode-textLink-foreground));
        }
        .syntax {
            margin-bottom: 8px;
        }
        .syntax code {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 4px 8px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            display: inline-block;
        }
        .description {
            margin-bottom: 8px;
            line-height: 1.4;
        }
        .params {
            margin-bottom: 8px;
        }
        .params ul {
            margin: 4px 0 0 0;
            padding-left: 20px;
        }
        .params li {
            margin: 2px 0;
        }
        .params code {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 1px 4px;
            border-radius: 2px;
            font-family: var(--vscode-editor-font-family);
        }
        .example {
            margin-top: 8px;
        }
        .example pre {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 8px;
            border-radius: 4px;
            margin: 4px 0 0 0;
            overflow-x: auto;
        }
        .example code {
            font-family: var(--vscode-editor-font-family);
            white-space: pre;
        }
        .no-results {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            padding: 20px;
            display: none;
        }
        .categories {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 10px;
        }
        .category-btn {
            padding: 4px 10px;
            font-size: 12px;
            cursor: pointer;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            color: var(--vscode-foreground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 12px;
            transition: background-color 0.15s, border-color 0.15s;
        }
        .category-btn:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        .category-btn.active {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-color: var(--vscode-button-background);
        }
    </style>
</head>
<body>
    <div class="search-container">
        <input type="text" id="search" placeholder="Поиск по функциям..." autofocus>
        <div class="categories">
            ${categoriesHtml}
        </div>
    </div>
    <div class="cards-container">
        ${docsHtml}
    </div>
    <div class="no-results" id="noResults">Ничего не найдено</div>
    <script nonce="${nonce}">
        const searchInput = document.getElementById('search');
        const cards = document.querySelectorAll('.card');
        const noResults = document.getElementById('noResults');
        const categoryBtns = document.querySelectorAll('.category-btn');

        let activeCategory = '';

        function filterCards() {
            const query = searchInput.value.toLowerCase().trim();
            let visibleCount = 0;

            cards.forEach(card => {
                const name = card.dataset.name.toLowerCase();
                const syntax = card.dataset.syntax.toLowerCase();
                const description = card.dataset.description.toLowerCase();
                const category = card.dataset.category;

                const matchesSearch = !query ||
                    name.includes(query) ||
                    syntax.includes(query) ||
                    description.includes(query);

                const matchesCategory = !activeCategory || category === activeCategory;

                const visible = matchesSearch && matchesCategory;
                card.classList.toggle('hidden', !visible);
                if (visible) visibleCount++;
            });

            noResults.style.display = visibleCount === 0 ? 'block' : 'none';
        }

        searchInput.addEventListener('input', filterCards);

        categoryBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                activeCategory = this.dataset.category;
                categoryBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                filterCards();
            });
        });
    </script>
</body>
</html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function registerDocsCommand(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('testoHelper.showDocs', () => {
            DocsPanelManager.createOrShow(context.extensionUri);
        })
    );
}

module.exports = { registerDocsCommand };
