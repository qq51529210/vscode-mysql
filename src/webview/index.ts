import * as vscode from "vscode";
import { port as serverPort } from "../http";

export const newRows = (connection: string, schema: string, table: string) => {
  const panel = vscode.window.createWebviewPanel(
    "table",
    table,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );
  let port = serverPort();
  panel.webview.html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
    <script type="module" crossorigin src="http://localhost:${port}/table.js"></script>
    <link rel="modulepreload" href="http://localhost:${port}/vendor.js">
    <link rel="stylesheet" href="http://localhost:${port}/assets/vendor.css">
    <link rel="stylesheet" href="http://localhost:${port}/assets/table.css">
  </head>
  <body>
    <div id="app" connection="${connection}" schema="${schema}" table="${table}"></div>
    
    <script>
      function localServerPort() {
        return ${port};
      }
    </script>
  </body>
</html>
  `;
  return panel;
};
