import * as vscode from 'vscode';
import * as path from 'path';
import { Settings } from './types/vscode-settings';
import AsyncLock from 'async-lock';
import moment from 'moment';
import {
    isUrl,
    downloadImage,
    readFromDisk,
    cleanFileName,
    logError,
    trimAny,
    pathJoin,
    normalizePath,
    base64ToBuff,
    md5Sig,
    getFileExt,
    blobToJpegArrayBuffer
} from './utils';

export class ContentProcessor {
    private lock: AsyncLock;

    constructor(private settings: Settings) {
        this.lock = new AsyncLock();
    }

    async processFile(document: vscode.TextDocument): Promise<string> {
        return await this.lock.acquire('process', async () => {
            const content = document.getText();
            if (content.length === 0) return content;
            return await this.processContent(content, document);
        });
    }

    private async processContent(content: string, document: vscode.TextDocument): Promise<string> {
        const mediaDir = await this.getMediaDir(document);
        await this.ensureDirectoryExists(mediaDir);
        return await this.replaceImageTags(content, document, mediaDir);
    }

    private async getFileData(link: string): Promise<ArrayBuffer | null> {
        if (link.startsWith('data:')) {
            return base64ToBuff(link);
        }

        if (link.startsWith('file://')) {
            const filePath = link.replace('file://', '');
            return readFromDisk(filePath);
        }

        return downloadImage(link);
    }

    private async generateFileName(mediaDir: string, link: string, data: ArrayBuffer): Promise<{ fileName: string | null; needWrite: boolean }> {
        const ext = await getFileExt(data, link);
        if (!ext || (ext === 'unknown' && !this.settings.downUnknown)) {
            return { fileName: null, needWrite: false };
        }

        let baseName: string;
        if (this.settings.deduplicate) {
            baseName = md5Sig(data);
        } else {
            const originalName = path.basename(link).split('?')[0];
            baseName = cleanFileName(path.parse(originalName).name);
        }

        const fileName = path.join(mediaDir, `${baseName}.${ext}`);
        const needWrite = !(await this.fileExists(fileName));

        return { fileName, needWrite };
    }

    private async getMediaDir(document: vscode.TextDocument): Promise<string> {
        const docDir = path.dirname(document.uri.fsPath);
        const docName = path.parse(document.fileName).name;
        
        let mediaDir = this.settings.attachmentFolder
            .replace('${fileName}', docName)
            .replace('${documentBaseName}', docName)
            .replace('${date}', moment().format('YYYY-MM-DD'));

        if (this.settings.saveAttE === 'nextToNoteS') {
            return pathJoin([docDir, mediaDir]);
        } else {
            return pathJoin([docDir, mediaDir.replace('./', '')]);
        }
    }

    private getRelativePath(document: vscode.TextDocument, filePath: string): string {
        const docDir = path.dirname(document.uri.fsPath);
        let relativePath = path.relative(docDir, filePath);
        
        switch (this.settings.pathInTags) {
            case 'fullDirPath':
                return filePath;
            case 'onlyRelative':
                return normalizePath(relativePath);
            case 'baseFileName':
                return path.basename(filePath);
            default:
                return normalizePath(relativePath);
        }
    }

    private createMarkdownLink(alt: string, path: string): string {
        const caption = this.settings.useCaptions ? alt : '';
        return `![${caption}](${path})`;
    }

    private async ensureDirectoryExists(dir: string): Promise<void> {
        try {
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(dir));
        } catch (error) {
            // 目录可能已经存在，忽略错误
        }
    }

    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
            return true;
        } catch {
            return false;
        }
    }

    private async replaceImageTags(content: string, document: vscode.TextDocument, mediaDir: string): Promise<string> {
        const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
        let newContent = content;
        let match;

        while ((match = imageRegex.exec(content)) !== null) {
            const [fullMatch, alt, link] = match;
            if (!isUrl(link)) continue;

            try {
                const newTag = await this.processImageTag(fullMatch, alt, link, mediaDir, document);
                if (newTag) {
                    newContent = newContent.replace(fullMatch, newTag);
                }
            } catch (error) {
                logError(`Failed to process image: ${error}`);
            }
        }

        return newContent;
    }

    private async processImageTag(
        fullMatch: string,
        alt: string,
        link: string,
        mediaDir: string,
        document: vscode.TextDocument
    ): Promise<string | null> {
        try {
            const fileData = await this.getFileData(link);
            if (!fileData || fileData.byteLength / 1024 < this.settings.filesizeLimit) {
                return null;
            }

            // 处理 PNG 转 JPEG
            let finalData = fileData;
            let ext = await getFileExt(fileData, link);
            if (this.settings.PngToJpeg && ext === 'png') {
                finalData = await blobToJpegArrayBuffer(Buffer.from(fileData), this.settings.JpegQuality);
                ext = 'jpg';
            }

            const { fileName, needWrite } = await this.generateFileName(mediaDir, link, finalData);
            if (!fileName) return null;

            if (needWrite) {
                await vscode.workspace.fs.writeFile(
                    vscode.Uri.file(fileName),
                    Buffer.from(finalData)
                );
            }

            const relativePath = this.getRelativePath(document, fileName);
            return this.createMarkdownLink(alt, relativePath);
        } catch (error) {
            logError(`Image processing failed: ${error}`);
            return null;
        }
    }

    async cleanOrphanedFiles(document: vscode.TextDocument): Promise<void> {
        const mediaDir = await this.getMediaDir(document);
        const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(mediaDir));
        const content = document.getText();
        const usedFiles = new Set<string>();

        // 收集所有使用的文件
        const regex = /!\[.*?\]\((.*?)\)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            const filePath = match[1];
            if (!isUrl(filePath)) {
                usedFiles.add(path.basename(filePath));
            }
        }

        // 删除未使用的文件
        for (const [name, type] of files) {
            if (type === vscode.FileType.File && !usedFiles.has(name)) {
                const filePath = path.join(mediaDir, name);
                await vscode.workspace.fs.delete(vscode.Uri.file(filePath), {
                    useTrash: !this.settings.removeOrphansCompl
                });
            }
        }
    }

    async processBase64Image(
        document: vscode.TextDocument,
        imageData: Buffer,
        change: vscode.TextDocumentContentChangeEvent
    ): Promise<string | null> {
        try {
            const mediaDir = await this.getMediaDir(document);
            await this.ensureDirectoryExists(mediaDir);

            const { fileName, needWrite } = await this.generateFileName(mediaDir, 'pasted_image.png', imageData);
            if (!fileName) return null;

            if (needWrite) {
                await vscode.workspace.fs.writeFile(
                    vscode.Uri.file(fileName),
                    imageData
                );
            }

            const relativePath = this.getRelativePath(document, fileName);
            return this.createMarkdownLink('', relativePath);
        } catch (error) {
            logError(`Failed to process base64 image: ${error}`);
            return null;
        }
    }
}
