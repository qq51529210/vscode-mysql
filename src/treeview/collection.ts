import * as vscode from "vscode";
import { TreeItem } from "./item";

export class Collection extends TreeItem {
  constructor(label: string, parent: TreeItem) {
    super(label, "collection", "collection", parent);
    this.collapsibleState = vscode.TreeItemCollapsibleState.None;
  }
  async refresh() {}
  toString() {
    return "Collection";
  }
}
