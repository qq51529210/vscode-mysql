import * as vscode from "vscode";
import treeview from "../treeview";
import { TreeItem } from "../treeview/item";
import * as db from "../dao/collections";
import { onError } from ".";

export const refresh = () =>
  vscode.commands.registerCommand(
    "mysql.refreshCollections",
    (...args: any[]) => {
      let item = args[0] as TreeItem;
      item
        .refresh()
        .then(() => {
          treeview.refresh();
        })
        .catch((err: Error) => {
          vscode.window.showErrorMessage(err.message);
        });
    }
  );

export const add = () =>
  vscode.commands.registerCommand(
    "mysql.addCollection",
    async (...args: any[]) => {
      let name = (await vscode.window.showInputBox({
        placeHolder: "Input New Collection Name",
      })) as string;
      if (!name) {
        return;
      }
      let item = args[0] as TreeItem;
      let connection = item.parent?.parent?.label as string;
      let schema = item.parent?.label as string;
      db.add(connection, schema, name)
        .then(() => {
          treeview.addCollection(connection, schema, name);
          vscode.window.showInformationMessage(
            `Add collection ${name} success`
          );
        })
        .catch(onError);
    }
  );

export const remove = () =>
  vscode.commands.registerCommand(
    "mysql.removeCollection",
    async (...args: any[]) => {
      let item = args[0] as TreeItem;
      let collection = item.label as string;
      if (
        (await vscode.window.showInputBox({
          placeHolder: `Input ${item.label} to confirm`,
        })) !== collection
      ) {
        vscode.window.showInformationMessage(
          `Remove collection ${item.label} cancel`
        );
        return;
      }
      let connection = item.parent?.parent?.parent?.label as string;
      let schema = item.parent?.parent?.label as string;
      db.remove(connection, schema, collection)
        .then(() => {
          treeview.removeCollection(connection, schema, collection);
          vscode.window.showInformationMessage(
            `Remove collection "${item.label}" success`
          );
        })
        .catch(onError);
    }
  );
