<script setup lang="ts">
import { reactive, watch } from 'vue'
import { Search, Plus, Filter, Edit, Delete } from "@element-plus/icons"

const props = defineProps([
    'columns', 'rows', 'total',
    'pageSize', 'actionWidth', 'searchPlaceholder',
    'enablePage', "hideAction",
    'enableSearch', 'enableAdd', 'enableFilter',
    'enableEdit', 'enableDelete'
])

const emits = defineEmits(['fetch', 'add', 'edit', 'delete'])

const data = reactive({
    page: 1,
    pageSize: props.pageSize,
    searching: false,
    searchText: '',
    filtering: false,
    columns: props.columns,
})

const emitFetch = () => {
    emits('fetch', {
        offset: (data.page - 1) * data.pageSize,
        count: data.pageSize,
        search: data.searchText
    })
}

const onSizeChange = (v: number) => {
    data.pageSize = v
    emitFetch()
}

const onPageChange = (v: number) => {
    data.page = v
    emitFetch()
}

const onSearch = (v: number) => {
    emitFetch()
    data.searching = false
}

watch(
    () => props.columns,
    (columns: any[]) => {
        data.columns = data.columns.filter((v1: any) =>
            columns.findIndex(v2 => v2.name === v1.name) !== -1
        )
        data.columns = columns.map(v1 => {
            let m = data.columns.find((v2: any) => v2.name === v1.name)
            if (m) {
                v1.show = m.show
            }
            return v1
        })
    }
)
</script>

<template>
    <!-- table -->
    <el-table border stripe :columns="props.columns" :data="props.rows">
        <slot>
            <template v-for="v in props.columns">
                <el-table-column
                    v-if="v.show"
                    :prop="v.name"
                    :label="v.name"
                    resizable
                />
            </template>
        </slot>
        <slot v-if="!props.hideAction" name="action">
            <el-table-column
                fixed="right"
                :width="props.actionWidth"
                align="center"
            >
                <template #header>
                    <el-button-group size="mini">
                        <el-button
                            v-if="props.enableSearch"
                            circle
                            :icon="Search"
                            @click="data.searching = true"
                        />
                        <el-button
                            v-if="props.enableAdd"
                            circle
                            type="success"
                            :icon="Plus"
                            @click="emits('add')"
                        />
                        <el-button
                            v-if="props.enableFilter"
                            circle
                            type="warning"
                            :icon="Filter"
                            @click="data.filtering = true"
                        />
                    </el-button-group>
                </template>
                <template #default="{ row }">
                    <el-button-group size="mini">
                        <slot name="actionPrefix" :row="row"></slot>
                        <el-button
                            v-if="props.enableEdit"
                            circle
                            type="primary"
                            @click="emits('edit', row)"
                            :icon="Edit"
                        />
                        <el-popconfirm
                            v-if="props.enableDelete"
                            title="Are you sure to delete this data?"
                            @confirm="emits('delete', row)"
                        >
                            <template #reference>
                                <el-button circle type="danger" :icon="Delete" />
                            </template>
                        </el-popconfirm>
                        <slot name="actionSuffix" :row="row"></slot>
                    </el-button-group>
                </template>
            </el-table-column>
        </slot>
    </el-table>
    <!-- pagination -->
    <el-row v-if="props.enablePage" justify="end" style="margin-top:10px;">
        <el-pagination
            layout="total, sizes, prev, pager, next"
            :total="props.total"
            :currentPage="data.page"
            :pageSize="data.pageSize"
            :defaultPageSize="5"
            :pageSizes="[5, 10, 15, 20]"
            @sizeChange="onSizeChange"
            @currentChange="onPageChange"
            :hideOnSinglePage="false"
        />
    </el-row>
    <!-- search -->
    <el-dialog
        :model-value="data.searching"
        :show-close="false"
        title="Search"
        destroy-on-close
        @close="data.searching = false"
    >
        <el-input
            v-model="data.searchText"
            :placeholder="props.searchPlaceholder"
            clearable
        >
            <template #append>
                <el-button type="primary" :icon="Search" @click="onSearch" />
            </template>
        </el-input>
    </el-dialog>
    <!-- filter column -->
    <el-dialog
        destroy-on-close
        title="Filter Column"
        :model-value="data.filtering"
        :fullscreen="true"
        :close-on-click-modal="false"
        @close="data.filtering = false"
    >
        <template v-for="v in props.columns">
            <div>
                <el-checkbox v-model="v.show" :label="v.name" />
            </div>
        </template>
    </el-dialog>
</template>

