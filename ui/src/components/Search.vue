<script setup lang="ts">
import { ref, } from 'vue'

import { Search } from '@element-plus/icons'

const props = defineProps(['placeholder', 'show', 'value'])

const emits = defineEmits(['submit', 'cancel'])

const text = ref('')

const onSubmit = () => {
  emits('submit', text.value)
}

const onCancel = () => {
  emits('cancel')
}

</script>

<template>
  <el-dialog
    :model-value="props.show"
    :show-close="false"
    title="Search"
    destroy-on-close
    @close="onCancel"
  >
    <el-input v-model="text" :placeholder="props.placeholder" clearable>
      <template #append>
        <el-button type="primary" :icon="Search" @click="onSubmit" />
      </template>
    </el-input>
  </el-dialog>
</template>
