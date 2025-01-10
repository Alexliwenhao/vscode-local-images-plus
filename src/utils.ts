import * as vscode from 'vscode';
import path from 'path';
import { fromBuffer } from 'file-type';
import isSvg from 'is-svg';
import md5 from 'crypto-js/md5';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';
import { APP_TITLE, NOTICE_TIMEOUT } from './config';

export async function showBalloon(message: string, show: boolean = true) {
    if (show) {
        vscode.window.showInformationMessage(`${APP_TITLE}: ${message}`);
    }
}

export function logError(error: Error | string): void {
    console.error(`${APP_TITLE}: ${error}`);
    vscode.window.showErrorMessage(`${APP_TITLE}: ${error}`);
}

export async function downloadImage(url: string): Promise<Buffer | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to download: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        logError(`Failed to download image: ${error}`);
        return null;
    }
}

export function md5Sig(data: ArrayBuffer): string {
    const buffer = Buffer.from(data);
    return md5(buffer.toString('base64')).toString();
}

export async function base64ToBuff(base64: string): Promise<Buffer | null> {
    try {
        const data = base64.split(',')[1];
        return Buffer.from(data, 'base64');
    } catch (error) {
        logError(`Failed to convert base64: ${error}`);
        return null;
    }
}

export async function getFileExt(content: ArrayBuffer, link: string): Promise<string> {
    const fileExtByLink = path.extname(link).replace('.', '');
    const fileType = await fromBuffer(content);
    const fileExtByBuffer = fileType?.ext;

    if (fileExtByBuffer === 'xml' || !fileExtByBuffer) {
        const buffer = Buffer.from(content);
        if (isSvg(buffer)) return 'svg';
    }

    if (fileExtByBuffer && fileExtByBuffer.length <= 5) {
        return fileExtByBuffer;
    }

    if (fileExtByLink && fileExtByLink.length <= 5) {
        return fileExtByLink;
    }

    return 'unknown';
}

export function cleanFileName(name: string): string {
    return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_')
        .trim();
}

export function pathJoin(parts: string[]): string {
    return path.join(...parts).replace(/\\/g, '/');
}

export function normalizePath(path: string): string {
    return path.replace(/\\/g, '/');
}

export function isUrl(str: string): boolean {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
}

export async function readFromDisk(filePath: string): Promise<Buffer> {
    try {
        const uri = vscode.Uri.file(filePath);
        const data = await vscode.workspace.fs.readFile(uri);
        return Buffer.from(data);
    } catch (error) {
        logError(`Failed to read file: ${error}`);
        throw error;
    }
}

export function trimAny(str: string, chars: string[]): string {
    let start = 0;
    let end = str.length;

    while (start < end && chars.includes(str[start])) {
        ++start;
    }

    while (end > start && chars.includes(str[end - 1])) {
        --end;
    }

    return (start > 0 || end < str.length) ? str.substring(start, end) : str;
}

export async function blobToJpegArrayBuffer(data: Buffer, quality: number): Promise<Buffer> {
    const Jimp = require('jimp');
    const image = await Jimp.read(data);
    return await image
        .quality(quality)
        .getBufferAsync(Jimp.MIME_JPEG);
}

export async function convertToJpeg(data: Buffer, quality: number): Promise<Buffer> {
    return await blobToJpegArrayBuffer(data, quality);
}

 