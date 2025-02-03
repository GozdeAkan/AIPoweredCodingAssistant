import * as vscode from 'vscode';

export class InlineTextbox {
    public static async createOrShow(context: vscode.ExtensionContext) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found.");
            return;
        }

        const ollamaUrl = context.globalState.get<string>('ollamaUrl');
        const selectedModel = context.globalState.get<string>('selectedModel');

        if (!ollamaUrl || !selectedModel) {
            vscode.window.showErrorMessage("Ollama URL or Model is not set.");
            return;
        }

        const input = await vscode.window.showInputBox({
            prompt: "Enter your prompt",
            placeHolder: "Type a code request...",
            ignoreFocusOut: true
        });

        if (!input) {
            return; 
        }

        try {
       
            const response = await fetch(`${ollamaUrl}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: selectedModel, prompt: input, stream:false })
            });

            const result = await response.json();

          
            editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, result.response);
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Error fetching from Ollama: ${error}`);
        }
    }
}
