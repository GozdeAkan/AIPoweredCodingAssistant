import * as vscode from 'vscode';

export class InlineTextbox {
    private static textboxPanel: vscode.WebviewPanel | undefined;

    public static async createOrShow(context: vscode.ExtensionContext) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found.");
            return;
        }

        const ollamaUrl = context.globalState.get<string>("ollamaUrl");
        const selectedModel = context.globalState.get<string>("selectedModel");

        if (!ollamaUrl || !selectedModel) {
            vscode.window.showErrorMessage("Ollama URL or Model is not set.");
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            "inlineTextbox",
            "Ollama Assistant",
            vscode.ViewColumn.Beside,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        InlineTextbox.textboxPanel = panel;
        InlineTextbox.showFloatingTextbox(panel, editor, ollamaUrl, selectedModel);

        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === "insertText") {
                const activeEditor = vscode.window.activeTextEditor;
                if (!activeEditor) {
                    vscode.window.showErrorMessage("No active editor found.");
                    return;
                }

                // API'den dönen cevabı editöre ekleyelim
                activeEditor.edit(editBuilder => {
                    editBuilder.insert(activeEditor.selection.active, message.text);
                });
            }
        });
    }

    private static showFloatingTextbox(panel: vscode.WebviewPanel, editor: vscode.TextEditor, ollamaUrl: string, selectedModel: string) {
        panel.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ollama Assistant</title>
            <style>
                body { background: transparent; color: white; font-size: 14px; padding: 10px; margin: 0; }
                input { width: 100%; padding: 6px; font-size: 14px; background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid #555; border-radius: 4px; text-align: center; outline: none; }
                button { margin-top: 5px; background: #007acc; border: none; color: white; padding: 6px; border-radius: 3px; cursor: pointer; }
            </style>
        </head>
        <body>
            <input type="text" id="inlineInput" placeholder="Write your code here..." />
            <button id="sendBtn">Generate</button>
            <script>
                const vscode = acquireVsCodeApi();
                document.getElementById("sendBtn").addEventListener("click", async () => {
                    const input = document.getElementById("inlineInput").value;
                    try {
                        const response = await fetch("${ollamaUrl}/api/generate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ model: "${selectedModel}", prompt: input, stream:false })
                        });

                        const result = await response.json();

                        // Sonuç boş gelirse hata ver
                        if (!result || !result.response) {
                            vscode.postMessage({ command: "error", message: "API response is empty" });
                            return;
                        }

                        // API'den dönen cevabı editöre yapıştır
                        vscode.postMessage({ command: "insertText", text: result.response });

                    } catch (error) {
                        vscode.postMessage({ command: "error", message: "Error fetching data: " + error.message });
                    }
                });
            </script>
        </body>
        </html>
        `;
    }
}
