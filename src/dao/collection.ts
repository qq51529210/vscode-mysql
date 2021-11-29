import { query } from ".";

export const list = async (
  connection: string,
  schema: string,
  name: string,
  offset: number,
  count: number
) => {
  return query((session: any) => {
    let collection = session.getSchema(schema).getCollection(name);
    return Promise.all([
      collection.find().offset(offset).limit(count).execute(),
      collection.count(),
    ]);
  }, connection);
};

export const find = async (
  connection: string,
  schema: string,
  name: string,
  search: string
) => {
  return query(
    (session: any) =>
      session.getSchema(schema).getCollection(name).find(search).execute(),
    connection
  );
};

export const add = async (
  connection: string,
  schema: string,
  name: string,
  data: any
) => {
  return query(
    (session: any) =>
      session.getSchema(schema).getCollection(name).add(data).execute(),
    connection
  );
};

export const update = async (
  connection: string,
  schema: string,
  name: string,
  id: string,
  data: any
) => {
  return query(
    (session: any) =>
      session.getSchema(schema).getCollection(name).replaceOne(id, data),
    connection
  );
};

export const remove = async (
  connection: string,
  schema: string,
  name: string,
  id: string
) => {
  return query(
    (session: any) =>
      session.getSchema(schema).getCollection(name).removeOne(id),
    connection
  );
};
