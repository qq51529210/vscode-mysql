import { query, exeSQL } from ".";

export const list = async (
  connection: string,
  schema: string
): Promise<string[]> => {
  return query(
    (session: any) =>
      session
        .getSchema(schema)
        .getTables()
        .then((tables: any) => tables.map((v: any) => v.getName())),
    connection
  );
};

export const remove = async (
  connection: string,
  schema: string,
  table: string
): Promise<string[]> => {
  return exeSQL(`drop table ${schema}.${table}`, connection);
};
