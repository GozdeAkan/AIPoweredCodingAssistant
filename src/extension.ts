import * as vscode from 'vscode';
import { InlineTextbox } from './inline-textbox';
import { CustomSidebarProvider } from './sidebar-provider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Custom View Extension Activated!');

    const provider = new CustomSidebarProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("customView", provider)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("customView.openOverlay", () => {
            InlineTextbox.createOrShow(context);
        })
    );
}

export function deactivate() {}




