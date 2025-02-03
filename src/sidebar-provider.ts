import * as vscode from 'vscode';

export class CustomSidebarProvider implements vscode.WebviewViewProvider {
    private _context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    resolveWebviewView(webviewView: vscode.WebviewView) {
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this.getHtmlContent();

        webviewView.webview.onDidReceiveMessage((message) => {
            if (message.command === "saveUrl") {
                this._context.globalState.update('ollamaUrl', message.url);
                vscode.window.showInformationMessage(`Saved URL: ${message.url}`);
            } else if (message.command === "openModel") {
                vscode.commands.executeCommand("customView.openOverlay");
                this._context.globalState.update('selectedModel', message.model);
            }
        });
    }

    getHtmlContent(): string {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Custom View</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 12px; background: #1e1e1e; color: white; }
                .container { display: flex; flex-direction: column; align-items: center; gap: 12px; max-width: 98%; margin: auto; }
                h3 { font-size: 16px; text-align: left; width: 100%; margin-bottom: 10px; }

                .accordion { 
                    width: 100%; 
                    max-width: 280px;
                    border-bottom: 1px solid #444; 
                    cursor: pointer; 
                    padding: 10px; 
                    background: #252526; 
                    color: white; 
                    text-align: left; 
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: bold;
                }
                .accordion:hover { background: #333; }

                .panel { 
                    padding: 10px; 
                    display: none; 
                    overflow: hidden; 
                    background: #2c2c2c; 
                    border-radius: 6px; 
                    margin-top: 5px;
                    width: 100%;
                    max-width: 280px;
                }

                input, button, select { 
                    width: 92%; 
                    max-width: 260px;
                    padding: 8px; 
                    font-size: 13px; 
                    border-radius: 5px; 
                    display: block; 
                    margin: 6px auto;
                }

                input { 
                    border: 1px solid #444; 
                    background: #252526; 
                    color: white; 
                    text-align: center;
                }

                button { 
                    background-color: #007acc; 
                    color: white; 
                    border: none; 
                    cursor: pointer;
                }

                button:hover { background-color: #005fa3; }

                #openModelButton { 
                    display: none;
                    background-color: #28a745; 
                }

                #openModelButton:hover { 
                    background-color: #218838;
                }

            </style>
        </head>
        <body>
            <div class="container">
                <h3>Settings</h3>

                <button class="accordion">Ollama Server</button>
                <div class="panel">
                    <input type="text" id="serverUrl" placeholder="Enter the URL of Ollama server" />
                    <button id="saveButton">Save URL</button>
                </div>

                <button class="accordion">Available Models</button>
                <div class="panel">
                    <select id="modelDropdown">
                        <option value="">Loading...</option>
                    </select>
                    <button id="selectModelButton">Assist with the Model</button>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                let savedUrl = "";

                document.getElementById('saveButton').addEventListener('click', () => {
                    savedUrl = document.getElementById('serverUrl').value;
                    vscode.postMessage({ command: 'saveUrl', url: savedUrl });
                    fetchModels(savedUrl);
                });

                document.getElementById('selectModelButton').addEventListener('click', () => {
                    const selectedModel = document.getElementById('modelDropdown').value;
                    if (selectedModel) {
                        vscode.postMessage({ command: 'selectModel', model: selectedModel });
                         vscode.postMessage({ command: 'openModel', model: selectedModel });
                    } else {
                        vscode.postMessage({ command: 'error', message: 'Please select a model first.' });
                    }
                });

               

                function fetchModels(serverUrl) {
                    if (!serverUrl) return;

                    fetch(\`\${serverUrl}/api/tags\`)
                        .then(response => response.json())
                        .then(data => {
                            const modelDropdown = document.getElementById('modelDropdown');
                            modelDropdown.innerHTML = "";
                            if (data.models && data.models.length > 0) {
                                data.models.forEach(model => {
                                    let option = document.createElement('option');
                                    option.value = model.name;
                                    option.textContent = model.name;
                                    modelDropdown.appendChild(option);
                                });
                            } else {
                                let option = document.createElement('option');
                                option.textContent = "No models found";
                                modelDropdown.appendChild(option);
                            }
                        })
                        .catch(error => {
                            console.error("Error fetching models:", error);
                            document.getElementById('modelDropdown').innerHTML = "<option>Error loading models</option>";
                        });
                }

                // Accordion functionality
                const acc = document.getElementsByClassName("accordion");
                for (let i = 0; i < acc.length; i++) {
                    acc[i].addEventListener("click", function() {
                        this.classList.toggle("active");
                        const panel = this.nextElementSibling;
                        panel.style.display = (panel.style.display === "block") ? "none" : "block";
                    });
                }
            </script>
        </body>
        </html>
        `;
    }
}