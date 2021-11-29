import { Request, Response, NextFunction, Router } from "express";
import mockjs = require("mockjs");
import * as db from "../dao";

const router = Router({ mergeParams: true });

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
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
  if (!req.query.table) {
    return res.status(400).json({
      error: "table required",
    });
  }
  if (!req.body.model) {
    return res.status(400).json({
      error: "model required",
    });
  }
  if (!req.body.count) {
    return res.status(400).json({
      error: "count required",
    });
  }
  let result = {
    success: 0,
    fail: 0,
  };
  for (let i = 0; i < req.body.count; i++) {
    let sql = `insert into ${req.query.schema}.${req.query.table}`;
    let col: string[] = [];
    let val: string[] = [];
    let keys = Object.keys(req.body.model);
    keys.forEach(key => {
      col.push(key);
      let v = mockjs.mock(req.body.model[key]);
      if (typeof v === "string") {
        val.push(`'${v}'`);
      } else {
        val.push(v);
      }
    });
    sql += `(${col.join(",")})`;
    sql += " values";
    sql += `(${val.join(",")})`;
    console.log(sql);
    await db
      .exeSQL(sql, req.query.connection as string)
      .then(() => {
        result.success++;
      })
      .catch((err: any) => {
        console.log(err);
        result.fail++;
      });
  }
  res.status(201).json(result);
});

export default router;
