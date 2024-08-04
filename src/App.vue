<script setup lang="ts">
import {ref} from "vue";
import SimpleNote from '@/component/simpleNote/index.vue'
import Setting from '@/component/setting/index.vue'
import {ElMessageBox} from "element-plus";

const pluginCode = ref<string>('')
utools.onPluginEnter(({code}) => {
    const notesDir = utools.db.get('jianji-notes-dir')?.value
    window.p.setNotesDir(notesDir || '')
    if (code !== 'jj-setting') {
        let message = ''
        if (!notesDir) {
            message = '尚未设置存放笔记的文件夹，请先设置'
        } else if (!window.p.isNotesDirExist()) {
            message = `文件夹「${notesDir}」不存在，请重新设置`
        }
        if (message) {
            pluginCode.value = 'jj-setting'
            ElMessageBox.alert(message, '提示', {
                showClose: false,
                confirmButtonText: '确定'
            })
            return
        }
    } else if (notesDir && !window.p.isNotesDirExist()) {
        ElMessageBox.alert(`文件夹「${notesDir}」不存在，请重新设置`, '提示', {
            showClose: false,
            confirmButtonText: '确定'
        })
    }
    pluginCode.value = code
})
utools.onPluginOut(() => {
    ElMessageBox.close()
    pluginCode.value = ''
})

</script>

<template>
    <Setting v-if="pluginCode === 'jj-setting'"></Setting>
    <SimpleNote v-else-if="pluginCode" :plugin-code="pluginCode"></SimpleNote>
</template>

<style scoped>

</style>