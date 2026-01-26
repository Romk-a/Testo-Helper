const vscode = require('vscode');
const fs = require('fs');
const path = require('path');


/**
 * Проверяет, была ли установлена новая версия расширения
 * и показывает уведомление пользователю
 *
 * @param {vscode.ExtensionContext} context
 */
async function showUpdateNotification(context) {
    const currentVersion = context.extension.packageJSON.version;
    const lastVersion = context.globalState.get('testoHelper.lastVersion');

    // Если это первая установка — просто сохраним версию
    if (!lastVersion) {
        await context.globalState.update('testoHelper.lastVersion', currentVersion);
        return;
    }

    // Если версии совпадают — не показываем уведомление
    if (lastVersion === currentVersion) {
        return;
    }

    // Версия изменилась — покажем уведомление (асинхронно, не блокируя активацию)
    const changelogPath = path.join(context.extensionPath, 'changelog.md');
    const changelogExists = fs.existsSync(changelogPath);

    vscode.window.showInformationMessage(
        `[Testo Helper v${currentVersion}] обновился! Узнай, что изменилось.`,
        'Посмотреть changelog',
        'Напомнить позже'
    ).then(async (action) => {
        if (action === 'Посмотреть changelog') {
            if (changelogExists) {
                try {
                    const changelogUri = vscode.Uri.file(changelogPath);
                    await vscode.commands.executeCommand('markdown.showPreview', changelogUri);
                } catch (err) {
                    vscode.window.showErrorMessage(`Ошибка открытия changelog: ${err.message}`);
                }
            } else {
                vscode.window.showWarningMessage('Файл changelog не найден.');
            }
        }

        // Сохраняем версию, если не нажата кнопка "Напомнить позже"
        if (action !== 'Напомнить позже') {
            await context.globalState.update('testoHelper.lastVersion', currentVersion);
        }
    });
}

async function forceShowUpdateNotification(context) {
    await context.globalState.update('testoHelper.lastVersion', '0.0.0');
    await showUpdateNotification(context);
}

module.exports = {
    showUpdateNotification,
    forceShowUpdateNotification
};