import * as vscode from 'vscode';
import { LocalImagesPlugin } from './main';
import { VSCodeAdapter } from './vscode-adapter';

export function activate(context: vscode.ExtensionContext) {
    try {
        // 创建适配器和插件实例
        const adapter = new VSCodeAdapter(context);
        const plugin = new LocalImagesPlugin(adapter);

        // 注册命令
        let disposables = [
            // 下载媒体文件命令
            vscode.commands.registerCommand('local-images-plus.downloadMedia', async () => {
                await plugin.downloadFromClipboard();
            }),

            // 转换图片命令
            vscode.commands.registerCommand('local-images-plus.convertImages', async () => {
                await plugin.convertImages();
            }),

            // 清理孤立文件命令
            vscode.commands.registerCommand('local-images-plus.cleanOrphaned', async () => {
                await plugin.cleanOrphanedFiles();
            }),

            // 监听文档保存
            vscode.workspace.onDidSaveTextDocument(async (document) => {
                if (document.languageId === 'markdown') {
                    await plugin.processDocument(document);
                }
            }),

            // 监听剪贴板
            vscode.workspace.onDidChangeTextDocument((e) => {
                if (e.document.languageId === 'markdown' && e.contentChanges.length > 0) {
                    const change = e.contentChanges[0];
                    if (change.text.includes('base64,')) {
                        plugin.handleBase64Paste(e.document, change);
                    }
                }
            })
        ];

        // 注册所有命令
        context.subscriptions.push(...disposables);

        // 显示启动成功消息
        vscode.window.showInformationMessage('Local Images Plus is now active!');
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to activate Local Images Plus: ${error}`);
        throw error;
    }
}

export function deactivate() {
    // 清理代码
} 