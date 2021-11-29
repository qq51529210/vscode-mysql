import { query } from ".";

export const list = async (connection: string): Promise<string[]> => {
  return query(
    (session: any) =>
      session
        .getSchemas()
        .then((schemas: any) => schemas.map((v: any) => v.getName())),
    connection
  );
};

export const add = async (connection: string, name: string) => {
  return query((session: any) => session.createSchema(name), connection);
};

export const remove = async (connection: string, name: string) => {
  return query((session: any) => session.dropSchema(name), connection);
};
