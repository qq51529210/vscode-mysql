<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import Header from "../components/Header.vue"
import * as common from "../common"
import http from "../http"
import CodeMirror, { EditorFromTextArea } from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/go/go.js'
import { Table, Column } from "."
import { genCode as golang } from "./golang"
import { Clipboard } from 'ts-clipboard';

const data = reactive({
    props: new common.AppProps(),
    language: "GOLANG",
    languages: ["GOLANG"],
    table: new Table(''),
    tables: new Array<Table>(),
    editor: {} as EditorFromTextArea
})

const textarea = ref()

const fetchSchema = () => {
    common.loading(async () => {
        let names = await http.get(`/tables`, {
            connection: data.props.connection, schema: data.props.schema
        }) as string[]
        if (!names) {
            return
        }
        let tables: Table[] = []
        names.forEach(async name => {
            let result = await http.sql([
                "select" +
                " column_name" +
                ",data_type" +
                ",column_default" +
                ",column_key" +
                ",is_nullable" +
                ",extra" +
                " from information_schema.columns" +
                ` where table_schema='${data.props.schema}' and table_name='${name}'`
            ], data.props.connection)
            // 
            let table = new Table(name)
            table.columns = result[0].rows.map(r => {
                let c = new Column()
                c.name = r[0]
                c.type = r[1]
                c.default = r[2]
                c.primary = r[3] === 'PRI'
                c.unique = r[3] === 'UNI'
                c.mulUnique = r[3] === 'MUL'
                c.nullable = r[4] === 'YES'
                c.increment = r[5] === 'auto_increment'
                return c
            })
            tables.push(table)
        })
        data.tables = tables
    })
}

const onLanguageChange = (v: string) => {
    data.language = v
}

const onTableChange = (v: string) => {
    let table = data.tables.find(t => t.name === v)
    if (table) {
        data.table = table
        data.editor.setValue(golang(table))
    }
}

const onCopy = () => {
    Clipboard.copy(data.editor.getValue())
    common.successMessage('copied to clipboard')
}

onMounted(() => {
    data.props.init()
    fetchSchema()
    data.editor = CodeMirror.fromTextArea(textarea.value, {
        mode: 'text/x-go',
        lineNumbers: true,
        readOnly: true
    })
})

</script>

<template>
    <Header :connection="data.props.connection" :schema="data.props.schema" />
    <el-row :gutter="10" justify="space-between">
        <el-col :xs="{ span: 16 }" :sm="{ span: 19 }">
            <el-row :gutter="10" justify="space-between">
                <el-col :span="12">
                    <el-select
                        style="width: 100%;"
                        size="mini"
                        :model-value="data.table.name"
                        placeholder="Table"
                        @change="onTableChange"
                    >
                        <el-option
                            v-for="v in data.tables"
                            :label="v.name"
                            :value="v.name"
                        />
                    </el-select>
                </el-col>
                <el-col :span="12">
                    <el-select
                        style="width: 100%;"
                        size="mini"
                        :model-value="data.language"
                        placeholder="Language"
                        @change="onLanguageChange"
                    >
                        <el-option
                            v-for="v in data.languages"
                            :label="v"
                            :value="v"
                        />
                    </el-select>
                </el-col>
            </el-row>
        </el-col>
        <el-col :xs="{ span: 8 }" :sm="{ span: 5 }">
            <el-button
                type="success"
                plain
                size="mini"
                @click="fetchSchema"
            >Refresh</el-button>
            <el-button type="primary" plain size="mini" @click="onCopy">Copy</el-button>
        </el-col>
    </el-row>
    <div>
        <textarea ref="textarea" />
    </div>
</template>

<style>
.CodeMirror {
    height: auto;
    width: auto;
    margin-top: 20px;
    margin-bottom: 20px;
    border: 1px solid var(--el-border-color-base);
}
</style>