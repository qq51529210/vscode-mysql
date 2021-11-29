///<reference path="../vscode.d.ts"/>

import axios from "axios";

export interface SqlResult {
  columns: string[];
  rows: any[][];
}

export const toTableRows = (res: SqlResult) => {
  return res.rows.map(r => {
    let row = {};
    res.columns.forEach((c, i) => {
      if (!c) {
        c = `column_${i}`;
      }
      row[c] = r[i];
    });
    return row;
  });
};

export class Client {
  private client = axios.create({
    baseURL: "http://localhost:" + localServerPort(),
    timeout: 5000,
  });
  async get(url: string, params?: any) {
    const res = await this.client.get(url, {
      params: params,
      validateStatus: (v: number) => v === 200,
    });
    return res.data;
  }
  async post(url: string, data: any, params?: any) {
    const res = await this.client.post(url, data, {
      params: params,
      validateStatus: (v: number) => v === 201,
    });
    return res.data ? res.data : true;
  }
  async patch(url: string, data: any, params?: any) {
    const res = await this.client.patch(url, data, {
      params: params,
      validateStatus: (v: number) => v === 204,
    });
    return res.data ? res.data : true;
  }
  async delete(url: string, params?: any) {
    await this.client.delete(url, {
      params: params,
      validateStatus: (v: number) => v === 204,
    });
    return true;
  }
  async sql(
    sqsl: string[],
    connection: string,
    schema?: string
  ): Promise<SqlResult[]> {
    let res = await this.post("/sqls", {
      connection: connection,
      schema: schema,
      sqls: sqsl,
    });
    return res;
  }
}

const client = new Client();

export default client;
