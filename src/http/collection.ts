import { Request, Response, NextFunction, Router } from "express";
import * as db from "../dao/collection";

const router = Router({ mergeParams: true });

const check = (req: Request, res: Response, next: NextFunction) => {
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
  next();
};

router.get(
  "/",
  check,
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.query.search) {
      db.find(
        req.query.connection as string,
        req.query.schema as string,
        req.params.collection,
        String(req.query.search)
      )
        .then((result: any) => {
          res.json({
            data: result.fetchAll(),
          });
        })
        .catch(next);
    } else {
      db.list(
        req.query.connection as string,
        req.query.schema as string,
        req.params.collection,
        Number(req.query.offset),
        Number(req.query.count)
      )
        .then((results: any) => {
          res.json({
            data: results[0].fetchAll(),
            count: results[1],
          });
        })
        .catch(next);
    }
  }
);

router.post(
  "/",
  check,
  async (req: Request, res: Response, next: NextFunction) => {
    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        error: "data required",
      });
    }
    db.add(
      req.query.connection as string,
      req.query.schema as string,
      req.params.collection,
      req.body
    )
      .then(() => {
        res.status(201).send();
      })
      .catch(next);
  }
);

router.patch(
  "/:id",
  check,
  async (req: Request, res: Response, next: NextFunction) => {
    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        error: "data required",
      });
    }
    db.update(
      req.query.connection as string,
      req.query.schema as string,
      req.params.collection,
      req.params.id,
      req.body
    )
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  }
);

router.delete(
  "/:id",
  check,
  async (req: Request, res: Response, next: NextFunction) => {
    db.remove(
      req.query.connection as string,
      req.query.schema as string,
      req.params.collection,
      req.params.id
    )
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  }
);

export default router;
