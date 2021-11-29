<script setup lang="ts">
const props = defineProps(['title', 'items', 'model', 'show'])
const emits = defineEmits(['submit', 'cancel'])
</script>

<template>
    <el-dialog
        destroy-on-close
        :title="props.title"
        :model-value="props.show"
        :fullscreen="true"
        :show-close="false"
        :close-on-click-modal="false"
    >
        <el-form labelPosition="top" size="small">
            <slot>
                <template v-for="column in props.items">
                    <el-form-item
                        :label="column.label"
                        :error="column.error"
                        :required="column.required"
                    >
                        <el-input
                            v-model="props.model[column.name]"
                            :placeholder="column.placeholder + ''"
                            clearable
                            :disabled="column.disabled"
                        />
                    </el-form-item>
                </template>
            </slot>
            <slot name="footer">
                <el-form-item>
                    <el-button
                        type="primary"
                        size="small"
                        @click="emits('submit')"
                    >Submit</el-button>
                    <el-button
                        type="danger"
                        size="small"
                        @click="emits('cancel')"
                    >Cancel</el-button>
                </el-form-item>
            </slot>
        </el-form>
    </el-dialog>
</template>