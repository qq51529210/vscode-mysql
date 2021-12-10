export class Table {
  name = "";
  columns = new Array<Column>();
  constructor(name: string) {
    this.name = name;
  }
}

export class Column {
  name = "";
  type = "";
  default = "";
  comment = "";
  primary = false;
  unique = false;
  mulUnique = false;
  increment = false;
  nullable = false;
}

export const snakeCaseToPascalCase = (s: string): string => {
  if (s === "") {
    return "";
  }
  let str = "";
  let c1 = s.charCodeAt(0);
  // 'a' - 'z'
  if (c1 >= 97 && c1 <= 122) {
    c1 = c1 - 97 + 65;
  }
  str += String.fromCharCode(c1);
  for (let i = 1; i < s.length; i++) {
    c1 = s.charCodeAt(i);
    // '_'
    if (c1 === 95) {
      i++;
      if (i === s.length) {
        break;
      }
      c1 = s.charCodeAt(i);
      // 'a' - 'z'
      if (c1 >= 97 && c1 <= 122) {
        c1 = c1 - 97 + 65;
      }
    }
    str += String.fromCharCode(c1);
  }
  return str;
};

export const pascalCaseToSnakeCase = (s: string): string => {
  if (s === "") {
    return "";
  }
  let str = "";
  let c1 = s.charCodeAt(0);
  // 'A' - 'Z'
  if (c1 >= 65 && c1 <= 90) {
    c1 = c1 - 65 + 97;
  }
  str += String.fromCharCode(c1);
  for (let i = 1; i < s.length; i++) {
    c1 = s.charCodeAt(i);
    // 'A' - 'Z'
    if (c1 >= 65 && c1 <= 90) {
      str += "_";
      c1 = c1 - 65 + 97;
    }
    str += String.fromCharCode(c1);
  }
  return str;
};

export const pascalCaseToCamelCase = (s: string): string => {
  if (s === "") {
    return "";
  }
  let c1 = s.charCodeAt(0);
  // 'A' - 'Z'
  if (c1 >= 65 && c1 <= 90) {
    c1 = c1 - 65 + 97;
  }
  return String.fromCharCode(c1) + s.slice(1);
};

export const snakeCaseToCamelCase = (s: string): string => {
  return pascalCaseToCamelCase(snakeCaseToPascalCase(s));
};
