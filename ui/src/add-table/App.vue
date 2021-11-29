<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import Header from "../components/Header.vue"
import ColumnVue, { Column } from "../components/Column.vue"

import http from "../http"
import * as common from "../common"

const data = reactive({
    props: new common.AppProps(),
    name: '',
    comment: '',
    nameError: '',
    columnError: '',
    columns: new Array<Column>(),
})

const columnVue = ref()

const addColumn = async (col: Column) => {
    if (data.columns.findIndex(v => v.name === col.name) !== -1) {
        col.nameError = `${col.name} exists`
        return false
    }
    data.columns.push(Object.assign(new Column(), col))
    return true
}

const editColumn = (data: Column, row: Column) => {
    return true
}

const deleteColumn = (row: Column) => {
    data.columns = data.columns.filter(v => v !== row)
    return true
}

const upColumn = (row: Column) => {
    let i = data.columns.findIndex(v => v === row)
    if (i === 0) {
        return
    }
    let j = i - 1
    let r = data.columns[j]
    data.columns[j] = data.columns[i]
    data.columns[i] = r
}

const downColumn = (row: Column) => {
    let i = data.columns.findIndex(v => v === row)
    if (i === data.columns.length - 1) {
        return
    }
    let j = i + 1
    let r = data.columns[j]
    data.columns[j] = data.columns[i]
    data.columns[i] = r
}

const initSQL = () => {
    let pk: string[] = []
    let fk: string[] = []
    let idx: string[] = []
    let col: string[] = []
    data.columns.forEach(v => {
        if (v.primary) {
            pk.push(v.name)
        }
        if (v.refColumn && v.refColumn) {
            fk.push(`foreign key (${v.name}) references ${v.refTable}(${v.refColumn})`)
        }
        if (v.unique) {
            idx.push(`unique index ${v.name} (${v.name})`)
        }
        let str = `${v.name} ${v.type}`
        if (v.default) {
            str += ` default ${v.default}`
        }
        if (v.comment) {
            str += ` comment '${v.comment}'`
        }
        if (v.notnull) {
            str += ` not null`
        } else {
            str += ` null`
        }
        if (v.increment) {
            str += ` auto_increment`
        }
        col.push(str)
    })
    let sql = `create table ${data.name}(`
    sql += col.join(',')
    if (pk.length) {
        sql += `,primary key (${pk.join(',')})`
    }
    if (fk.length) {
        sql += `, ${fk.join(',')}`
    }
    if (idx.length) {
        sql += `, ${idx.join(',')}`
    }
    sql += ')'
    if (data.comment) {
        sql += ` comment '${data.comment}'`
    }
    return sql
}

const onSubmit = async () => {
    if (!data.name) {
        data.nameError = "name required"
        return
    }
    if (!data.columns.length) {
        data.columnError = 'column required'
        return
    }
    common.loading(async () => {
        if (await http.sql([initSQL()],
            data.props.connection,
            data.props.schema
        )) {
            if (await http.post('/msgs', {
                command: 'add table',
                data: {
                    connection: data.props.connection,
                    schema: data.props.schema,
                    table: data.name
                }
            })) {
                common.alertSuccess(`Add table ${data.name} success`)
            }
        }
    })
}

onMounted(() => {
    data.props.init()
    columnVue.value.fetchSchema(data.props.connection, data.props.schema)
})

</script>

<template>
    <Header :connection="data.props.connection" :schema="data.props.schema" />
    <el-form labelPosition="top" size="small">
        <el-form-item label="name" :error="data.nameError" required>
            <el-input v-model="data.name" clearable />
        </el-form-item>
        <el-form-item label="comment">
            <el-input v-model="data.comment" clearable />
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
