import { query } from ".";

export const list = async (
  connection: string,
  schema: string
): Promise<string[]> => {
  return query(
    (session: any) =>
      session
        .getSchema(schema)
        .getCollections()
        .then((collections: any) => collections.map((v: any) => v.getName())),
    connection
  );
};

export const add = async (connection: string, schema: string, name: string) => {
  return query(
    (session: any) => session.getSchema(schema).createCollection(name),
    connection
  );
};

export const remove = async (
  connection: string,
  schema: string,
  name: string
) => {
  return query(
    (session: any) => session.getSchema(schema).dropCollection(name),
    connection
  );
};
