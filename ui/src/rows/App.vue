<script setup lang="ts">
import { reactive, computed, onMounted } from "vue"
import Header from "../components/Header.vue"
import Table from "../components/Table.vue"
import Form from "../components/Form.vue"
import * as common from "../common"
import http, { toTableRows } from "../http"

const data = reactive({
    props: new common.AppProps(),
    columns: new Array<Column>(),
    rows: new Array<any>(),
    total: 0,
    offset: 0,
    count: 5,
    search: "",
    adding: false,
    addForm: {},
    editing: false,
    editForm: {},
    editRow: {},
})

const addFormItems = computed(() =>
    data.columns.map(v => ({
        name: v.name,
        label: v.label(),
        required: false,
        disabled: v.increment(),
        placeholder: ''
    }))
)

const editFormItems = computed(() =>
    data.columns.map(v => ({
        name: v.name,
        label: v.label(),
        required: false,
        disabled: v.increment(),
        placeholder: ''
    }))
)

const whereCondition = (row: any) => {
    let str = " where "
    let key = data.columns.findIndex(v => v.key === "PRI" || v.key === "UNI")
    if (key !== -1) {
        str += data.columns[key].expr(row)
    } else {
        str += data.columns.map(v => v.expr(row)).join(" and ")
    }
    return str
}

const fetch = async () => {
    common.loading(async () => {
        // columns
        let result = (await http.sql(["select" +
            " column_name" +
            ",column_type" +
            ",column_default" +
            ",column_key" +
            ",is_nullable" +
            ",extra" +
            " from information_schema.columns" +
            " where" +
            ` table_schema='${data.props.schema}'` +
            " and" +
            ` table_name='${data.props.table}'` +
            " order by" +
            " ordinal_position"], data.props.connection))
        data.columns = result[0].rows.map((v: any[]) => {
            let c = new Column()
            c.name = v[0]
            c.type = v[1].toUpperCase()
            c.default = v[2]
            c.key = v[3]
            c.nullable = v[4]
            c.extra = v[5]
            c.show = true
            return c
        })
        // 
        let sql1 = `select ${data.columns.map(v => v.name)}`
        sql1 += ` from ${data.props.schema}.${data.props.table}`
        sql1 += data.search ? ` where ${data.search}` : ""
        sql1 += ` limit ${data.offset},${data.count}`
        // 
        let sql2 = `select count(*) from ${data.props.schema}.${data.props.table}`
        sql2 += data.search ? ` where ${data.search}` : ""
        result = (await http.sql([sql1, sql2], data.props.connection))
        // rows
        data.rows = toTableRows(result[0])
        // data.rows = result[0].rows.map(v => {
        //     let row = {}
        //     data.columns.forEach((c, i) => {
        //         row[c.name] = v[i]
        //     })
        //     return row
        // })
        // count
        data.total = result[1].rows[0][0]
    })
}

const onFetch = (v: any) => {
    data.offset = v.offset
    data.count = v.count
    data.search = v.search
    fetch()
}

const onAdd = () => {
    data.addForm = {}
    data.adding = true
}

const onEdit = (row: any) => {
    data.editRow = row
    Object.assign(data.editForm, row)
    data.editing = true
}

const onAddSubmit = async () => {
    let col: string[] = []
    let val: any[] = []
    data.columns.forEach(v => {
        if (data.addForm[v.name]) {
            col.push(v.name)
            val.push(v.value(data.addForm))
        }
    })
    let sql = `insert into ${data.props.schema}.${data.props.table}` +
        ` (${col.join(',')}) values (${val.join(',')})`
    if (await http.sql([sql], data.props.connection)) {
        data.adding = false
        fetch()
    }
}

const onEditSubmit = () => {
    let sql = `update ${data.props.schema}.${data.props.table} set`
    let expr: string[] = []
    data.columns.forEach(v => {
        if (data.editForm[v.name]) {
            expr.push(v.expr(data.editForm))
        }
    })
    sql += ` ${expr.join(",")} ${whereCondition(data.editForm)} limit 1`
    // 
    common.loading(async () => {
        if (await http.sql([sql], data.props.connection)) {
            Object.assign(data.editRow, data.editForm)
            data.editing = false
        }
    })
}

const onDeleteSubmit = (row: any) => {
    let sql = `delete from ${data.props.schema}.${data.props.table}`
    sql += ` ${whereCondition(row)} limit 1`
    // 
    common.loading(async () => {
        if (await http.sql([sql], data.props.connection)) {
            fetch()
        }
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
    key = ""
    nullable = ""
    extra = ""
    show = false
    label() {
        let str = `${this.name} ${this.type}`
        str += ` | ${this.key} | ${this.extra.toUpperCase()} | `
        str += this.nullable === "YES" ? "NULL" : "NOT NULL"
        str += this.default ? ` | DEFAULT(${this.default})` : ""
        return str
    }
    isNumber() {
        return (
            this.type.indexOf("INTEGER") !== -1 ||
            this.type.indexOf("INT") !== -1 ||
            this.type.indexOf("SMALLINT") !== -1 ||
            this.type.indexOf("TINYINT") !== -1 ||
            this.type.indexOf("MEDIUMINT") !== -1 ||
            this.type.indexOf("BIGINT") !== -1 ||
            this.type.indexOf("DECIMAL") !== -1 ||
            this.type.indexOf("NUMERIC") !== -1 ||
            this.type.indexOf("FLOAT") !== -1 ||
            this.type.indexOf("DOUBLE") !== -1 ||
            this.type.indexOf("TIMESTAMP") !== -1
        )
    }
    value(data: any) {
        return this.isNumber() ? data[this.name] : `'${data[this.name]}'`
    }
    expr(data: any) {
        return `${this.name}=${this.value(data)}`
    }
    increment() {
        return this.extra === "auto_increment"
    }
}
</script>

<template>
    <Header
        :connection="data.props.connection"
        :schema="data.props.schema"
        :table="data.props.table"
    />
    <Table
        :columns="data.columns"
        :rows="data.rows"
        :total="data.total"
        :pageSize="5"
        :actionWidth="110"
        searchPlaceholder="Input Where Condition"
        :enablePage="true"
        :enableSearch="true"
        :enableAdd="true"
        :enableFilter="true"
        :enableEdit="true"
        :enableDelete="true"
        @fetch="onFetch"
        @add="onAdd"
        @edit="onEdit"
        @delete="onDeleteSubmit"
    />
    <Form
        title="Add Data"
        :show="data.adding"
        :model="data.addForm"
        :items="addFormItems"
        @submit="onAddSubmit"
        @cancel="data.adding = false"
    />
    <Form
        title="Edit Data"
        :show="data.editing"
        :model="data.editForm"
        :items="editFormItems"
        @submit="onEditSubmit"
        @cancel="data.editing = false"
    />
</template>
