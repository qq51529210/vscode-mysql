import { format } from "sql-formatter";
import { ElMessage, ElMessageBox, ElLoading } from "element-plus";

export class AppProps {
  connection = "";
  schema = "";
  table = "";
  init() {
    let dom = document.getElementById("app");
    let value = dom?.getAttribute("connection");
    if (value) {
      this.connection = value;
    }
    value = dom?.getAttribute("schema");
    if (value) {
      this.schema = value;
    }
    value = dom?.getAttribute("table");
    if (value) {
      this.table = value;
    }
  }
}

export const alertSuccess = (message: string) => {
  ElMessageBox.alert(message, "Success", {
    type: "success",
    center: true,
  });
};

export const alertError = (message: string) => {
  ElMessageBox.alert(message, "Error", {
    type: "error",
    center: true,
  });
};

export const successMessage = (message: string) => {
  ElMessage({ type: "success", message: message });
};

export const errorMessage = (message: string) => {
  ElMessage({ type: "error", message: message });
};

export const formatSQL = (sql: string) => {
  return format(sql, {
    language: "mysql",
    uppercase: true,
    linesBetweenQueries: 2,
  });
};

export const newLoading = () => {
  return ElLoading.service({
    lock: true,
    text: "Loading",
    background: "rgba(0, 0, 0, 0.7)",
  });
};

export const loading = async (func: () => Promise<any>) => {
  const load = newLoading();
  try {
    return await func();
  } catch (err: any) {
    if (err.response) {
      alertError(err.response.data.error);
    } else {
      console.log(err);
      errorMessage("Network Error");
    }
  } finally {
    load.close();
  }
};
