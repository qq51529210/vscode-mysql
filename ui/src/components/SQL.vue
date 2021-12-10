<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import CodeMirror, { EditorFromTextArea } from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/hint/sql-hint'

const props = defineProps(['modelValue', 'disabled'])
const emits = defineEmits(['update:modelValue'])

const textarea = ref()
let editor: EditorFromTextArea

watch(() => props.modelValue, v => {
    if (v && v != editor.getValue()) {
        editor.setValue(v)
    }
})

onMounted(() => {
    editor = CodeMirror.fromTextArea(textarea.value, {
        mode: 'text/x-mysql',
        lineNumbers: true,
        readOnly: props.disabled,
    })
    editor.setValue(props.modelValue)
    editor.on('change', () => {
        emits('update:modelValue', editor.getValue())
    })
})

</script>

<template>
    <textarea ref="textarea" />
</template>

<style>
.CodeMirror {
    margin-top: 20px;
    margin-bottom: 20px;
    border: 1px solid var(--el-border-color-base);
}
</style>