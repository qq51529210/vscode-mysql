import * as vscode from "vscode";
import * as connection from "./connection";
import * as schema from "./schema";
import * as table from "./table";
import * as collection from "./collection";

export const init = (context: vscode.ExtensionContext) => {
  context.subscriptions.push(connection.refresh());
  context.subscriptions.push(connection.add());
  context.subscriptions.push(connection.edit());
  context.subscriptions.push(connection.remove());
  context.subscriptions.push(schema.refresh());
  context.subscriptions.push(schema.add());
  context.subscriptions.push(schema.remove());
  context.subscriptions.push(schema.sql(context));
  context.subscriptions.push(schema.genCode(context));
  context.subscriptions.push(table.refresh());
  context.subscriptions.push(table.add(context));
  context.subscriptions.push(table.edit(context));
  context.subscriptions.push(table.mock(context));
  context.subscriptions.push(table.remove());
  context.subscriptions.push(collection.refresh());
  context.subscriptions.push(collection.add());
  context.subscriptions.push(collection.remove());
};

export const onError = (err: Error) => {
  vscode.window.showErrorMessage(err.message);
};
