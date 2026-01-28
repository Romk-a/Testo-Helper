const vscode = require('vscode');
const builtinDocs = require('./builtinDocs');
const keysReference = require('./keysReference');

class DocsPanelManager {
    static currentPanel = undefined;

    static createOrShow(extensionUri, initialTab = 'functions') {
        const column = vscode.ViewColumn.Beside;

        if (DocsPanelManager.currentPanel) {
            DocsPanelManager.currentPanel.panel.reveal(column);
            // Переключаем на нужную вкладку, если панель уже открыта
            DocsPanelManager.currentPanel.switchToTab(initialTab);
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

        DocsPanelManager.currentPanel = new DocsPanelManager(panel, initialTab);
    }

    constructor(panel, initialTab = 'functions') {
        this.panel = panel;
        this.initialTab = initialTab;
        this.panel.webview.html = this.getWebviewContent();

        this.panel.onDidDispose(() => {
            DocsPanelManager.currentPanel = undefined;
        });
    }

    switchToTab(tabName) {
        this.panel.webview.postMessage({ command: 'switchTab', tab: tabName });
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

        // Генерация HTML для клавиш
        const keysHtml = Object.entries(keysReference).map(([group, keys]) => {
            const keysItems = keys.map(k => `
                <div class="key-item">
                    <code class="key-name">${escapeHtml(k.key)}</code>
                    <span class="key-desc">${escapeHtml(k.desc)}</span>
                </div>
            `).join('');
            return `
                <div class="keys-group">
                    <h3>${escapeHtml(group)}</h3>
                    <div class="keys-list">
                        ${keysItems}
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
        .tabs {
            display: flex;
            gap: 4px;
            margin-bottom: 12px;
        }
        .tab {
            padding: 6px 16px;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 4px;
            color: var(--vscode-foreground);
            font-size: 13px;
        }
        .tab:hover {
            background: var(--vscode-list-hoverBackground);
        }
        .tab.active {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .tab-content.hidden {
            display: none;
        }
        .keys-group {
            margin-bottom: 20px;
        }
        .keys-group h3 {
            margin: 0 0 8px 0;
            font-size: 14px;
            color: var(--vscode-textLink-foreground);
        }
        .keys-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 6px;
        }
        .key-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .key-name {
            background: var(--vscode-textCodeBlock-background);
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
            min-width: 100px;
            font-family: var(--vscode-editor-font-family);
            cursor: pointer;
            transition: background-color 0.15s, color 0.15s;
        }
        .key-name:hover {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .key-name.copied {
            background: var(--vscode-testing-iconPassed, #4caf50);
            color: white;
        }
        .key-desc {
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
        }
        .keys-note {
            background: var(--vscode-textBlockQuote-background);
            border-left: 3px solid var(--vscode-textLink-foreground);
            padding: 8px 12px;
            margin-bottom: 16px;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="tabs">
        <button class="tab active" data-tab="functions">Функции</button>
        <button class="tab" data-tab="keys">Клавиши для press</button>
    </div>

    <div class="tab-content" id="functions-tab">
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
    </div>

    <div class="tab-content hidden" id="keys-tab">
        <div class="keys-note">Названия клавиш регистронезависимые. Нажмите на клавишу, чтобы скопировать.</div>
        ${keysHtml}
    </div>
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

        // Переключение вкладок
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.dataset.tab;

                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                tabContents.forEach(content => {
                    if (content.id === tabName + '-tab') {
                        content.classList.remove('hidden');
                    } else {
                        content.classList.add('hidden');
                    }
                });
            });
        });

        // Копирование клавиши в буфер обмена
        document.querySelectorAll('.key-name').forEach(keyEl => {
            keyEl.addEventListener('click', function() {
                const keyText = this.textContent;
                navigator.clipboard.writeText(keyText).then(() => {
                    this.classList.add('copied');
                    setTimeout(() => {
                        this.classList.remove('copied');
                    }, 500);
                });
            });
        });

        // Функция переключения на вкладку
        function switchToTab(tabName) {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => {
                if (content.id === tabName + '-tab') {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
            const targetTab = document.querySelector('.tab[data-tab="' + tabName + '"]');
            if (targetTab) {
                targetTab.classList.add('active');
            }
        }

        // Обработка сообщений от расширения
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'switchTab') {
                switchToTab(message.tab);
            }
        });

        // Начальная вкладка
        const initialTab = '${this.initialTab}';
        if (initialTab !== 'functions') {
            switchToTab(initialTab);
        }
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
            DocsPanelManager.createOrShow(context.extensionUri, 'functions');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('testoHelper.showKeysReference', () => {
            DocsPanelManager.createOrShow(context.extensionUri, 'keys');
        })
    );
}

module.exports = { registerDocsCommand };
