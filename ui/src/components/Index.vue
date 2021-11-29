<script setup lang="ts">
import { reactive } from "vue"
import TableVue from "../components/Table.vue"
import TableActionHeader from "../components/TableActionHeader.vue"
import TableActionRow from "../components/TableActionRow.vue"
import Form from "../components/Form.vue"

const props = defineProps(['columns', 'rows',
    'add', 'edit', 'delete'])

const table = reactive({
    columns: ["name", "unique", "length", "order", "comment"],
    page: 1,
    pageSize: 5,
})

const addForm = reactive({
    show: false,
    data: new Column(),
})

const editForm = reactive({
    show: false,
    data: new Column(),
    row: new Column(),
})

const onAdd = () => {
    addForm.data = new Column()
    addForm.show = true
}

const onAddSubmit = async () => {
    if (!addForm.data.check()) {
        return
    }
    if (await props.add(addForm.data)) {
        addForm.show = false
    }
}

const onEdit = (row: Column) => {
    editForm.row = row
    Object.assign(editForm.data, editForm.row)
    editForm.show = true
}

const onEditSubmit = async () => {
    if (!editForm.data.check()) {
        return
    }
    if (await props.edit(editForm.data, editForm.row)) {
        Object.assign(editForm.row, editForm.data)
        editForm.show = false
    }
}

const onDelete = async (row: Column) => {
    await props.delete(row)
}

</script>

<script lang="ts">
export class Column {
    column = ''
    name = ''
    unique = false
    length = 0
    order = ''
    comment = ''
    columnError = ''
    check() {
        if (!this.column) {
            this.columnError = 'column required'
            return false
        }
        if (!this.name) {
            this.name = this.column
        }
        return true
    }
}


</script>

<template>
    <TableVue
        :columns="table.columns"
        :rows="props.rows"
        :total="props.rows.length"
        :page="table.page"
        :page-size="table.pageSize"
        @page-change="(page: number, pageSize: number) => {
            table.page = page
            table.pageSize = pageSize
        }"
    >
        <template #default>
            <el-table-column prop="name" label="name" resizable />
            <el-table-column label="unique" resizable>
                <template #default="{ row }">
                    <el-switch v-model="row.unique" disabled />
                </template>
            </el-table-column>
            <el-table-column prop="length" label="length" resizable />
            <el-table-column prop="order" label="order" resizable />
            <el-table-column prop="comment" label="comment" resizable />
        </template>
        <template #action>
            <el-table-column fixed="right" :width="110" align="center">
                <template #header>
                    <TableActionHeader :enableAdd="true" @add="onAdd" />
                </template>
                <template #default="{ row }">
                    <TableActionRow
                        @edit="onEdit(row)"
                        @delete="onDelete(row)"
                    />
                </template>
            </el-table-column>
        </template>
    </TableVue>
    <Form
        title="Add Data"
        :show="addForm.show"
        :model="addForm.data"
        @submit="onAddSubmit"
        @cancel="addForm.show = false"
    >
        <template #default>
            <el-form-item
                label="column"
                :error="addForm.data.columnError"
                required
            >
                <el-select v-model="addForm.data.column" style="width:100%">
                    <el-option
                        v-for="column in props.columns"
                        :label="column.name"
                        :value="column.name"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="name">
                <el-input v-model="addForm.data.name" clearable />
            </el-form-item>
            <el-form-item label="unique">
                <el-switch v-model="addForm.data.unique" clearable />
            </el-form-item>
            <el-form-item label="length">
                <el-input-number
                    style="width:100%"
                    :min="0"
                    v-model="addForm.data.length"
                    clearable
                />
            </el-form-item>
            <el-form-item label="order">
                <el-select v-model="editForm.data.order" style="width:100%">
                    <el-option label="AES" value="AES" />
                    <el-option label="DESC" value="DESC" />
                </el-select>
            </el-form-item>
            <el-form-item label="comment">
                <el-input v-model="addForm.data.comment" clearable />
            </el-form-item>
        </template>
    </Form>
    <Form
        title="Edit Data"
        :show="editForm.show"
        :model="editForm.data"
        @submit="onEditSubmit"
        @cancel="editForm.show = false"
    >
        <template #default>
            <el-form-item
                label="column"
                :error="editForm.data.columnError"
                required
            >
                <el-select v-model="editForm.data.column" style="width:100%">
                    <el-option
                        v-for="column in props.columns"
                        :label="column.name"
                        :value="column.name"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="name">
                <el-input
                    v-model="editForm.data.name"
                    :placeholder="editForm.row.name"
                    clearable
                />
            </el-form-item>
            <el-form-item label="unique">
                <el-switch v-model="editForm.data.unique" clearable />
            </el-form-item>
            <el-form-item label="length">
                <el-input-number
                    style="width:100%"
                    v-model="editForm.data.length"
                    :min="0"
                    :placeholder="editForm.row.length"
                    clearable
                />
            </el-form-item>
            <el-form-item label="order">
                <el-select v-model="editForm.data.order" style="width:100%">
                    <el-option label="AES" value="AES" />
                    <el-option label="DESC" value="DESC" />
                </el-select>
            </el-form-item>
            <el-form-item label="comment">
                <el-input
                    v-model="editForm.data.comment"
                    :placeholder="editForm.row.comment"
                    clearable
                />
            </el-form-item>
        </template>
    </Form>
</template>
