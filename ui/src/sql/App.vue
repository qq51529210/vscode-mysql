<script setup lang="ts">
import { reactive, onMounted, computed } from "vue"
import Header from "../components/Header.vue"
import Table from "../components/Table.vue"
import SQL from "../components/SQL.vue"
import * as common from "../common"
import http, { toTableRows } from "../http"

const data = reactive({
    props: new common.AppProps(),
    columns: new Array<any>(),
    rows: new Array<any>(),
    total: 0,
    offset: 0,
    count: 5,
    error: '',
    success: '',
    sql: ''
})

const rows = computed(() =>
    data.rows.slice(data.offset, data.offset + data.count)
)

const onFetch = (v: any) => {
    data.offset = v.offset
    data.count = v.count
}

const onFormat = async () => {
    data.sql = common.formatSQL(data.sql)
}

const onSubmit = async () => {
    let loading = common.newLoading()
    try {
        let result = await http.sql([data.sql], data.props.connection, data.props.schema)
        data.columns = result[0].columns.map(v => ({ name: v, show: true }))
        data.columns.forEach((v, i) => {
            if (!v.name) {
                v.name = `column_${i}`
            }
        })
        data.rows = toTableRows(result[0])
        data.total = data.rows.length
        data.error = ''
        if (!data.total && !data.columns.length) {
            data.success = 'ok'
        }
    } catch (err: any) {
        data.columns = []
        data.rows = []
        data.total = 0
        data.error = 'Network Error'
        if (err.response && err.response.data.error) {
            data.error = err.response.data.error
        }
    } finally {
        loading.close()
    }
}

onMounted(() => {
    data.props.init()
})
</script>

<template>
    <Header
        :connection="data.props.connection"
        :schema="data.props.schema"
        :table="data.props.table"
    />
    <SQL v-model="data.sql" />
    <el-row style="margin: 15px 0;">
        <el-button size="mini" type="danger" @click="onFormat">Format</el-button>
        <el-button size="mini" type="primary" @click="onSubmit">Submit</el-button>
    </el-row>
    <Table
        v-if="data.total || data.columns.length"
        :columns="data.columns"
        :rows="rows"
        :total="data.total"
        :pageSize="5"
        :hideAction="true"
        @fetch="onFetch"
    />
    <el-alert
        v-if="data.error !== ''"
        type="error"
        :closable="false"
        :description="data.error"
    />
    <el-alert
        v-if="data.success !== ''"
        type="success"
        :closable="false"
        :description="data.success"
    />
</template>