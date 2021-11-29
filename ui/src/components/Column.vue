<script setup lang="ts">
import { reactive } from "vue"
import { SortDown, SortUp } from "@element-plus/icons"
import TableVue from "../components/Table.vue"
import ForeignKeyVue, { Table } from "../components/ForeignKey.vue"
import Form from "../components/Form.vue"
import * as common from "../common"
import http from "../http"

const props = defineProps(['rows',
    'add', 'edit', 'delete', 'up', 'down'
])

const data = reactive({
    offset: 0,
    count: 5,
    adding: false,
    addForm: new Column(),
    editing: false,
    editForm: new Column(),
    editRow: new Column(),
    refTables: new Array<Table>(),
})

const autocompleteTypes = [
    { value: "BIT" },
    { value: "TINYINT" },
    { value: "TINYINT UNSIGNED" },
    { value: "SMALLINT" },
    { value: "SMALLINT UNSIGNED" },
    { value: "MEDIUMINT" },
    { value: "MEDIUMINT UNSIGNED" },
    { value: "INT" },
    { value: "INT UNSIGNED" },
    { value: "BIGINT" },
    { value: "BIGINT UNSIGNED" },
    { value: "FLOAT" },
    { value: "FLOAT UNSIGNED" },
    { value: "DOUBLE" },
    { value: "DOUBLE UNSIGNED" },
    { value: "CHAR" },
    { value: "VARCHAR" },
    { value: "TEXT" },
    { value: "BLOB" },
    { value: "TIME" },
    { value: "DATE" },
    { value: "DATETIME" },
    { value: "TIMESTAMP" },
];

const autocomplete = (str: string, cb: any) => {
    if (!str) {
        cb(autocompleteTypes);
    } else {
        str = str.toUpperCase()
        cb(
            autocompleteTypes.filter(v => v.value.indexOf(str) !== -1)
        );
    }
};

const fetchSchema = (connection: string, schema: string, table?: string) => {
    common.loading(async () => {
        let names = await http.get(`/tables`, {
            connection: connection, schema: schema
        }) as string[]
        if (!names) {
            return
        }
        if (table !== '') {
            names = names.filter(v => v !== table)
        }
        let result = await http.sql(names.map(v =>
            'select column_name from information_schema.columns' +
            ` where table_schema='${schema}' and table_name='${v}'`
        ), connection, schema)
        data.refTables = names.map((name, i) => new Table(name, result[i].rows.map(row => row[0])))
    })
}

const onFetch = (v: any) => {
    data.offset = v.offset
    data.count = v.count
}

const onAdd = () => {
    data.addForm = new Column()
    data.adding = true
}

const onAddSubmit = async () => {
    if (!data.addForm.check()) {
        return
    }
    if (await props.add(data.addForm)) {
        data.adding = false
    }
}

const onEdit = (row: Column) => {
    data.editRow = row
    Object.assign(data.editForm, row)
    data.editing = true
}

const onEditSubmit = async () => {
    if (!data.editForm.check()) {
        return
    }
    if (await props.edit(data.editForm, data.editRow)) {
        Object.assign(data.editRow, data.editForm)
        data.editing = false
    }
}

const onDelete = async (row: Column) => {
    await props.delete(row)
}

const onUp = async (row: Column) => {
    await props.up(row)
}

const onDown = async (row: Column) => {
    await props.down(row)
}

defineExpose({
    fetchSchema
})
</script>

<script lang="ts">
export class Column {
    show = true
    name = ''
    type = ''
    default = ''
    comment = ''
    notnull = false
    primary = false
    increment = false
    unique = false
    refTable = ""
    refColumn = ""
    refKey = ""
    nameError = ''
    typeError = ''
    refError = ""
    check() {
        if (!this.name) {
            this.nameError = "name required"
            return false
        }
        if (!this.type) {
            this.typeError = "type required"
            return false
        }
        if (this.refTable && !this.refColumn) {
            this.refError = "reference column required"
            return false
        }
        if (this.increment) {
            this.primary = true
        }
        if (this.primary) {
            this.notnull = true
        }
        return true
    }

    sql() {
        let s = `${this.name} ${this.type}`;
        if (this.default) {
            s += ` default ${this.default}`;
        }
        if (this.comment) {
            s += ` comment '${this.comment}'`;
        }
        if (this.notnull) {
            s += ` not null`;
        } else {
            s += ` null`;
        }
        if (this.increment) {
            s += " auto_increment";
        }
        return s;
    }
}

</script>

<template>
    <TableVue
        :rows="props.rows"
        :total="props.rows.length"
        :pageSize="5"
        :actionWidth="150"
        :enablePage="true"
        :enableAdd="true"
        :enableEdit="true"
        :enableDelete="true"
        @fetch="onFetch"
        @add="onAdd"
        @edit="onEdit"
        @delete="onDelete"
    >
        <template #default>
            <el-table-column prop="name" label="name" resizable />
            <el-table-column prop="type" label="type" resizable />
            <el-table-column prop="default" label="default" resizable />
            <el-table-column prop="comment" label="comment" resizable />
            <el-table-column label="primary key" resizable>
                <template #default="{ row }">
                    <el-switch v-model="row.primary" disabled />
                </template>
            </el-table-column>
            <el-table-column label="increment" resizable>
                <template #default="{ row }">
                    <el-switch v-model="row.increment" disabled />
                </template>
            </el-table-column>
            <el-table-column label="unique" resizable>
                <template #default="{ row }">
                    <el-switch v-model="row.unique" disabled />
                </template>
            </el-table-column>
            <el-table-column label="notnull" resizable>
                <template #default="{ row }">
                    <el-switch v-model="row.notnull" disabled />
                </template>
            </el-table-column>
            <el-table-column label="foreign key" resizable>
                <template
                    #default="{ row }"
                >{{ row.refTable !== '' ? `${row.refTable}.${row.refColumn}` : '' }}</template>
            </el-table-column>
        </template>
        <template #actionSuffix="{ row }">
            <el-button circle @click="onDown(row)" :icon="SortDown" />
            <el-button circle @click="onUp(row)" :icon="SortUp" />
        </template>
    </TableVue>
    <Form
        title="Add Data"
        :show="data.adding"
        :model="data.addForm"
        @submit="onAddSubmit"
        @cancel="data.adding = false"
    >
        <template #default>
            <el-form-item label="name" :error="data.addForm.nameError" required>
                <el-input v-model="data.addForm.name" clearable />
            </el-form-item>
            <el-form-item label="type" :error="data.addForm.typeError" required>
                <el-autocomplete
                    style="width: 100%;"
                    v-model="data.addForm.type"
                    :fetch-suggestions="autocomplete"
                    clearable
                />
            </el-form-item>
            <el-form-item label="default">
                <el-input v-model="data.addForm.default" clearable />
            </el-form-item>
            <el-form-item label="comment">
                <el-input v-model="data.addForm.comment" clearable />
            </el-form-item>
            <el-form-item>
                <el-row :gutter="10">
                    <el-checkbox
                        v-model="data.addForm.primary"
                        label="primary key"
                        border
                    />
                    <el-checkbox
                        v-model="data.addForm.increment"
                        label="auto increment"
                        border
                    />
                    <el-checkbox
                        v-model="data.addForm.unique"
                        label="unique"
                        border
                    />
                    <el-checkbox
                        v-model="data.addForm.notnull"
                        label="not null"
                        border
                    />
                </el-row>
            </el-form-item>
            <el-form-item>
                <template #label>
                    <el-space :size="10">
                        <span>foreign key</span>
                        <el-button
                            type="success"
                            plain
                            size="mini"
                            @click="fetchSchema"
                        >Refresh</el-button>
                    </el-space>
                </template>
                <ForeignKeyVue
                    :tables="data.refTables"
                    :table="data.addForm.refTable"
                    @udpate:table="v => { data.addForm.refTable = v }"
                    :column="data.addForm.refColumn"
                    @udpate:column="v => { data.addForm.refColumn = v }"
                />
            </el-form-item>
        </template>
    </Form>
    <Form
        title="Edit Data"
        :show="data.editing"
        :model="data.editForm"
        @submit="onEditSubmit"
        @cancel="data.editing = false"
    >
        <template #default>
            <el-form-item
                label="name"
                :error="data.editForm.nameError"
                required
            >
                <el-input
                    v-model="data.editForm.name"
                    :placeholder="data.editRow.name"
                    clearable
                />
            </el-form-item>
            <el-form-item
                label="type"
                :error="data.editForm.typeError"
                required
            >
                <el-autocomplete
                    style="width: 100%;"
                    v-model="data.editForm.type"
                    :placeholder="data.editRow.type"
                    :fetch-suggestions="autocomplete"
                    clearable
                />
            </el-form-item>
            <el-form-item label="default">
                <el-input
                    v-model="data.editForm.default"
                    :placeholder="data.editRow.default"
                    clearable
                />
            </el-form-item>
            <el-form-item label="comment">
                <el-input
                    v-model="data.editForm.comment"
                    :placeholder="data.editRow.comment"
                    clearable
                />
            </el-form-item>
            <el-form-item>
                <el-row :gutter="10">
                    <el-checkbox
                        v-model="data.editForm.primary"
                        label="primary key"
                        border
                    />
                    <el-checkbox
                        v-model="data.editForm.increment"
                        label="auto increment"
                        border
                    />
                    <el-checkbox
                        v-model="data.editForm.unique"
                        label="unique"
                        border
                    />
                    <el-checkbox
                        v-model="data.editForm.notnull"
                        label="not null"
                        border
                    />
                </el-row>
            </el-form-item>
            <el-form-item>
                <template #label>
                    <el-space :size="10">
                        <span>foreign key</span>
                        <el-button
                            type="success"
                            plain
                            size="mini"
                            @click="fetchSchema"
                        >Refresh</el-button>
                    </el-space>
                </template>
                <ForeignKeyVue
                    :tables="data.refTables"
                    :table="data.editForm.refTable"
                    @udpate:table="v => { data.editForm.refTable = v }"
                    :column="data.editForm.refColumn"
                    @udpate:column="v => { data.editForm.refColumn = v }"
                    v-model:table="data.editForm.refTable"
                    v-model:column="data.editForm.refColumn"
                />
            </el-form-item>
        </template>
    </Form>
</template>
