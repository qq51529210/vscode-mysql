import { TreeItem } from "./item";
import { Schema } from "./schema";
import { list as schemaList } from "../dao/schema";

export class Connection extends TreeItem {
  constructor(label: string) {
    super(label, "connection", "connection");
  }
  async refresh() {
    const names = await schemaList(this.label as string);
    if (names) {
      this.children = names.map(name => new Schema(name, this));
    }
  }
  toString() {
    return "Connection";
  }
}
