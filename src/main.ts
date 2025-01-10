import * as vscode from 'vscode';
import { VSCodeAdapter } from './vscode-adapter';
import { ContentProcessor } from './contentProcessor';
import { Settings } from './types/vscode-settings';
import { UniqueQueue } from './uniqueQueue';
import { logError } from './utils';

export class LocalImagesPlugin {
    private contentProcessor: ContentProcessor;
    private queue: UniqueQueue<vscode.TextDocument>;

    constructor(private adapter: VSCodeAdapter) {
        const settings = adapter.getConfiguration();
        this.contentProcessor = new ContentProcessor(settings);
        this.queue = new UniqueQueue<vscode.TextDocument>();
    }

    // 处理文档
    async processDocument(document: vscode.TextDocument): Promise<void> {
        try {
            const newContent = await this.contentProcessor.processFile(document);
            if (newContent !== document.getText()) {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(
                    document.uri,
                    new vscode.Range(0, 0, document.lineCount, 0),
                    newContent
                );
                await vscode.workspace.applyEdit(edit);
            }
        } catch (error) {
            logError(`Failed to process document: ${error}`);
        }
    }

    // 从剪贴板下载
    async downloadFromClipboard(): Promise<void> {
        const editor = this.adapter.getActiveEditor();
        if (!editor) {
            this.adapter.showMessage('No active editor', 'warning');
            return;
        }

        try {
            await this.processDocument(editor.document);
            this.adapter.showMessage('Media files downloaded successfully');
        } catch (error) {
            this.adapter.showMessage(`Failed to download media: ${error}`, 'error');
        }
    }

    // 转换图片
    async convertImages(): Promise<void> {
        const editor = this.adapter.getActiveEditor();
        if (!editor) {
            this.adapter.showMessage('No active editor', 'warning');
            return;
        }

        try {
            await this.processDocument(editor.document);
            this.adapter.showMessage('Images converted successfully');
        } catch (error) {
            this.adapter.showMessage(`Failed to convert images: ${error}`, 'error');
        }
    }

    // 清理孤立文件
    async cleanOrphanedFiles(): Promise<void> {
        const editor = this.adapter.getActiveEditor();
        if (!editor) {
            this.adapter.showMessage('No active editor', 'warning');
            return;
        }

        try {
            await this.contentProcessor.cleanOrphanedFiles(editor.document);
            this.adapter.showMessage('Orphaned files cleaned successfully');
        } catch (error) {
            this.adapter.showMessage(`Failed to clean orphaned files: ${error}`, 'error');
        }
    }

    // 处理 base64 图片粘贴
    async handleBase64Paste(document: vscode.TextDocument, change: vscode.TextDocumentContentChangeEvent): Promise<void> {
        try {
            const result = await this.contentProcessor.processBase64Image(document, Buffer.from([]), change);
            if (result) {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(
                    document.uri,
                    new vscode.Range(
                        document.positionAt(change.rangeOffset),
                        document.positionAt(change.rangeOffset + change.text.length)
                    ),
                    result
                );
                await vscode.workspace.applyEdit(edit);
            }
        } catch (error) {
            this.adapter.showMessage(`Failed to process base64 image: ${error}`, 'error');
        }
    }
}
