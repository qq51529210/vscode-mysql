<script setup lang="ts">
const props = defineProps(['show', 'items'])
const emits = defineEmits(['close'])
</script>
<script lang="ts">
export interface Item {
    name: string
    show: boolean
}
</script>
<template>
    <el-dialog
        destroy-on-close
        title="Filter"
        :model-value="props.show"
        :fullscreen="true"
        :close-on-click-modal="false"
        @close="emits('close')"
    >
        <template v-for="item in items">
            <div>
                <el-checkbox v-model="item.show" :label="item.name" />
            </div>
        </template>
    </el-dialog>
</template>
