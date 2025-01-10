import * as vscode from 'vscode';
import { TextEncoder, TextDecoder } from 'util';
import { Settings, DEFAULT_SETTINGS } from './types/vscode-settings';
import path from 'path';
import { logError } from './utils';

export class VSCodeAdapter {
    constructor(private context: vscode.ExtensionContext) {}

    // 文件系统操作
    async readFile(filePath: string): Promise<Buffer> {
        try {
            const uri = vscode.Uri.file(filePath);
            const data = await vscode.workspace.fs.readFile(uri);
            return Buffer.from(data);
        } catch (error) {
            logError(`Failed to read file ${filePath}: ${error}`);
            throw error;
        }
    }

    async writeFile(filePath: string, data: Buffer): Promise<void> {
        try {
            const uri = vscode.Uri.file(filePath);
            await vscode.workspace.fs.writeFile(uri, data);
        } catch (error) {
            logError(`Failed to write file ${filePath}: ${error}`);
            throw error;
        }
    }

    async delete(uri: vscode.Uri, options?: { useTrash?: boolean }): Promise<void> {
        try {
            await vscode.workspace.fs.delete(uri, {
                recursive: true,
                useTrash: options?.useTrash ?? true
            });
        } catch (error) {
            logError(`Failed to delete ${uri.fsPath}: ${error}`);
            throw error;
        }
    }

    async createDirectory(dirPath: string): Promise<void> {
        try {
            const uri = vscode.Uri.file(dirPath);
            await vscode.workspace.fs.createDirectory(uri);
        } catch (error) {
            // 目录可能已经存在，忽略错误
            logError(`Create directory warning ${dirPath}: ${error}`);
        }
    }

    async exists(filePath: string): Promise<boolean> {
        try {
            const uri = vscode.Uri.file(filePath);
            await vscode.workspace.fs.stat(uri);
            return true;
        } catch {
            return false;
        }
    }

    async rename(oldPath: string, newPath: string): Promise<void> {
        try {
            const oldUri = vscode.Uri.file(oldPath);
            const newUri = vscode.Uri.file(newPath);
            await vscode.workspace.fs.rename(oldUri, newUri);
        } catch (error) {
            logError(`Failed to rename ${oldPath} to ${newPath}: ${error}`);
            throw error;
        }
    }

    // 编辑器操作
    getActiveEditor(): vscode.TextEditor | undefined {
        return vscode.window.activeTextEditor;
    }

    // 通知操作
    showMessage(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
        switch (type) {
            case 'info':
                vscode.window.showInformationMessage(message);
                break;
            case 'warning':
                vscode.window.showWarningMessage(message);
                break;
            case 'error':
                vscode.window.showErrorMessage(message);
                break;
        }
    }

    // 配置操作
    getConfiguration(): Settings {
        const config = vscode.workspace.getConfiguration('localImagesPlus');
        return {
            ...DEFAULT_SETTINGS,
            ...Object.fromEntries(
                Object.keys(DEFAULT_SETTINGS).map(key => [
                    key,
                    config.get(key, DEFAULT_SETTINGS[key as keyof Settings])
                ])
            )
        } as Settings;
    }
} 