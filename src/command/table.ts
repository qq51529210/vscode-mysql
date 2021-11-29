import * as vscode from "vscode";
import treeview from "../treeview";
import { TreeItem } from "../treeview/item";
import { panel as addPanel } from "../webview/add-table";
import { panel as editPanel } from "../webview/edit-table";
import { panel as mockPanel } from "../webview/mock";
import { remove as removeTable } from "../dao/table";
import { onError } from ".";

export const refresh = () =>
  vscode.commands.registerCommand("mysql.refreshTables", (...args: any[]) => {
    let item = args[0] as TreeItem;
    item
      .refresh()
      .then(() => {
        treeview.refresh();
      })
      .catch((err: Error) => {
        vscode.window.showErrorMessage(err.message);
      });
  });

export const add = (context: vscode.ExtensionContext) =>
  vscode.commands.registerCommand("mysql.addTable", async (...args: any[]) => {
    let item = args[0] as TreeItem;
    let connection = item.parent?.parent?.label as string;
    let schema = item.parent?.label as string;
    const panel = addPanel(connection, schema);
    panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case "ok":
            treeview.addTable(connection, schema, message.text);
            vscode.window.showInformationMessage(message.text);
            return;
        }
      },
      undefined,
      context.subscriptions
    );
    context.subscriptions.push(panel);
  });

export const edit = (context: vscode.ExtensionContext) =>
  vscode.commands.registerCommand("mysql.editTable", async (...args: any[]) => {
    if (!args.length) {
      return;
    }
    let item = args[0] as TreeItem;
    let connection = item.parent?.parent?.parent?.label as string;
    let schema = item.parent?.parent?.label as string;
    let table = item.label as string;
    const panel = editPanel(connection, schema, table);
    panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case "ok":
            treeview.updateTable(connection, schema, table, message.text);
            vscode.window.showInformationMessage(message.text);
            return;
        }
      },
      undefined,
      context.subscriptions
    );
    context.subscriptions.push(panel);
  });

export const remove = () =>
  vscode.commands.registerCommand(
    "mysql.removeTable",
    async (...args: any[]) => {
      let item = args[0] as TreeItem;
      let table = item.label as string;
      if (
        (await vscode.window.showInputBox({
          placeHolder: `Input ${table} to confirm`,
        })) !== table
      ) {
        vscode.window.showInformationMessage(`Remove table ${table} cancel`);
        return;
      }
      let connection = item.parent?.parent?.parent?.label as string;
      let schema = item.parent?.parent?.label as string;
      removeTable(connection, schema, table)
        .then(() => {
          treeview.removeTable(connection, schema, table);
          vscode.window.showInformationMessage(`Remove table ${table} success`);
        })
        .catch(onError);
    }
  );

export const mock = (context: vscode.ExtensionContext) =>
  vscode.commands.registerCommand("mysql.mockTable", async (...args: any[]) => {
    if (!args.length) {
      return;
    }
    let item = args[0] as TreeItem;
    let connection = item.parent?.parent?.parent?.label as string;
    let schema = item.parent?.parent?.label as string;
    let table = item.label as string;
    const panel = mockPanel(connection, schema, table);
    panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case "ok":
            treeview.updateTable(connection, schema, table, message.text);
            vscode.window.showInformationMessage(message.text);
            return;
        }
      },
      undefined,
      context.subscriptions
    );
    context.subscriptions.push(panel);
  });
