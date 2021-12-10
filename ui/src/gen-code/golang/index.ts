import { Table, Column, snakeCaseToPascalCase, snakeCaseToCamelCase } from "..";

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

class NullField {
  name = "";
  type = "";
  go = "";
}

export const genCode = (table: Table): string => {
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
  let str = `import (
    "database/sql"
    "strings"
)

${genInitStmt(struct, stmt)}

type ${struct} {
  ${genFields(table)}
}

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
    funcs = genSelectBy(
      struct,
      table,
      funcs,
      table.columns.filter(c => !c.increment && c !== v),
      v
    );
  });
  return funcs;
};

const genSelectBy = (
  struct: string,
  table: Table,
  funcs: StmtFunc[],
  nc: Column[],
  kc: Column
) => {
  let kcField = snakeCaseToPascalCase(kc.name);
  let func = new StmtFunc();
  func.sql = "select";
  func.sql += ` ${nc.map(v => `${v.name}`).join(",")}`;
  func.sql += ` from ${table.name}`;
  func.sql += ` where ${kc.name}=?`;
  func.stmt = `stmt${struct}SelectBy${kcField}`;
  func.text = `// ${func.sql}`;
  func.text += "\n";
  //
  let nuc = nc.filter(v => v.nullable);
  if (nuc.length) {
    let nf = nuc.map(v => {
      let f = new NullField();
      f.name = `${snakeCaseToCamelCase(v.name)}`;
      f.go = goType(v.type);
      if (f.go.indexOf("int") !== -1) {
        f.type = "sql.NullInt64";
      } else if (f.go.indexOf("float") !== -1) {
        f.type = "sql.NullFloat64";
      } else {
        f.type = "sql.NullString";
      }
      return f;
    });
    let scan = nc.map(v => {
      if (v.nullable) {
        return `_${snakeCaseToCamelCase(v.name)}`;
      } else {
        return `t.${snakeCaseToPascalCase(v.name)}`;
      }
    });
    func.text += `func (t *${struct}) SelectBy${kcField}() error {
    var (
      ${nf.map(v => `_${v.name} ${v.type}`).join(",\n")}
    )
    err := ${func.stmt}.QueryRow(
        t.${kcField}
    ).Scan(
        ${scan.join(",\n\t\t")}
    )
    if err != nil {
        return err
    }`;
    nf.forEach(v => {
      func.text += "\n\t";
      func.text += `if _${v.name}.Valid {`;
      func.text += "\n\t\t";
      let name = snakeCaseToPascalCase(v.name);
      if (v.type === "sql.NullInt64") {
        func.text += `t.${name} = ${v.go}(_${v.name}.Int64)`;
      } else if (v.type === "sql.NullFloat64") {
        func.text += `t.${name} = ${v.go}(_${v.name}.Float64)`;
      } else {
        func.text += `t.${name} = _${v.name}.String`;
      }
      func.text += "\n\t}";
    });
    func.text += `
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

const genSelectPage = () => {};

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

// // select pwd=? from t1 where name=?
// func (t *T1) SelectByName(){
//   return stmtT1SelectByName.QueryRow(
//   t.Pwd,
//   t.Name,
//   if nil != err {
//     return nil, err
//   }

//   var (
//     _pwd sql.NullString
//   )
//   return stmtT1SelectByName.QueryRow(
//         t.Pwd,
//   t.Name,
//   ).Scan(
//     &_pwd
// )
// }	)
// }
