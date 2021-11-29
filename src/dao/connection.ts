import * as vscode from "vscode";

const key = "connections";

let state: vscode.Memento;
let models: string[] = [];

export const init = (context: vscode.ExtensionContext) => {
  state = context.globalState;
  let v = state.get(key);
  if (v) {
    models = v as string[];
  }
};

export const list = () => models;

export const has = (uri: string): boolean =>
  models.findIndex(v => v === uri) !== -1;

export const add = (uri: string): string => {
  if (models.findIndex(v => v === uri) !== -1) {
    return `Connection "${uri}" exists`;
  }
  models.push(uri);
  state.update(key, models);
  return "";
};

export const update = (oldUri: string, newUri: string): string => {
  let i = models.findIndex(v => v === oldUri);
  if (i === -1) {
    return `Connection "${oldUri}" not found`;
  }
  models[i] = newUri;
  state.update(key, models);
  return "";
};

export const remove = (uri: string): string => {
  if (!has(uri)) {
    return `Connection "${uri}" not found`;
  }
  models = models.filter(v => v !== uri);
  state.update(key, models);
  return "";
};
