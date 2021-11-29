<script setup lang="ts">
import { reactive, onMounted } from "vue"
import Header from "../components/Header.vue"
import Form from "../components/Form.vue"
import Table from "../components/Table.vue"
import http from "../http"
import * as common from "../common"

const data = reactive({
    props: new common.AppProps(),
    columns: [
        { name: "_id", show: true },
        { name: "key", show: true },
        { name: "value", show: true },
    ],
    rows: new Array<Row>(),
    total: 0,
    offset: 0,
    count: 5,
    search: "",
    adding: false,
    addForm: new Row(),
    editing: false,
    editForm: new Row(),
    editRow: new Row(),
})

const addFormItems = [
    { name: '_id', label: '_id', required: true, disabled: true, placeholder: '' },
    { name: 'key', label: 'key', required: true, disabled: false, placeholder: '' },
    { name: 'value', label: 'value', required: true, disabled: false, placeholder: '' }
]

const editFormItems = [
    { name: '_id', label: '_id', required: true, disabled: true, placeholder: '' },
    { name: 'key', label: 'key', required: true, disabled: false, placeholder: '' },
    { name: 'value', label: 'value', required: true, disabled: false, placeholder: '' }
]

const fetch = () => {
    common.loading(async () => {
        let result = await http.get(`/collections/${data.props.table}`, {
            connection: data.props.connection,
            schema: data.props.schema,
            offset: data.offset,
            count: data.count,
            search: data.search
        })
        data.rows = result.data.map((v: any) => {
            let row = new Row()
            Object.keys(v).forEach(key => {
                if (key === '_id') {
                    row._id = v[key]
                } else {
                    row.key = key
                    row.value = v[key]
                }
            })
            return row
        })
        data.total = result.count
    })
}

const checkForm = (form: Row, items: any[]) => {
    if (!form.key) {
        items[1].error = "key required"
        return false
    }
    if (!form.value) {
        items[2].error = 'value required, use "" for empty string '
        return false
    }
    return true
}

const onFetch = (v: any) => {
    data.offset = v.offset
    data.count = v.count
    data.search = v.search
    fetch()
}

const onAdd = () => {
    data.addForm = new Row()
    data.adding = true
}

const onEdit = (row: Row) => {
    data.editRow = row
    Object.assign(data.editForm, row)
    editFormItems[0].placeholder = row._id
    editFormItems[1].placeholder = row.key
    editFormItems[2].placeholder = row.value
    data.editing = true
}

const onAddSubmit = () => {
    if (!checkForm(data.addForm, addFormItems)) {
        return
    }
    common.loading(async () => {
        if (await http.post(`/collections/${data.props.table}`,
            data.addForm.data(), {
            connection: data.props.connection,
            schema: data.props.schema,
        })) {
            data.adding = false
            fetch()
        }
    })
}

const onEditSubmit = () => {
    if (!checkForm(data.editForm, editFormItems)) {
        return
    }
    common.loading(async () => {
        if (await http.patch(`/collections/${data.props.table}/${data.editRow._id}`,
            data.editForm.data(), {
            connection: data.props.connection,
            schema: data.props.schema,
        })) {
            Object.assign(data.editRow, data.editForm)
            data.editing = false
        }
    })
}

const onDeleteSubmit = (row: Row) => {
    common.loading(async () => {
        if (await http.delete(`/collections/${data.props.table}/${row._id}`, {
            connection: data.props.connection,
            schema: data.props.schema,
        })) {
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
class Row {
    _id = "";
    key = "";
    value = "";
    data() {
        return isNaN(Number(this.value)) ? {
            [this.key]: this.value,
        } : {
            [this.key]: Number(this.value),
        }
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
        searchPlaceholder="Input Expression Condition"
        :enablePage="true"
        :enableSearch="true"
        :enableAdd="true"
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
