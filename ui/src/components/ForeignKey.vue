<script setup lang="ts">
import { reactive, computed } from "vue"

const props = defineProps(['tables', 'table', 'column'])

const emits = defineEmits(['udpate:table', 'udpate:column'])

const data = reactive({
    table: new Table('', [])
})

const tableNames = computed(() =>
    props.tables.map((v: Table) => v.name)
)

const onTableChange = (table: string) => {
    if (table != data.table.name) {
        data.table = props.tables.find((v: Table) => v.name === table)
        emits('udpate:table', table)
        emits('udpate:column', '')
    }
}

const onColumnChange = (column: string) => {
    emits('udpate:column', column)
}
</script>

<script lang="ts">
export class Table {
    name = ""
    columns: string[] = []
    constructor(name: string, columns: string[]) {
        this.name = name
        this.columns = columns
    }
}
</script>

<template>
    <el-row :gutter="10" justify="space-around">
        <el-col :span="12">
            <el-select
                style="width: 100%;"
                :model-value="props.table"
                placeholder="Table"
                clearable
                @change="onTableChange"
            >
                <el-option v-for="v in tableNames" :label="v" :value="v" />
            </el-select>
        </el-col>
        <el-col :span="12">
            <el-select
                style="width: 100%;"
                :model-value="props.column"
                placeholder="Column"
                @change="onColumnChange"
            >
                <el-option
                    v-for="v in data.table.columns"
                    :label="v"
                    :value="v"
                />
            </el-select>
        </el-col>
    </el-row>
</template>