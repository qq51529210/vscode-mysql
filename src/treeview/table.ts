import * as vscode from "vscode";
import { TreeItem } from "./item";

export class Table extends TreeItem {
  constructor(label: string, parent: TreeItem) {
    super(label, "table", "table", parent);
    this.collapsibleState = vscode.TreeItemCollapsibleState.None;
  }
  async refresh() {}
  toString() {
    return "Table";
  }
}
