import * as vscode from "vscode";
import {getNonce} from "../libs/getNonce";
import {URI, Utils} from 'vscode-uri';
import {ScanResult} from "lightning-flow-scanner-core/out/main/models/ScanResult";

export class FlowReport {

    public static currentPanel: FlowReport | undefined;
    public static readonly viewType = "report";
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static create(extensionUri: vscode.Uri , scanResult : ScanResult, type : string) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        const panel = vscode.window.createWebviewPanel(
            FlowReport.viewType,
            `${type}:${scanResult.flow.label}`,
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    Utils.joinPath(extensionUri, "media"),
                    Utils.joinPath(extensionUri, "out/compiled")
                ]
            }
        );
        FlowReport.currentPanel = new FlowReport(panel, extensionUri, scanResult);
    }

    public static kill() {
        FlowReport.currentPanel?.dispose();
        FlowReport.currentPanel = undefined;
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, scanResult : ScanResult) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._update(scanResult);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public dispose() {
        FlowReport.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update(scanResult : ScanResult) {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
        webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "goToFile": {
                  if (!data.value) {
                    return;
                  }
                  vscode.workspace.openTextDocument(data.value.path).then(doc => {
                    vscode.window.showTextDocument(doc);
                  });
                  break;
                }
                case 'init-view': {
                    webview.postMessage({
                        type: 'init',
                        value: scanResult
                    });
                    return;
                }
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            Utils.joinPath(this._extensionUri, "out/compiled", "FlowReport.js")
        );
        const stylesResetUri = webview.asWebviewUri(Utils.joinPath(
            this._extensionUri,
            "media",
            "reset.css"
        ));
        const stylesMainUri = webview.asWebviewUri(Utils.joinPath(
            this._extensionUri,
            "media",
            "vscode.css"
        ));
        const cssUri = webview.asWebviewUri(Utils.joinPath(
            this._extensionUri,
            "media",
            "FlowReport.css"
        ));
        const nonce = getNonce();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${stylesResetUri}" rel="stylesheet">
        <link href="${stylesMainUri}" rel="stylesheet">
        <link href="${cssUri}" rel="stylesheet">
        <script nonce="${nonce}">
        const tsvscode = acquireVsCodeApi();
        </script>
			</head>
      <body>
            <script src="${scriptUri}" nonce="${nonce}"></script>
			</body>
			</html>`;
    }

}
