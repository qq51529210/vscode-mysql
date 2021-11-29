import * as vscode from "vscode";
import { TreeDataProvider } from "./provider";
import { panel as tableWeb } from "../webview/table";
import { panel as collectionWeb } from "../webview/collection";

let _iconPath: vscode.Uri;
const provider = new TreeDataProvider();

export const init = (context: vscode.ExtensionContext) => {
  _iconPath = vscode.Uri.joinPath(context.extensionUri, "images");
  provider.init();
  const treeview = vscode.window.createTreeView("mysql", {
    treeDataProvider: provider,
    canSelectMany: false,
  });
  treeview.onDidExpandElement(event => {
    if (!event.element.children.length) {
      event.element
        .refresh()
        .then(() => {
          provider.refresh();
        })
        .catch((err: Error) => {
          vscode.window.showErrorMessage(err.message);
        });
    }
  });
  treeview.onDidChangeSelection(event => {
    let item = event.selection[0];
    if (item.toString() === "Table") {
      let connection = item.parent?.parent?.parent?.label as string;
      let schema = item.parent?.parent?.label as string;
      let table = item.label as string;
      context.subscriptions.push(tableWeb(connection, schema, table));
      return;
    }
    if (item.toString() === "Collection") {
      let connection = item.parent?.parent?.parent?.label as string;
      let schema = item.parent?.parent?.label as string;
      let table = item.label as string;
      context.subscriptions.push(collectionWeb(connection, schema, table));
      return;
    }
  });
  context.subscriptions.push(treeview);
};

export const iconPath = (iconName: string) => ({
  light: vscode.Uri.joinPath(_iconPath, `light/${iconName}.svg`),
  dark: vscode.Uri.joinPath(_iconPath, `dark/${iconName}.svg`),
});

export default provider;
