<script setup lang="ts">
import {ref} from "vue";
import {ElMessage} from "element-plus";

const notesDir = ref<string>(window.p.getNotesDir())
const handleBtnClick = () => {
    const files = utools.showOpenDialog({
        properties: ['openDirectory']
    })
    if (files && files.length) {
        notesDir.value = files[0]
        utools.db.remove('jianji-notes-dir')
        const res = utools.db.put({
            _id: 'jianji-notes-dir',
            value: notesDir.value
        })
        if (res.ok) {
            ElMessage.success({
                message: '设置成功',
                showClose: true
            })
        } else {
            ElMessage.error({
                message: res.message || '设置失败',
                showClose: true
            })
        }
    }
}

</script>

<template>
    <div class="main-container">
        <h3 class="title">
            设置存放笔记的文件夹
        </h3>
        <el-input :value="notesDir" readonly>
            <template #append>
                <el-button style="background-color: #597ef7; color: white" @click="handleBtnClick">选择文件夹
                </el-button>
            </template>
        </el-input>
    </div>
</template>

<style scoped>
.main-container {
    width: 70%;
    margin: 30px auto 0 auto;
}

.title {
    color: #597ef7;
    line-height: 1.5;
}

</style>