const vscode = require('vscode');
const path = require('path');

async function openInJira(fileUri) {
    console.log('JiraOpener: Command triggered with fileUri:', fileUri);
    try {
        // Если fileUri не передан, пробуем получить его из активного редактора
        if (!fileUri) {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && activeEditor.document.uri.fsPath.endsWith('.testo')) {
                fileUri = activeEditor.document.uri;
                console.log('JiraOpener: Using fileUri from active editor:', fileUri.fsPath);
            } else {
                vscode.window.showErrorMessage('No .testo file selected or open.');
                console.log('JiraOpener: No fileUri provided and no active .testo editor.');
                return;
            }
        }

        // Проверяем, что fileUri имеет fsPath
        if (!fileUri.fsPath) {
            vscode.window.showErrorMessage('Invalid file selection.');
            console.log('JiraOpener: fileUri is invalid:', fileUri);
            return;
        }

        const fileName = path.basename(fileUri.fsPath);
        console.log('JiraOpener: Processing file:', fileName);

        // Проверяем формат имени файла
        const match = fileName.match(/(T\d+)\.testo$/i);
        if (!match) {
            vscode.window.showErrorMessage(`File "${fileName}" does not match the expected format (T<id>.testo).`);
            console.log('JiraOpener: File name does not match T<digits>.testo:', fileName);
            return;
        }

        const testCaseId = path.basename(fileName, '.testo');
        // Читаем базовый URL из настроек
        const jiraBaseUrl = vscode.workspace.getConfiguration('testoHelper').get('jiraBaseUrl');
        if (!jiraBaseUrl) {
            vscode.window.showErrorMessage('Jira base URL is not configured. Please set "testoHelper.jiraBaseUrl" in settings.');
            console.log('JiraOpener: Jira base URL not configured.');
            return;
        }

        const jiraUrl = `${jiraBaseUrl}${testCaseId}`;
        console.log('JiraOpener: Generated Jira URL:', jiraUrl);

        // Пытаемся открыть URL
        const success = await vscode.env.openExternal(vscode.Uri.parse(jiraUrl));
        if (!success) {
            vscode.window.showErrorMessage('Failed to open Jira URL. Check your browser settings.');
            console.log('JiraOpener: Failed to open URL:', jiraUrl);
        } else {
            console.log('JiraOpener: Successfully opened URL:', jiraUrl);
        }
    } catch (err) {
        vscode.window.showErrorMessage('Error opening Jira: ' + err.message);
        console.log('JiraOpener: Exception:', err);
    }
}

function registerJiraCommand(context) {
    let disposableJira = vscode.commands.registerCommand('jiraOpener.openInJira', openInJira);
    context.subscriptions.push(disposableJira);
}

module.exports = {
    registerJiraCommand
};