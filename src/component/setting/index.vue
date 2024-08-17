<script setup lang="ts">
import {ref} from "vue";
import {ElMessage, ElMessageBox} from "element-plus";
import {ElMessageBoxOptions} from "element-plus/es/components/message-box/src/message-box.type";

const notesDir = ref<string>(window.p.getNotesDir())
const loading = ref<boolean>(false)
const handleBtnClick = () => {
    const files = utools.showOpenDialog({
        properties: ['openDirectory']
    })
    if (files && files.length) {
        if (files[0] === notesDir.value) {
            ElMessage.success({
                message: '设置成功',
                showClose: true
            })
            return
        }
        utools.db.remove('jianji-notes-dir')
        const res = utools.db.put({
            _id: 'jianji-notes-dir',
            value: files[0],
        })
        if (res.ok) {
            const oldNotesDir = notesDir.value
            notesDir.value = files[0]
            if (oldNotesDir) {
                ElMessageBox.confirm(
                    `设置成功！是否将旧文件夹中的笔记迁移到新文件夹？`,
                    '提示',
                    {
                        confirmButtonText: '确认迁移',
                        cancelButtonText: '取消',
                        type: 'success',
                    } as ElMessageBoxOptions
                )
                    .then(async () => {
                        loading.value = true
                        const {
                            successCount,
                            targetCount
                        } = await window.p.moveNotesAndProfile(oldNotesDir, notesDir.value)
                        loading.value = false
                        if (targetCount === 0) {
                            ElMessage.info({
                                message: '旧文件夹下没有要迁移的笔记',
                                showClose: true
                            })
                        } else if (successCount === 0) {
                            ElMessage.warning({
                                message: '迁移失败',
                                showClose: true
                            })
                        } else if (successCount === targetCount) {
                            ElMessage.success({
                                message: '迁移成功',
                                showClose: true
                            })
                        } else {
                            ElMessage.info({
                                message: `迁移成功${successCount}个笔记，迁移失败${targetCount - successCount}个笔记`,
                                showClose: true
                            })
                        }
                    })
            } else {
                ElMessage.success({
                    message: '设置成功',
                    showClose: true
                })
            }
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
    <div class="main-container" v-loading="loading">
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