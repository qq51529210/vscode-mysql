import * as vscode from "vscode";
import treeview from "../treeview";
import { TreeItem } from "../treeview/item";
import * as db from "../dao/schema";
import { onError } from ".";
import { panel as sqlPanel } from "../webview/sql";
import { panel as codePanel } from "../webview/gen-code";

export const refresh = () =>
  vscode.commands.registerCommand("mysql.refreshSchemas", (...args: any[]) => {
    let item = args[0] as TreeItem;
    item
      .refresh()
      .then(() => {
        treeview.refresh();
      })
      .catch(onError);
  });

export const add = () =>
  vscode.commands.registerCommand("mysql.addSchema", async (...args: any[]) => {
    let name = await vscode.window.showInputBox({
      placeHolder: "Input New Schema Name",
    });
    if (!name) {
      return;
    }
    let item = args[0] as TreeItem;
    let connection = item.label as string;
    db.add(connection, name)
      .then(() => {
        treeview.addSchema(connection, name as string);
        vscode.window.showInformationMessage(`Add schema ${name} success`);
      })
      .catch(onError);
  });

export const remove = () =>
  vscode.commands.registerCommand(
    "mysql.removeSchema",
    async (...args: any[]) => {
      let item = args[0] as TreeItem;
      let schema = item.label as string;
      if (
        (await vscode.window.showInputBox({
          placeHolder: `Input ${schema} to confirm`,
        })) !== schema
      ) {
        vscode.window.showInformationMessage(`Remove schema ${schema} cancel`);
        return;
      }
      let connection = item.parent?.label as string;
      db.remove(connection, schema)
        .then(() => {
          treeview.removeSchema(connection, schema);
          vscode.window.showInformationMessage(
            `Remove schema ${schema} success`
          );
        })
        .catch(onError);
    }
  );

export const sql = (context: vscode.ExtensionContext) =>
  vscode.commands.registerCommand("mysql.sql", async (...args: any[]) => {
    let item = args[0] as TreeItem;
    let connection = item.parent?.label as string;
    let schema = item?.label as string;
    const panel = sqlPanel(connection, schema);
    context.subscriptions.push(panel);
  });

export const genCode = (context: vscode.ExtensionContext) =>
  vscode.commands.registerCommand("mysql.genCode", async (...args: any[]) => {
    let item = args[0] as TreeItem;
    let connection = item.parent?.label as string;
    let schema = item?.label as string;
    const panel = codePanel(connection, schema);
    context.subscriptions.push(panel);
  });
