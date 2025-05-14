const vscode = require('vscode');
const { registerJiraCommand } = require('./jiraOpener');
const { registerDefinitionProvider } = require('./definitionProvider');
const { registerFormatCommand } = require('./formatting');

function activate(context) {
    // Регистрируем команду для открытия в Jira
    registerJiraCommand(context);

    // Регистрируем провайдер и команду перехода к определению
    registerDefinitionProvider(context);

    // Регистрируем команду форматирования
    registerFormatCommand(context);
}

module.exports = {
    activate,
    deactivate: function() {}
};