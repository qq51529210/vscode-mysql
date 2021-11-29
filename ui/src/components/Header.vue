<script setup lang="ts">
const props = defineProps(['connection', 'schema', 'table'])
</script>

<template>
    <el-breadcrumb style="margin:20px 0">
        <el-breadcrumb-item>{{ props.connection }}</el-breadcrumb-item>
        <el-breadcrumb-item v-if="props.schema">{{ props.schema }}</el-breadcrumb-item>
        <el-breadcrumb-item v-if="props.table">{{ props.table }}</el-breadcrumb-item>
    </el-breadcrumb>
</template>
