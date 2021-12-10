import {
  Table,
  Column,
  snakeCaseToPascalCase,
  snakeCaseToCamelCase,
  pascalCaseToSnakeCase,
} from "..";

class Stmt {
  name = "";
  sql = "";
  constructor(name: string, sql: string) {
    this.name = name;
    this.sql = sql;
  }
}

class StmtFunc {
  stmt = "";
  sql = "";
  text = "";
}

class QueryField {
  nullName = "";
  nullType = "";
  name = "";
  type = "";
  scan = "";
  nullAssign(tab: string) {
    let str = "\t" + tab;
    str += `if ${this.nullName}.Valid {`;
    str += "\n\t\t" + tab;
    if (this.type === "sql.NullInt64") {
      str += `${this.name} = ${this.type}(${this.nullName}.Int64)`;
    } else if (this.type === "sql.NullFloat64") {
      str += `${this.name} = ${this.type}(${this.nullName}.Float64)`;
    } else {
      str += `${this.name} = ${this.nullName}.String`;
    }
    str += "\n\t" + tab + "}";
    return str;
  }
}

const initQueryFields = (col: Column[], name: string) => {
  return col.map(v => {
    let f = new QueryField();
    f.name = `${name}.${snakeCaseToPascalCase(v.name)}`;
    f.type = goType(v.type);
    if (v.nullable) {
      f.nullName = `${snakeCaseToCamelCase(v.name)}`;
      if (f.type.indexOf("int") !== -1) {
        f.nullType = "sql.NullInt64";
      } else if (f.type.indexOf("float") !== -1) {
        f.nullType = "sql.NullFloat64";
      } else {
        f.nullType = "sql.NullString";
      }
      f.scan = "&" + f.nullName;
    } else {
      f.scan = "&" + f.name;
    }
    return f;
  });
};

export const genCode = (schema: string, table: Table): string => {
  //
  let struct = snakeCaseToPascalCase(table.name);
  let execFunc: StmtFunc[] = [];
  let stmt: Stmt[] = [];
  execFunc = genSelect(struct, table, execFunc);
  execFunc = genInsert(struct, table, execFunc);
  execFunc = genUpdate(struct, table, execFunc);
  execFunc = genDelete(struct, table, execFunc);
  stmt = execFunc.map(v => new Stmt(v.stmt, v.sql));
  //
  let str = `package ${pascalCaseToSnakeCase(schema)}

import (
    "database/sql"
    "strings"
)

${genInitStmt(struct, stmt)}

type ${struct} {
  ${genFields(table)}
}

${genSelectPage(struct, table)}

`;
  //
  execFunc.forEach(v => {
    str += v.text;
    str += "\n\n";
  });
  //
  return str;
};

const genFields = (table: Table): string => {
  let str = "";
  table.columns.forEach(v => {
    str += "\t";
    str += snakeCaseToPascalCase(v.name);
    str += " ";
    str += goType(v.type);
    str += " `";
    str += `json:"${snakeCaseToCamelCase(v.name)}"`;
    str += "`";
    str += "\n";
  });
  return str;
};

const genInsert = (struct: string, table: Table, funcs: StmtFunc[]) => {
  let nc = table.columns.filter(v => !v.increment);
  let func = new StmtFunc();
  func.sql = `insert into ${table.name} (${nc.map(v => v.name).join(",")})`;
  func.sql += ` values (${nc.map(() => "?").join(",")})`;
  func.stmt = `stmt${struct}Insert`;
  func.text = `// ${func.sql}`;
  func.text += "\n";
  func.text += `func (t *${struct}) Insert(){
    return ${func.stmt}.Exec(
`;
  nc.forEach(v => {
    func.text += "\t\t";
    func.text += `t.${snakeCaseToPascalCase(v.name)},`;
    func.text += "\n";
  });
  func.text += "\t)\n}";
  funcs.push(func);
  return funcs;
};

const genUpdate = (struct: string, table: Table, funcs: StmtFunc[]) => {
  let kc: Column[] = table.columns.filter(v => v.primary || v.unique);
  kc.forEach(v => {
    funcs = genUpdateBy(
      struct,
      table,
      funcs,
      table.columns.filter(c => !c.increment && c !== v),
      v
    );
  });
  return funcs;
};

const genUpdateBy = (
  struct: string,
  table: Table,
  funcs: StmtFunc[],
  nc: Column[],
  kc: Column
) => {
  let kcField = snakeCaseToPascalCase(kc.name);
  let func = new StmtFunc();
  func.sql = `udpate ${table.name} set `;
  func.sql += nc.map(v => `${v.name}=?`).join(",");
  func.sql += ` where ${kc.name}=?`;
  func.stmt = `stmt${struct}UpdateBy${kcField}`;
  func.text = `// ${func.sql}`;
  func.text += "\n";
  func.text += `func (t *${struct}) UpdateBy${kcField}(){
    return ${func.stmt}.Exec(
`;
  nc.forEach(v => {
    func.text += "\t\t";
    func.text += `t.${snakeCaseToPascalCase(v.name)},`;
    func.text += "\n";
  });
  func.text += "\t\t";
  func.text += `t.${kcField},`;
  func.text += "\n";
  func.text += "\t)\n}";
  funcs.push(func);
  return funcs;
};

const genDelete = (struct: string, table: Table, funcs: StmtFunc[]) => {
  let kc: Column[] = table.columns.filter(v => v.primary || v.unique);
  kc.forEach(v => {
    funcs = genDeleteBy(struct, table, funcs, v);
  });
  return funcs;
};

const genDeleteBy = (
  struct: string,
  table: Table,
  funcs: StmtFunc[],
  kc: Column
) => {
  let kcField = snakeCaseToPascalCase(kc.name);
  let func = new StmtFunc();
  func.sql = `delete from ${table.name}`;
  func.sql += ` where ${kc.name}=?`;
  func.stmt = `stmt${struct}DeleteBy${kcField}`;
  func.text = `// ${func.sql}`;
  func.text += "\n";
  func.text += `func (t *${struct}) DeleteBy${kcField}(){
    return ${func.stmt}.Exec(t.${kcField})
}`;
  funcs.push(func);
  return funcs;
};

const genSelect = (struct: string, table: Table, funcs: StmtFunc[]) => {
  let kc: Column[] = table.columns.filter(v => v.primary || v.unique);
  kc.forEach(v => {
    funcs = genSelectBy(struct, table, funcs, v);
  });
  return funcs;
};

const genSelectBy = (
  struct: string,
  table: Table,
  funcs: StmtFunc[],
  kc: Column
) => {
  let kcField = snakeCaseToPascalCase(kc.name);
  let func = new StmtFunc();
  let nc = table.columns.filter(v => v !== kc);
  func.sql = "select";
  func.sql += ` ${nc.map(v => `${v.name}`).join(",")}`;
  func.sql += ` from ${table.name}`;
  func.sql += ` where ${kc.name}=?`;
  func.stmt = `stmt${struct}SelectBy${kcField}`;
  func.text = `// ${func.sql}`;
  func.text += "\n";
  //
  let query = initQueryFields(nc, "t");
  let nullable = query.filter(v => v.nullName || v.nullType);
  if (nullable.length) {
    func.text += `func (t *${struct}) SelectBy${kcField}() error {
    var (
      ${nullable.map(v => `${v.nullName} ${v.nullType}`).join(",\n")}
    )
    err := ${func.stmt}.QueryRow(
        t.${kcField}
    ).Scan(
        ${query.map(v => v.scan).join(",\n\t\t")}
    )
    if err != nil {
        return err
    }
${nullable.map(v => v.nullAssign("")).join("\n\t")}
    return nil
}`;
  } else {
    func.text += `func (t *${struct}) SelectBy${kcField}() error {
    return ${func.stmt}.QueryRow(
        t.${kcField}
    ).Scan(
        ${nc.map(v => `t.${snakeCaseToPascalCase(v.name)}`).join(",\n")}
    )
}`;
  }
  funcs.push(func);
  return funcs;
};

const genSelectPage = (struct: string, table: Table) => {
  let text = `func Select${struct}(db *sql.DB, where, orderBy, order, offset, count string) ([]*${struct}, error) {
    var buf strings.Builder
    buf.WriteString("select * from ${table.name} where ")
    buf.WriteString(where)
    buf.WriteString(" order by ")
    buf.WriteString(orderBy)
    buf.WriteString(" ")
    buf.WriteString(order)
    buf.WriteString(" limit")
    buf.WriteString(offset)
    buf.WriteString(",")
    buf.WriteString(count)
    rows, err := db.Query(buf.String())
    if err != nil {
        return err
    }`; //
  let query = initQueryFields(table.columns, table.name);
  let nullable = query.filter(v => v.nullName || v.nullType);
  if (nullable.length) {
    text += `
    var (
      ${nullable.map(v => `${v.nullName} ${v.nullType}`).join(",\n")}
    )
    ${table.name}s := make([]*${struct}, 0)
    for rows.Next() {
        ${table.name} = new(${struct})
        err = rows.Scan(
            ${query.map(v => v.scan).join(",\n\t\t\t")}
        )
        if err != nil {
          return err
        }
${nullable.map(v => v.nullAssign("\t")).join("\n\t\t")}
        ${table.name}s = append(${table.name}s, ${table.name})
    }
    return ${table.name}s, nil
}`;
  } else {
    text += `
    for rows.Next() {
        ${table.name} = new (${struct})
        err = rows.Scan(
            ${query.map(v => v.scan).join(",\n\t\t\t")}
        )
        if err != nil {
          return err
        }
        ${table.name}s = append(${table.name}s, ${table.name})
    }
    return ${table.name}s, nil
}`;
  }
  return text;
};

const genInitStmt = (struct: string, stmts: Stmt[]): string => {
  let str = "var (\n";
  str += stmts.map(v => `\t${v.name} *db.Stmt`).join("\n");
  str += "\n)\n\n";
  str += `func Prepare${struct}(db *sql.DB) error {`;
  str += "\n\tvar err error\n";
  stmts.forEach(v => {
    str += "\t";
    str += `${v.name}, err = db.Prepare("${v.sql}")`;
    str += "\n\tif err != nil {\n";
    str += "\t\treturn err\n\t}\n";
  });
  str += "\treturn nil\n}\n\n";
  str += `func Close${struct}Stmts() {\n`;
  stmts.forEach(v => {
    str += "\t";
    str += `${v.name}.Close()\n`;
  });
  str += "}\n";
  return str;
};

const goType = (type: string): string => {
  type = type.toUpperCase();
  switch (type) {
    case "TINYINT":
      return "int8";
    case "SMALLINT":
      return "int16";
    case "MEDIUMINT":
      return "int32";
    case "INT":
      return "int";
    case "BIGINT":
      return "int64";
    case "TINYINT UNSIGNED":
      return "uint8";
    case "SMALLINT UNSIGNED":
      return "uint16";
    case "MEDIUMINT UNSIGNED":
      return "uint32";
    case "INT UNSIGNED":
      return "uint";
    case "BIGINT UNSIGNED":
      return "uint64";
    case "FLOAT":
      return "float32";
    case "DOUBLE":
      return "float64";
    case "DECIMAL":
      return "float64";
    case "TINYBLOB":
      return "[]byte";
    case "BLOB":
      return "[]byte";
    case "MEDIUMBLOB":
      return "[]byte";
    case "LONGBLOB":
      return "[]byte";
    case "BINARY":
      return "[]byte";
    case "TINYTEXT":
      return "string";
    case "TEXT":
      return "string";
    case "MEDIUMTEXT":
      return "string";
    case "LONGTEXT":
      return "string";
    case "TIMESTAMP":
      return "int64";
    case "DATE":
      return "string";
    case "TIME":
      return "string";
    case "YEAR":
      return "string";
    case "DATETIME":
      return "string";
    default:
      return "string";
  }
};
