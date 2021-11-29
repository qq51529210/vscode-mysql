import * as vscode from "vscode";
import treeview from "../treeview";
import { TreeItem } from "../treeview/item";

import {
  remove as removeConnection,
  add as addConnection,
  update as updateConnection,
} from "../dao/connection";

export const refresh = () =>
  vscode.commands.registerCommand("mysql.refreshConnections", () => {
    treeview.init();
    treeview.refresh();
  });

export const add = () =>
  vscode.commands.registerCommand("mysql.addConnection", async () => {
    let uri = await vscode.window.showInputBox({
      value: "root@localhost:33060",
      placeHolder: "user:password@host:port",
    });
    if (!uri) {
      return;
    }
    let error = addConnection(uri);
    if (error) {
      vscode.window.showErrorMessage(error);
      return;
    }
    treeview.addConnection(uri);
    vscode.window.showInformationMessage(`Add connection ${uri} success`);
  });

export const edit = () =>
  vscode.commands.registerCommand(
    "mysql.editConnection",
    async (...args: any[]) => {
      let item = args[0] as TreeItem;
      let oldUri = item.label as string;
      let uri = await vscode.window.showInputBox({
        value: oldUri,
        placeHolder: "user:password@host:port",
      });
      if (!uri || uri === oldUri) {
        return;
      }
      let error = updateConnection(oldUri, uri);
      if (error) {
        vscode.window.showErrorMessage(error);
        return;
      }
      treeview.updateConnection(oldUri, uri);
      vscode.window.showInformationMessage(
        `Update connection ${oldUri} to ${uri} success`
      );
    }
  );

export const remove = () =>
  vscode.commands.registerCommand(
    "mysql.removeConnection",
    (...args: any[]) => {
      let item = args[0] as TreeItem;
      let uri = item.label as string;
      if (!removeConnection(uri)) {
        treeview.removeConnection(uri);
        vscode.window.showInformationMessage(
          `Remove connection ${uri} success`
        );
        return;
      }
      vscode.window.showErrorMessage(`Remove connection "${uri}" fail`);
    }
  );
