import { Request, Response, NextFunction, Router } from "express";
import * as db from "../dao/table";

const router = Router({ mergeParams: true });

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  if (!req.query.connection) {
    return res.status(400).json({
      error: "connection required",
    });
  }
  if (!req.query.schema) {
    return res.status(400).json({
      error: "schema required",
    });
  }
  db.list(req.query.connection as string, req.query.schema as string)
    .then((names: string[]) => {
      res.json(names);
    })
    .catch(next);
});

export default router;
