import { Request, Response, NextFunction, Router } from "express";
import treeview from "../treeview";

interface PostModel {
  command: string;
  data: any;
}

const router = Router({ mergeParams: true });

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  let data = req.body as PostModel;
  if (!data.command) {
    return res.status(400).json({
      error: "command required",
    });
  }
  switch (data.command) {
    case "add table":
      treeview.addTable(
        data.data.connection,
        data.data.schema,
        data.data.table
      );
      break;
    case "edit table":
      treeview.updateTable(
        data.data.connection,
        data.data.schema,
        data.data.table,
        data.data.newName
      );
      break;
    default:
      return res.status(400).json({ error: "invalid command" });
  }
  res.status(201).json();
});

export default router;
