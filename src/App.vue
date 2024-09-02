<script setup lang="ts">
import {ref} from "vue";
import SimpleNote from '@/component/simpleNote/index.vue'
import Setting from '@/component/setting/index.vue'
import {ElMessageBox} from "element-plus";

const pluginCode = ref<string>('')
utools.onPluginEnter(({code}) => {
    const notesDir = utools.db.get('jianji-notes-dir')?.value
    window.p.setNotesDir(notesDir || '')
    if (!notesDir) {
        pluginCode.value = 'jj-setting'
    } else if (!window.p.isNotesDirExist()) {
        pluginCode.value = 'jj-setting'
        ElMessageBox.alert(`文件夹「${notesDir}」不存在，请重新设置`, '提示', {
            showClose: false,
            confirmButtonText: '确定'
        })
    } else {
        pluginCode.value = code
    }
})
utools.onPluginOut(() => {
    ElMessageBox.close()
    pluginCode.value = ''
})

</script>

<template>
    <Setting v-if="pluginCode === 'jj-setting'" @back="pluginCode = 'jj'"></Setting>
    <SimpleNote v-else-if="pluginCode" :plugin-code="pluginCode" @setting="pluginCode = 'jj-setting'"></SimpleNote>
</template>

<style scoped>

</style>