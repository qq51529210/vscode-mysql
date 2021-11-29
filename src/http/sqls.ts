import { Request, Response, NextFunction, Router } from "express";
import * as db from "../dao";

interface PostModel {
  sqls: string[];
  connection: string;
  schema?: string;
}

const router = Router({ mergeParams: true });

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  let data = req.body as PostModel;
  if (!data.connection) {
    return res.status(400).json({
      error: "connection required",
    });
  }
  if (!data.sqls) {
    return res.status(400).json({
      error: "sqls required",
    });
  }
  db.transaction(data.sqls, data.connection, data.schema)
    .then((result: any) => {
      res.status(201).json(result);
    })
    .catch(next);
});

export default router;
