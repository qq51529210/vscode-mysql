<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import HeaderVue from "../components/Header.vue"
import ColumnVue, { Column } from "../components/Column.vue"
import http from "../http"
import * as common from "../common"

const data = reactive({
    props: new common.AppProps(),
    nameError: '',
    columnError: '',
    name: '',
    comment: '',
    oldName: '',
    oldComment: '',
    columns: new Array<Column>(),
})

const columnVue = ref()

const primaryKeyColumns = () => {
    let names: string[] = []
    data.columns.forEach(v => {
        if (v.primary) {
            names.push(v.name)
        }
    })
    return names
}

const fetch = () => {
    common.loading(async () => {
        // comment
        let sql = 'select table_name,table_comment from information_schema.tables'
        sql += ` where table_schema='${data.props.schema}' and table_name='${data.props.table}'`
        let result = await http.sql([sql], data.props.connection)
        if (!result[0].rows.length) {
            data.oldName = ''
            common.alertError(`Table ${data.props.table} not found`)
            return
        }
        data.comment = result[0].rows[0][1]
        // columns
        sql = 'select column_name,column_type,column_default,is_nullable,column_key,extra'
        sql += ' from information_schema.columns'
        sql += ` where table_schema='${data.props.schema}' and table_name='${data.props.table}'`
        sql += ' order by ordinal_position'
        result = await http.sql([sql], data.props.connection)
        data.columns = result[0].rows.map(v => {
            let c = new Column()
            c.name = v[0]
            c.type = v[1]
            c.default = v[2]
            c.notnull = v[3] !== 'YES'
            c.primary = v[4] === 'PRI'
            c.unique = v[4] === 'UNI'
            c.increment = v[5] === 'auto_increment'
            return c
        })
        // references
        sql = 'select constraint_name from information_schema.referential_constraints'
        sql += ` where constraint_schema='${data.props.schema}' and table_name='${data.props.table}'`
        result = await http.sql([sql], data.props.connection)
        let sqls = result[0].rows.map(v => {
            let sql = 'select column_name,referenced_table_name,referenced_column_name,constraint_name'
            sql += ' from information_schema.key_column_usage'
            sql += ` where table_schema='${data.props.schema}'`
            sql += ` and table_name='${data.props.table}'`
            sql += ` and constraint_name='${v[0]}'`
            return sql
        })
        if (sqls.length) {
            let ress = await http.sql(sqls, data.props.connection)
            ress.forEach(v => {
                v.rows.forEach(r => {
                    let c = data.columns.find(c => c.name === r[0])
                    if (c) {
                        c.refTable = r[1]
                        c.refColumn = r[2]
                        c.refKey = r[3]
                    }
                })
            })
        }
    })
}

const addColumn = (row: Column) => {
    let sqls: string[] = []
    sqls.push(`alter table ${data.props.table} add ${row.sql()}`)
    if (row.primary) {
        let keys = primaryKeyColumns()
        if (keys.length) {
            sqls.push(`alter table ${data.props.table} drop primary key`)
        }
        keys.push(row.name)
        sqls.push(`alter table ${data.props.table} add primary key (${keys.join(',')})`)
    }
    if (row.unique) {
        sqls.push(`alter table ${data.props.table} add unique index ${row.name}(${row.name})`)
    }
    if (row.refTable !== '' && row.refColumn !== '') {
        sqls.push(`alter table ${data.props.table} add foreign key (${row.name}) references ${row.refTable}(${row.refColumn})`)
    }
    return common.loading(async () => {
        if (await http.sql(sqls, data.props.connection, data.props.schema)) {
            data.columns.push(Object.assign(new Column(), row))
            return true
        }
        return false
    })
}

const editColumn = async (model: Column, row: Column) => {
    let sqls: string[] = []
    sqls.push(`alter table ${data.props.table} change ${row.name} ${model.sql()}`)
    if (model.primary !== row.primary) {
        let keys = primaryKeyColumns()
        if (keys.length) {
            sqls.push(`alter table ${data.props.table} drop primary key`)
        }
        if (model.primary) {
            keys.push(model.name)
        } else {
            keys = keys.filter(v => v !== model.name)
        }
        sqls.push(`alter table ${data.props.table} add primary key (${keys.join(',')})`)
    }
    if (model.unique !== row.unique) {
        if (model.unique) {
            sqls.push(`alter table ${data.props.table} add unique index ${model.name}(${model.name})`)
        } else {
            sqls.push(`alter table ${data.props.table} drop index ${model.name}`)
        }
    }
    if (model.refTable !== row.refTable || model.refColumn !== row.refColumn) {
        if (model.refKey !== '') {
            sqls.push(`alter table ${data.props.table} drop foreign key ${model.refKey}`)
        }
        if (model.refTable !== "" && model.refColumn !== "") {
            sqls.push(`alter table ${data.props.table} add foreign key (${model.name}) references ${model.refTable}(${model.refColumn})`)
        }
    }
    return common.loading(async () => {
        if (await http.sql(sqls, data.props.connection, data.props.schema)) {
            if (model.refTable !== "" && model.refColumn !== "") {
                let sql = 'select constraint_name'
                sql += ' from information_schema.key_column_usage'
                sql += ` where table_schema='${data.props.schema}'`
                sql += ` and table_name='${data.props.table}'`
                sql += ` and referenced_table_name='${model.refTable}'`
                sql += ` and referenced_column_name='${model.refColumn}'`
                sql += ` and column_name='${model.name}'`
                let result = await http.sql([sql], data.props.connection)
                if (result[0].rows.length) {
                    model.refKey = result[0].rows[0][0]
                }
            }
            return true
        }
        return false
    })
}

const deleteColumn = async (row: Column) => {
    let sql = `alter table ${data.props.table} drop column ${row.name}`
    common.loading(async () => {
        if (await http.sql([sql], data.props.connection, data.props.schema)) {
            data.columns = data.columns.filter(v => v !== row)
        }
    })
}

const upColumn = async (row: Column) => {
    let i = data.columns.findIndex(v => v === row)
    if (i === 0) {
        return
    }
    let _row = data.columns[i - 1]
    let sql = `alter table ${data.props.table} modify ${_row.name} ${_row.type} after ${row.name}`
    common.loading(async () => {
        if (await http.sql([sql], data.props.connection, data.props.schema)) {
            let tmp = Object.assign(new Column(), _row)
            Object.assign(_row, row)
            Object.assign(row, tmp)
        }
    })
}

const downColumn = async (row: Column) => {
    let i = data.columns.findIndex(v => v === row)
    if (i === data.columns.length - 1) {
        return
    }
    let _row = data.columns[i + 1]
    let sql = `alter table ${data.props.table} modify ${row.name} ${row.type} after ${_row.name}`
    common.loading(async () => {
        if (await http.sql([sql], data.props.connection, data.props.schema)) {
            let tmp = Object.assign(new Column(), _row)
            Object.assign(_row, row)
            Object.assign(row, tmp)
        }
    })
}

const onSubmit = async () => {
    if (!data.name) {
        data.nameError = "name required"
        return
    }
    data.nameError = ""
    if (!data.columns.length) {
        data.columnError = 'column required'
        return
    }
    let sqls: string[] = []
    if (data.name && data.name !== data.oldName) {
        sqls.push(`alter table ${data.oldName} rename to ${data.name}`)
    }
    if (data.oldComment != data.comment && data.comment) {
        sqls.push(`alter table ${data.name} comment '${data.comment}'`)
    }
    if (sqls.length) {
        common.loading(async () => {
            if (await http.sql(sqls, data.props.connection, data.props.schema)) {
                if (data.name != data.oldName) {
                    data.oldName = data.name
                }
                if (data.oldComment != data.comment) {
                    data.oldComment = data.comment
                }
                if (await http.post('/msgs', {
                    command: 'edit table',
                    data: {
                        connection: data.props.connection,
                        schema: data.props.schema,
                        table: data.props.table,
                        newName: name
                    }
                })) {
                    common.alertSuccess(`Edit table ${data.name} success`)
                }
            }
        })
    }
}

onMounted(() => {
    data.props.init()
    data.name = data.props.table
    data.oldName = data.props.table
    columnVue.value.fetchSchema(data.props.connection, data.props.schema, data.oldName)
    fetch()
})
</script>

<template>
    <HeaderVue
        :connection="data.props.connection"
        :schema="data.props.schema"
        :table="data.name"
    />
    <el-form labelPosition="top" size="small">
        <el-form-item label="name" :error="data.nameError" required>
            <el-input
                v-model="data.name"
                :placeholder="data.oldName"
                clearable
            />
        </el-form-item>
        <el-form-item label="comment">
            <el-input
                v-model="data.comment"
                :placeholder="data.oldComment"
                clearable
            />
        </el-form-item>
        <el-form-item label="column" :error="data.columnError" required>
            <ColumnVue
                ref="columnVue"
                :rows="data.columns"
                :add="addColumn"
                :edit="editColumn"
                :delete="deleteColumn"
                :up="upColumn"
                :down="downColumn"
            />
        </el-form-item>
        <el-form-item>
            <el-button
                style="width:100%"
                type="primary"
                @click="onSubmit"
            >Submit</el-button>
        </el-form-item>
    </el-form>
</template>
