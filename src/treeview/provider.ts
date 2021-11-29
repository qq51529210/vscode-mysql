import * as vscode from "vscode";
import { TreeItem } from "./item";
import { Connection } from "./connection";
import { Schema } from "./schema";
import { Table } from "./table";
import { Collection } from "./collection";
import { list as connectionList } from "../dao/connection";

export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  private children: TreeItem[] = [];
  private _onDidChangeTreeData = new vscode.EventEmitter<
    TreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData: vscode.Event<
    TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;
  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }
  getChildren(element?: TreeItem): vscode.ProviderResult<TreeItem[]> {
    if (!element) {
      return Promise.resolve(this.children);
    }
    return element.getChildren();
  }
  getParent(element: TreeItem): vscode.ProviderResult<TreeItem> {
    return element.parent;
  }
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  init() {
    this.children = connectionList().map(v => new Connection(v));
  }
  addConnection(uri: string) {
    this.children.push(new Connection(uri));
    this.refresh();
  }
  updateConnection(oldUri: string, newUri: string) {
    let i = this.children.findIndex(v => v.label === oldUri);
    if (i === -1) {
      return;
    }
    let _connection = this.children[i];
    _connection.label = newUri;
    this.refresh();
  }
  removeConnection(uri: string) {
    this.children = this.children.filter(v => v.label !== uri);
    this.refresh();
  }
  addSchema(connection: string, name: string) {
    let i = this.children.findIndex(v => v.label === connection);
    if (i === -1) {
      return;
    }
    let _connection = this.children[i];
    _connection.children.push(new Schema(name, this.children[i]));
    this.refresh();
  }
  removeSchema(connection: string, name: string) {
    let i = this.children.findIndex(v => v.label === connection);
    if (i === -1) {
      return;
    }
    let _connection = this.children[i];
    _connection.children = _connection.children.filter(v => v.label !== name);
    this.refresh();
  }
  addTable(connection: string, schema: string, name: string) {
    let i = this.children.findIndex(v => v.label === connection);
    if (i === -1) {
      return;
    }
    let _connection = this.children[i];
    i = _connection.children.findIndex(v => v.label === schema);
    if (i === -1) {
      return;
    }
    let _schema = _connection.children[i];
    let _tables = _schema.children[0];
    _tables.children.push(new Table(name, _schema.children[0]));
    this.refresh();
  }
  updateTable(
    connection: string,
    schema: string,
    table: string,
    newName: string
  ) {
    let i = this.children.findIndex(v => v.label === connection);
    if (i === -1) {
      return;
    }
    let _connection = this.children[i];
    i = _connection.children.findIndex(v => v.label === schema);
    if (i === -1) {
      return;
    }
    let _schema = _connection.children[i];
    let _tables = _schema.children[0];
    i = _tables.children.findIndex(v => v.label === table);
    if (i === -1) {
      return;
    }
    let _table = _tables.children[i];
    _table.label = newName;
    this.refresh();
  }
  removeTable(connection: string, schema: string, name: string) {
    let i = this.children.findIndex(v => v.label === connection);
    if (i === -1) {
      return;
    }
    let _connection = this.children[i];
    i = _connection.children.findIndex(v => v.label === schema);
    if (i === -1) {
      return;
    }
    let _schema = _connection.children[i];
    let _tables = _schema.children[0];
    _tables.children = _tables.children.filter(v => v.label !== name);
    this.refresh();
  }
  addCollection(connection: string, schema: string, name: string) {
    let i = this.children.findIndex(v => v.label === connection);
    if (i === -1) {
      return;
    }
    let _connection = this.children[i];
    i = _connection.children.findIndex(v => v.label === schema);
    if (i === -1) {
      return;
    }
    let _schema = _connection.children[i];
    let _collections = _schema.children[1];
    _collections.children.push(new Collection(name, _schema.children[0]));
    this.refresh();
  }
  removeCollection(connection: string, schema: string, name: string) {
    let i = this.children.findIndex(v => v.label === connection);
    if (i === -1) {
      return;
    }
    let _connection = this.children[i];
    i = _connection.children.findIndex(v => v.label === schema);
    if (i === -1) {
      return;
    }
    let _schema = _connection.children[i];
    let _collections = _schema.children[1];
    _collections.children = _collections.children.filter(v => v.label !== name);
    this.refresh();
  }
}
