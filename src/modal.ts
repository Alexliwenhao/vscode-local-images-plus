import * as vscode from 'vscode';
import { APP_TITLE } from './config';

export class Modal {
	constructor(
		private title: string = APP_TITLE,
		private message: string = '',
		private buttons: string[] = ['Cancel', 'Confirm']
	) {}

	async show(): Promise<boolean> {
		const result = await vscode.window.showWarningMessage(
			`${this.title}\n${this.message}`,
			...this.buttons
		);
		return result === this.buttons[1]; // 返回是否点击了确认按钮
	}
}

export class ConfirmModal extends Modal {
	constructor(message: string) {
		super(APP_TITLE, message, ['Cancel', 'Confirm']);
	}
}

export class InfoModal extends Modal {
	constructor(message: string) {
		super(APP_TITLE, message, ['OK']);
	}
}

// 用于显示进度的模态框
export class ProgressModal {
	private progress?: vscode.Progress<{ message?: string; increment?: number }>;
	private token: vscode.CancellationTokenSource;

	constructor(private title: string = APP_TITLE) {
		this.token = new vscode.CancellationTokenSource();
	}

	async show<T>(
		task: (
			progress: vscode.Progress<{ message?: string; increment?: number }>,
			token: vscode.CancellationToken
		) => Thenable<T>
	): Promise<T> {
		return vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: this.title,
				cancellable: true
			},
			async (progress, token) => {
				this.progress = progress;
				token.onCancellationRequested(() => {
					this.token.cancel();
				});
				return await task(progress, token);
			}
		);
	}

	update(message: string, increment?: number) {
		this.progress?.report({ message, increment });
	}

	cancel() {
		this.token.cancel();
	}
}
