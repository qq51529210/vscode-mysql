import * as express from "express";
import * as http from "http";
import * as net from "net";
import * as vscode from "vscode";
import * as path from "path";
import sqls from "./sqls";
import mock from "./mock";
import msg from "./msg";
import table from "./table";
import collection from "./collection";

const app = express();

const server = http.createServer(app);

export const listen = (context: vscode.ExtensionContext) => {
  return new Promise<void>((res, rej) => {
    server
      .on("listening", () => {
        // logger
        app.use(
          (
            req: express.Request,
            res: express.Response,
            next: express.NextFunction
          ) => {
            console.log(`${req.method}: ${req.url}`);
            next();
          }
        );
        // cors
        app.use(
          (
            req: express.Request,
            res: express.Response,
            next: express.NextFunction
          ) => {
            res.set({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              "Access-Control-Allow-Origin": "*",
              // eslint-disable-next-line @typescript-eslint/naming-convention
              "Access-Control-Allow-Methods": "OPTIONS,GET,PATCH,POST,DELETE",
              // eslint-disable-next-line @typescript-eslint/naming-convention
              "Access-Control-Allow-Headers": "*",
            });
            if (req.method === "OPTIONS") {
              res.status(200).send();
              return;
            }
            next();
          }
        );
        // static
        app.use(
          express.static(path.join(context.extensionPath, "dist", "web"))
        );
        // parse json
        app.use(express.json());
        // api router
        app.use("/sqls", sqls);
        app.use("/mock", mock);
        app.use("/msgs", msg);
        app.use("/tables", table);
        app.use("/collections/:collection", collection);
        // err
        app.use(
          (
            err: any,
            req: express.Request,
            res: express.Response,
            next: express.NextFunction
          ) => {
            console.log(typeof err, err);
            res.status(500).json({ error: err.message ? err.message : err });
          }
        );
        // 404
        app.use(
          (
            req: express.Request,
            res: express.Response,
            next: express.NextFunction
          ) => {
            res
              .status(404)
              .send(req.method + ": " + req.baseUrl + " not found");
          }
        );
        res();
      })
      .on("error", err => {
        rej(err);
      })
      .listen(33966, "localhost");
  });
};

export const port = () => {
  let addr = server.address() as net.AddressInfo;
  return addr.port;
};

export function close() {
  return new Promise<void>((res, rej) => {
    server
      .on("close", () => {
        res();
      })
      .on("error", err => {
        rej(err);
      })
      .close();
  });
}
