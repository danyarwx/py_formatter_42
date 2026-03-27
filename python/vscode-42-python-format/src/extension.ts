import * as cp from 'child_process';
import * as vscode from 'vscode';

const EXTENSION_NAME = '42-python-format';
const DEFAULT_EXECUTABLE = 'autopep8';
const DEFAULT_ARGS = ['-'];
const FORMATTER_TIMEOUT_MS = 30000;

const UI_LABELS = {
  openSettings: 'Open Settings',
  showOutput: 'Show Output',
} as const;

const outputChannel = vscode.window.createOutputChannel('42 Python Format');

type FormatterConfiguration = {
  executable: string;
  args: string[];
};

class PythonDocumentFormattingEditProvider implements vscode.DocumentFormattingEditProvider {
  public async provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    _: vscode.FormattingOptions,
    token: vscode.CancellationToken
  ): Promise<vscode.TextEdit[]> {
    try {
      const formattedContent = await this.runFormatter(document, token);
      if (formattedContent === null || formattedContent === document.getText()) {
        return [];
      }

      return [
        vscode.TextEdit.replace(
          new vscode.Range(
            document.lineAt(0).range.start,
            document.lineAt(document.lineCount - 1).range.end
          ),
          formattedContent
        ),
      ];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      outputChannel.appendLine(`[Error] ${message}`);
      return [];
    }
  }

  private async runFormatter(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<string | null> {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)?.uri.fsPath;
    const configuration = this.getConfiguration(document, workspaceFolder);

    return new Promise((resolve, reject) => {
      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];
      const child = cp.spawn(configuration.executable, configuration.args, workspaceFolder ? { cwd: workspaceFolder } : {});

      const timeoutId = setTimeout(() => {
        child.kill();
        reject(new Error(`Formatter timed out after ${FORMATTER_TIMEOUT_MS / 1000} seconds.`));
      }, FORMATTER_TIMEOUT_MS);

      let cancellationDisposable: vscode.Disposable | undefined;
      const cleanup = () => {
        clearTimeout(timeoutId);
        cancellationDisposable?.dispose();
      };

      child.on('error', (error: NodeJS.ErrnoException) => {
        cleanup();

        if (error.code === 'ENOENT') {
          vscode.window.showErrorMessage(
            `Command not found: "${configuration.executable}". Install autopep8 or update ${EXTENSION_NAME}.executable.`,
            UI_LABELS.openSettings
          ).then(selection => {
            if (selection === UI_LABELS.openSettings) {
              void vscode.commands.executeCommand('workbench.action.openSettings', EXTENSION_NAME);
            }
          });

          resolve(null);
          return;
        }

        reject(error);
      });

      child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
      child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));
      child.stdin.end(document.getText());

      child.on('close', code => {
        cleanup();

        const stdout = Buffer.concat(stdoutChunks).toString('utf8');
        const stderr = Buffer.concat(stderrChunks).toString('utf8');

        if (stderr.length > 0) {
          outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] stderr`);
          outputChannel.appendLine(stderr);
        }

        if (code !== 0) {
          outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Formatter exited with code ${code}.`);
          vscode.window.showErrorMessage(
            '42 Python Format: formatting failed. See output for details.',
            UI_LABELS.showOutput
          ).then(selection => {
            if (selection === UI_LABELS.showOutput) {
              outputChannel.show(true);
            }
          });
          reject(new Error('Formatting failed.'));
          return;
        }

        resolve(stdout);
      });

      cancellationDisposable = token.onCancellationRequested(() => {
        cleanup();
        child.kill();
        reject(new Error('Formatting was canceled.'));
      });
    });
  }

  private getConfiguration(
    document: vscode.TextDocument,
    workspaceFolder: string | undefined
  ): FormatterConfiguration {
    const config = vscode.workspace.getConfiguration(EXTENSION_NAME, document.uri);
    const executable = config.get<string>('executable', DEFAULT_EXECUTABLE);
    const configuredArgs = config.get<string[]>('args', DEFAULT_ARGS);

    return {
      executable,
      args: configuredArgs.map(arg => this.expandPlaceholders(arg, document, workspaceFolder)),
    };
  }

  private expandPlaceholders(
    value: string,
    document: vscode.TextDocument,
    workspaceFolder: string | undefined
  ): string {
    return value
      .replace(/\$\{file\}/g, document.uri.fsPath)
      .replace(/\$\{workspaceFolder\}/g, workspaceFolder ?? '');
  }
}

export function activate(context: vscode.ExtensionContext) {
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(code) 42PyFmt';
  statusBarItem.tooltip = '42 Python Format is active';
  statusBarItem.show();

  context.subscriptions.push(statusBarItem);
  context.subscriptions.push(outputChannel);

  const formatter = new PythonDocumentFormattingEditProvider();
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      { language: 'python', scheme: 'file' },
      formatter
    )
  );
}

export function deactivate() {
  outputChannel.dispose();
}
