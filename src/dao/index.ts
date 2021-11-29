const mysqlx = require("@mysql/xdevapi");

export const query = async (
  cb: (session: any) => Promise<any>,
  connection: string,
  schema?: string
) => {
  const session = await getSession(connection, schema);
  try {
    return await cb(session);
  } catch (err) {
    return Promise.reject(err);
  } finally {
    session.close();
  }
};

export const transaction = async (
  sqls: string[],
  connection: string,
  schema?: string
) => {
  const session = await getSession(connection, schema);
  try {
    await session.startTransaction();
    let results = await Promise.all(sqls.map(v => session.sql(v).execute()));
    await session.commit();
    return results.map(fmtResult);
  } catch (error) {
    await session.rollback();
    return Promise.reject(error);
  } finally {
    session.close();
  }
};

export const exeSQL = async (
  sql: string,
  connection: string,
  schema?: string
) => {
  return query(
    async (session: any) => fmtResult(await session.sql(sql).execute()),
    connection,
    schema
  );
};

export const getSession = async (
  uri: string,
  schema?: string
): Promise<any> => {
  let session = await mysqlx.getSession(uri);
  if (schema) {
    await session.sql(`use ${schema}`).execute();
  }
  return session;
};

export const fmtResult = (result: any): any => ({
  columns: result.getColumns().map((v: any) => v.getColumnName()),
  rows: result.fetchAll(),
});
