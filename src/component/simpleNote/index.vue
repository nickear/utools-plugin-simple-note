<script setup lang="ts">
import {onBeforeUnmount, ref, shallowRef, nextTick, watchEffect, onMounted} from 'vue'
import {Editor, Toolbar} from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css' // 引入 css
import {IDomEditor} from "@wangeditor/editor";
import {ElMessage, ElMessageBox} from "element-plus";
import ContextMenu from '@/component/contextMenu/index.vue'
import draggable from 'vuedraggable'
import {ElMessageBoxOptions} from "element-plus/es/components/message-box/src/message-box.type";

const props = defineProps(['pluginCode'])
// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef<IDomEditor>()
const toolbarConfig = {
    excludeKeys: [
        'undo', // 撤销
        'redo', // 重做
        '|', // |
        // 'fontFamily', // 字体
        // 'lineHeight', // 行高
        // 'group-indent', // 缩进
        // 'group-video', // 视频
        'fullScreen', // 全屏
        // 'bold', // 粗体
        // 'underline', // 下划线
        // 'italic', // 斜体
        // 'group-more-style' // ...（删除线、行内代码、清除格式等）
    ],
}
const editorConfig = {
    autoFocus: false,
    // hoverbarKeys: {
    //     text: {
    //         menuKeys: ['headerSelect', 'insertLink', 'bold', 'underline', 'italic', 'through', 'code', 'color', 'bgColor', 'clearStyle']
    //     }
    // }
}
const mode = 'default' // 或'simple'

interface NoteInfo {
    createTime: string;
    lastModifyTime: string
    textLength: number
}

const noteInfo = ref<NoteInfo>({
    createTime: '-',
    lastModifyTime: '-',
    textLength: 0
})
const noteList = ref<string[]>([])
const noteListDisplay = ref<string[]>([])
const search = ref<string>('')
const notesWithKeyword = ref<string[]>([])
const lastChildrenStr = ref<string>('')
const showSidebar = ref<boolean>(true)
const content = ref<string>('<p></p>')
const openedNote = ref<string>('') // 当前打开的笔记
const title = ref<string>('')
const titleRef = ref<any>()
const showEditor = ref<boolean>(false)
const contextMenuVisible = ref<boolean>(false)
const contextMenuLeft = ref<string>('')
const contextMenuTop = ref<string>('')
const contextMenuNote = ref<string>('') // 鼠标右键点击的笔记
const tipsVisible = ref<boolean>(false)

// const isLock = ref<boolean>(false)
// interface KeywordMapping {
//     [key: string]: string;
// }
//
// const keywordMapping = ref<KeywordMapping>({})

const saveProfile = () => {
    window.p.saveProfile({
        lastOpenedNote: openedNote.value,
        notesOrder: noteList.value
    })
}

const handleNoteChange = (note: string, isNewNote?: boolean) => {
    title.value = note
    openedNote.value = note
    showEditor.value = false
    content.value = isNewNote ? '<p></p>' : window.p.getNoteContent(note)
    nextTick(() => {
        showEditor.value = true
        /**
         * 新建笔记时对title进行全选
         * 虽title赋值了，但input中不会立即有文本，故无法选中文本，因此放到nextTick
         */
        if (isNewNote) {
            titleRef.value.select()
        }
    })
    saveProfile()
}

const handleCreated = (editor: IDomEditor) => {
    editorRef.value = editor // 记录 editor 实例，重要！
    lastChildrenStr.value = JSON.stringify(editor.children)
}

const handleNoteContextMenu = (event: MouseEvent, note: string) => {
    contextMenuLeft.value = event.clientX + 'px';
    contextMenuTop.value = event.clientY + 'px';
    contextMenuVisible.value = true;
    contextMenuNote.value = note
}
const handleOverlayClick = () => {
    // 点击遮罩层的任意位置，隐藏上下文菜单。由于上下文菜单在遮罩层之上，故点击上下文菜单时，不会触发该事件
    contextMenuVisible.value = false
}

const handleMenuClick = (menuName: any) => {
    if (menuName === '删除笔记') {
        removeNote(contextMenuNote.value)
    }
    contextMenuVisible.value = false
}
const handleRemoveBtnClick = () => {
    removeNote(openedNote.value)
}
const removeNote = (note: string) => {
    ElMessageBox.confirm(
        `确定删除笔记「${note}」？笔记删除后将无法恢复！！！`,
        '提示',
        {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
        } as ElMessageBoxOptions
    )
        .then(() => {
            window.p.removeNote(note)
            ElMessage.success({
                message: '删除成功',
                showClose: true
            })
            if (notesWithKeyword.value.includes(note)) {
                removeKeyword(note)
            }
            const index = noteList.value.indexOf(note)
            noteList.value.splice(index, 1)
            if (noteList.value.length && note === openedNote.value) {
                // handleNoteChange中会执行saveProfile
                handleNoteChange(noteList.value[index] || noteList.value[index - 1], false)
            } else {
                saveProfile()
            }
        })
}
const handleNoteClick = (note: string) => {
    if (note === openedNote.value) {
        return
    }
    handleNoteChange(note, false)
}
const handleNoteAddBtnClick = () => {
    const note = window.p.createNewNote()
    noteList.value.push(note)
    handleNoteChange(note, true)
}

const handleFolderOpenBtnClick = () => {
    utools.shellOpenPath(window.p.getNotesDir())
}

const handleDraggableChange = () => {
    saveProfile()
}

const handleTitleInput = (val: string) => {
    const pattern = /[\\/:*?"<>|]/
    if (pattern.test(val)) {
        tipsVisible.value = true
        title.value = val.replace(pattern, '')
    } else {
        tipsVisible.value = false
    }
}

const handleTitleChange = (newTitle: string) => {
    if (noteList.value.indexOf(newTitle) !== -1) {
        ElMessage.warning({
            message: '修改失败，笔记名称重复',
            showClose: true
        })
        title.value = openedNote.value
        return
    }
    window.p.renameNote(openedNote.value, newTitle)
    if (notesWithKeyword.value.includes(openedNote.value)) {
        removeKeyword(openedNote.value)
    }
    noteList.value[noteList.value.indexOf(openedNote.value)] = newTitle
    openedNote.value = newTitle
    saveProfile()
}
const handleEditorChange = (editor: IDomEditor) => {
    const childrenStr = JSON.stringify(editor.children)
    if (childrenStr === lastChildrenStr.value) {
        return
    } else {
        lastChildrenStr.value = childrenStr
        window.p.saveNote(openedNote.value, editor.getHtml())
    }
}

const handleInfoBtnClick = () => {
    noteInfo.value = {
        ...window.p.getNoteInfo(openedNote.value),
        textLength: editorRef.value!.getText().replaceAll('\n', '').length
    }
}

const handleKeywordBtnClick = () => {
    if (!title.value) {
        ElMessage.warning({
            message: '笔记名称为空，不能设置为utools关键字',
            showClose: true
        })
        return
    }

    if (notesWithKeyword.value.includes(openedNote.value)) {
        removeKeyword(openedNote.value)
    } else {
        addKeyword(openedNote.value)
    }
}

const removeKeyword = (note: string) => {
    const b = utools.removeFeature(note)
    if (b) {
        notesWithKeyword.value = notesWithKeyword.value.filter((noteWithKeyword: string) => noteWithKeyword !== note)
        ElMessage.success({
            message: `已移除「${note}」utools关键字`,
            showClose: true
        })
    } else {
        // 处理 removeFeature 错误
    }
}

const addKeyword = (note: string) => {
    const b = utools.setFeature({
        "code": note,
        "explain": note,
        "platform": ["win32", "darwin", "linux"],
        "cmds": [note]
    })
    if (b) {
        notesWithKeyword.value.push(note)
        ElMessage.success({
            message: `设置成功，外部可搜索「${note}」打开笔记`,
            showClose: true
        })
    } else {
        // 处理 setFeature 错误
    }
}

// const handleLockBtnClick = () => {
//     if (isLock.value) {
//         isLock.value = false
//         editorRef.value.enable()
//     } else {
//         isLock.value = true
//         editorRef.value.disable()
//     }
// }

watchEffect(() => {
    if (search.value) {
        noteListDisplay.value = noteList.value.filter((note: string) => note.includes(search.value))
    } else {
        noteListDisplay.value = noteList.value
    }
})
onMounted(() => {
    const features = utools.getFeatures()
    notesWithKeyword.value = features.map((feature: any) => feature.code)

    const {noteList: _noteList, lastOpenedNote} = window.p.getNoteListAndLastOpenedNote()
    noteList.value = _noteList

    if (props.pluginCode === 'jj') {
        if (noteList.value.length) {
            handleNoteChange(lastOpenedNote || noteList.value[0], false)
        }
    } else {
        let note = noteList.value.find((note: string) => note === props.pluginCode)
        if (!note) {
            ElMessage.warning({
                message: '未找到对应的笔记',
                showClose: true
            })
            if (noteList.value.length) {
                handleNoteChange(lastOpenedNote || noteList.value[0], false)
            }
        } else {
            showSidebar.value = false
            handleNoteChange(note, false)
        }
    }

    utools.setSubInput(({text}: any) => {
        search.value = text
    })
})

onBeforeUnmount(() => {
    // 组件销毁时，也及时销毁编辑器
    const editor = editorRef.value
    if (editor == null) return
    editor.destroy()
})
</script>

<template>
    <div class="main-container">
        <div class="left" v-show="showSidebar">
            <div class="header left-header">
                <div class="header-btn left-header-btn" title="新建笔记" @click="handleNoteAddBtnClick">
                    <img src="@/assets/file-add.svg">
                </div>
                <div class="header-btn left-header-btn" title="打开笔记所在文件夹" @click="handleFolderOpenBtnClick">
                    <img src="@/assets/folder-open.svg">
                </div>
            </div>
            <div style="height: calc(100vh - 40px); overflow-y: auto">
                <draggable :list="noteListDisplay" ghost-class="ghost"
                           :item-key="(item: string) => item" :disabled="search"
                           @change="handleDraggableChange">
                    <template #item="{element}">
                        <div :class="[
                         'note-item',
                         {'note-item-selected': element === openedNote},
                         {'note-item-underline': notesWithKeyword.includes(element)}
                         ]"
                             @click="handleNoteClick(element)"
                             @contextmenu="handleNoteContextMenu($event, element)">
                            {{ element }}
                        </div>
                    </template>
                </draggable>
                <div v-if="contextMenuVisible" class="overlay" @click="handleOverlayClick"></div>
                <ContextMenu
                        v-if="contextMenuVisible"
                        :left="contextMenuLeft"
                        :top="contextMenuTop"
                        @menu-click="handleMenuClick"
                />
            </div>
        </div>
        <div class="right">
            <div v-if="noteList.length" style="display: flex; flex-direction: column; height: 100vh">
                <div class="header right-header">
                    <div class="header-btn right-header-btn" :title="showSidebar ? '隐藏侧边栏' : '显示侧边栏'"
                         @click="showSidebar=!showSidebar">
                        <img v-if="showSidebar" src="@/assets/double-left.svg">
                        <img v-else src="@/assets/double-right.svg">
                    </div>
                    <div class="title">
                        <el-popover
                                :visible="tipsVisible"
                                placement="bottom"
                                :width="270"
                                content='笔记名不能包含\/:*?"<>|中的任何字符'
                        >
                            <template #reference>
                                <el-input v-model="title" ref="titleRef"
                                          @input="handleTitleInput"
                                          @blur="tipsVisible=false"
                                          @change="handleTitleChange"></el-input>
                            </template>
                        </el-popover>
                    </div>
                    <el-popover
                            placement="bottom"
                            :width="250"
                            trigger="click"
                    >
                        <template #reference>
                            <div class="header-btn right-header-btn" @click="handleInfoBtnClick" title="笔记信息">
                                <img src="@/assets/info.svg">
                            </div>
                        </template>
                        <div>
                            <el-row>
                                <el-col :span="8">创建时间</el-col>
                                <el-col style="text-align: right" :span="16">{{ noteInfo.createTime }}</el-col>
                            </el-row>
                            <el-row style="margin-top: 5px">
                                <el-col :span="8">最后修改</el-col>
                                <el-col style="text-align: right" :span="16">{{ noteInfo.lastModifyTime }}</el-col>
                            </el-row>
                            <el-row style="margin-top: 5px">
                                <el-col :span="8">字数</el-col>
                                <el-col style="text-align: right" :span="16">{{ noteInfo.textLength }}</el-col>
                            </el-row>
                        </div>
                    </el-popover>
                    <div class="header-btn right-header-btn"
                         :title="notesWithKeyword.includes(openedNote) ? '移除utools关键字' : '设为utools关键字'"
                         @click="handleKeywordBtnClick">
                        <img v-if="notesWithKeyword.includes(openedNote)" src="@/assets/star-fill.svg">
                        <img v-else src="@/assets/star.svg">
                    </div>
                    <!--                <div class="header-btn right-header-btn" :title="isLock ? '解锁笔记，可编辑' : '锁定笔记，不可编辑'"-->
                    <!--                     @click="handleLockBtnClick">-->
                    <!--                    <img v-if="isLock" src="@/assets/lock.svg">-->
                    <!--                    <img v-else src="@/assets/unlock.svg">-->
                    <!--                </div>-->
                    <div class="header-btn right-header-btn" title="删除" @click="handleRemoveBtnClick">
                        <img src="@/assets/delete.svg">
                    </div>
                </div>
                <Toolbar
                        v-if="showEditor"
                        style="border-bottom: 1px solid #ccc"
                        :editor="editorRef"
                        :defaultConfig="toolbarConfig"
                        :mode="mode"
                />
                <Editor
                        v-if="showEditor"
                        style="flex: 1; overflow-y: auto;"
                        v-model="content"
                        :defaultConfig="editorConfig"
                        :mode="mode"
                        @onCreated="handleCreated"
                        @onChange="handleEditorChange"
                />
            </div>
            <el-empty v-else description="空空如也" style="margin-top: 40px">
                <el-button @click="handleNoteAddBtnClick">新建一条笔记</el-button>
            </el-empty>
        </div>
    </div>
</template>

<style scoped>
.main-container {
    display: flex;
}

.left {
    width: 22.5%;
    background-color: #F4F4F4;
}

.right {
    flex: 1;
    background-color: white;
}

.header {
    display: flex;
    align-items: center;
    height: 39px;
    border-bottom: 1px solid #ccc;
}

.header-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 35px;
    height: 35px;
    cursor: pointer;
}

.header-btn:hover {
    background-color: #EAEAEA;
}

.left-header {
    padding: 0 10px;
}

.left-header-btn {
    border-radius: 50%;
}

.right-header {
    padding: 0 2px;
}

.right-header-btn {
    border-radius: 10px;
}

.title {
    flex: 1;
}

:deep(.title .el-input__wrapper) {
    box-shadow: none;
    padding: 1px 5px;
}

:deep(.title .el-input__inner) {
    font-size: 20px;
    color: #000000;
}

.note-item {
    font-size: 14px;
    height: 30px;
    line-height: 30px;
    cursor: pointer;
    padding: 0 10px;
    position: relative;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.note-item-underline {
    text-decoration: underline;
}

.note-item:hover {
    background-color: #EAEAEA;
}

.note-item-selected, .note-item-selected:hover {
    background-color: #D7D7D7;
}

:deep(.w-e-text-container [data-slate-editor] p) {
    margin: 2px 0;
}

:deep(.w-e-text-container [data-slate-editor]) {
    padding: 15px 10px;
}

:deep(.w-e-bar) {
    /*padding: 0;*/
}

:deep(.w-e-bar-item) {
    padding: 2px;
}

.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vh;
    height: 100vh;
    background-color: transparent;
    z-index: 999; /* 确保上下文菜单在遮罩层在之上 */
}

.ghost {
    border-bottom: 2px solid #597ef7;
}
</style>