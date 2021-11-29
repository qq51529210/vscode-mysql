import * as vscode from "vscode";
import { iconPath } from ".";

export abstract class TreeItem extends vscode.TreeItem {
  public parent?: TreeItem;
  public children: TreeItem[];
  constructor(
    label: string,
    iconName: string,
    context: string,
    parent?: TreeItem
  ) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = context;
    if (iconName) {
      this.iconPath = iconPath(iconName);
    }
    this.parent = parent;
    this.children = [];
  }
  getChildren(): Thenable<TreeItem[]> {
    return Promise.resolve(this.children);
  }
  abstract refresh(): Promise<void>;
  abstract toString(): string;
}
