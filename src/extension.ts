import * as vscode from "vscode";
import { listen as httpListen, close as httpClose } from "./http";
import { init as initConnection } from "./dao/connection";
import { init as initTreeview } from "./treeview";
import { init as initCommand } from "./command";

export function activate(context: vscode.ExtensionContext) {
  httpListen(context)
    .then(() => {
      initConnection(context);
      initTreeview(context);
      initCommand(context);
    })
    .catch((err: Error) => {
      vscode.window.showErrorMessage(err.message);
    });
}

export function deactivate() {
  httpClose().catch((err: Error) => {
    vscode.window.showErrorMessage(err.message);
  });
}
