import * as vscode from "vscode";
import { TreeItem } from "./item";
import { Table } from "./table";
import { Collection } from "./collection";
import { list as tableList } from "../dao/table";
import { list as collectionList } from "../dao/collections";

export class Schema extends TreeItem {
  constructor(label: string, parent: TreeItem) {
    super(label, "schema", "schema", parent);
    this.children = [new Tables(this), new Collections(this)];
  }
  async refresh() {}
  toString() {
    return "Schema";
  }
}

class Tables extends TreeItem {
  constructor(parent: TreeItem) {
    super("tables", "", "tables", parent);
  }
  async refresh() {
    let connection = this.parent?.parent?.label as string;
    let schema = this.parent?.label as string;
    const names = await tableList(connection, schema);
    if (names) {
      this.children = names.map(name => new Table(name, this));
    }
  }
  toString() {
    return "Tables";
  }
}

class Collections extends TreeItem {
  constructor(parent: TreeItem) {
    super("collections", "", "collections", parent);
  }
  async refresh() {
    let connection = this.parent?.parent?.label as string;
    let schema = this.parent?.label as string;
    const names = await collectionList(connection, schema);
    if (names) {
      this.children = names.map(name => new Collection(name, this));
    }
  }
  toString() {
    return "Collections";
  }
}
