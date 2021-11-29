<script setup lang="ts">
import { reactive, onMounted } from "vue"
import Header from "../components/Header.vue"
import http from "../http"
import * as common from "../common"

const data = reactive({
    props: new common.AppProps(),
    columns: new Array<Column>(),
    model: {},
    count: 20,
})

const fetch = () => {
    common.loading(async () => {
        let sql =
            "select" +
            " column_name" +
            ",column_type" +
            ",column_default" +
            ",column_comment" +
            ",column_key" +
            ",is_nullable" +
            ",extra" +
            ",character_maximum_length" +
            ",numeric_precision" +
            ",numeric_scale" +
            " from information_schema.columns";
        sql += ` where table_schema = '${data.props.schema}'`;
        sql += ` and table_name = '${data.props.table}'`;
        sql += " order by ordinal_position";
        let result = await http.sql([sql], data.props.connection)
        data.model = {}
        data.columns = result[0].rows.map(v => {
            let c = new Column()
            c.name = v[0];
            c.type = v[1].toUpperCase();
            c.default = v[2];
            c.comment = v[3];
            c.key = v[4];
            c.nullable = v[5];
            c.extra = v[6].toUpperCase();
            c.charLength = v[7];
            c.numPrecision = v[8];
            c.numScale = v[9];
            data.model[c.name] = c.mockExpr()
            return c
        })
    })
}

const onSubmit = () => {
    common.loading(async () => {
        let res = await http.post('/mock', {
            model: data.model,
            count: data.count,
        }, {
            connection: data.props.connection,
            schema: data.props.schema,
            table: data.props.table,
        })
        common.alertSuccess(`Mock data: success:${res.success}, fail:${res.fail} `)
    })
}

onMounted(() => {
    data.props.init()
    fetch()
})
</script>

<script lang="ts">

class Column {
    name = ""
    type = ""
    default = ""
    comment = ""
    key = ""
    nullable = ""
    extra = ""
    charLength = 0
    numPrecision = 0
    numScale = 0
    label() {
        let str = `${this.name} ${this.type}`
        str += this.nullable === "YES" ? " | NULL" : " | NOT NULL"
        str += ` | ${this.key}`
        str += this.default ? ` | DEFAULT(${this.default})` : ""
        str += this.increment() ? ` | ${this.extra}` : ""
        return str
    }
    increment() {
        return this.extra === "AUTO_INCREMENT"
    }
    mockExpr() {
        if (this.increment()) {
            return
        }
        if (this.type.indexOf("BIT") !== -1) {
            return '@character("01")'
        }
        if (this.type.indexOf("TINYINT UNSIGNED") !== -1) {
            return `@integer(0,${0xff})`
        }
        if (this.type.indexOf("TINYINT") !== -1) {
            return `@integer(${-0x80},${0x80})`
        }
        if (this.type.indexOf("SMALLINT UNSIGNED") !== -1) {
            return `@integer(0,${0xffff})`
        }
        if (this.type.indexOf("SMALLINT") !== -1) {
            return `@integer(${-0x7fff},${0x7fff})`
        }
        if (this.type.indexOf("MEDIUMINT UNSIGNED") !== -1) {
            return `@integer(0,${0xffffff})`
        }
        if (this.type.indexOf("MEDIUMINT") !== -1) {
            return `@integer(${-0x7fffff},${0x7fffff})`
        }
        if (this.type.indexOf("INT UNSIGNED") !== -1) {
            return `@integer(0,${0xffffffff})`
        }
        if (this.type.indexOf("INT") !== -1) {
            return `@integer(${-0x7fffffff},${0x7fffffff})`
        }
        if (this.type.indexOf("BIGINT UNSIGNED") !== -1) {
            return `@integer(0,${0xffffffffffffffff})`
        }
        if (this.type.indexOf("BIGINT") !== -1) {
            return `@integer(${-0x7fffffffffffffff},${0x7fffffffffffffff})`
        }
        if (this.type.indexOf("FLOAT UNSIGNED") !== -1) {
            return `@float(0,${0xffffffff},1,${this.numPrecision})`
        }
        if (this.type.indexOf("FLOAT") !== -1) {
            return `@float(${-0x7fffffff},${0x7fffffff},1,${this.numPrecision})`
        }
        if (this.type.indexOf("DOUBLE UNSIGNED") !== -1) {
            return `@float(0,${0xffffffffffffffff},1,${this.numPrecision})`
        }
        if (this.type.indexOf("DOUBLE") !== -1) {
            return `@float(${-0x7fffffffffffffff},${0x7fffffffffffffff},1,${this.numPrecision})`
        }
        if (this.type.indexOf("TIMESTAMP") !== -1) {
            return `@natural()`
        }
        if (this.type.indexOf("DATETIME") !== -1) {
            return `@datetime()`
        }
        if (this.type.indexOf("DATE") !== -1) {
            return `@date()`
        }
        if (this.type.indexOf("TIME") !== -1) {
            return `@time()`
        }
        if (this.type.indexOf("TEXT") !== -1) {
            return `@paragraph()`
        }
        if (this.type.indexOf("BLOB") !== -1) {
            return `@paragraph()`
        }
        if (this.type.indexOf("VARCHAR") !== -1) {
            return `@word(1,${this.charLength})`
        }
        if (this.type.indexOf("CHAR") !== -1) {
            return `@word(${this.charLength},${this.charLength})`
        }
        return ""
    }
}
</script>

<template>
    <Header
        :connection="data.props.connection"
        :schema="data.props.schema"
        :table="data.props.table"
    />
    <el-form labelPosition="top" size="small">
        <el-form-item v-for="v in data.columns" :label="v.label()">
            <el-input
                v-model="data.model[v.name]"
                :placeholder="v.mockExpr()"
                clearable
                :disabled="v.increment()"
            />
        </el-form-item>
        <el-form-item label="Data Count">
            <el-input-number
                :min="1"
                style="width: 100%"
                v-model="data.count"
                controls-position="right"
            />
        </el-form-item>
        <el-form-item>
            <el-button
                style="width: 100%"
                type="primary"
                @click="onSubmit"
            >Submit</el-button>
        </el-form-item>
    </el-form>
</template>
