const vscode = require('vscode');
const { registerJiraCommand } = require('./jiraOpener');
const { registerProviders } = require('./definitionProvider');
const { registerFormatCommand } = require('./formatting');
const { showUpdateNotification, forceShowUpdateNotification } = require('./updateNotifier');

async function activate(context) {
    // Показываем уведомление об обновлении
    await showUpdateNotification(context);

    // Регистрируем команду для тестирования уведомления
    context.subscriptions.push(
        vscode.commands.registerCommand('testoHelper.testUpdateNotification', async () => {
            await forceShowUpdateNotification(context);
        })
    );

    // Регистрируем команду для открытия в Jira
    registerJiraCommand(context);

    // Регистрируем провайдеры из defenitionProvider
    registerProviders(context);

    // Регистрируем команду форматирования
    registerFormatCommand(context);
}

module.exports = {
    activate,
    deactivate: function () { }
};