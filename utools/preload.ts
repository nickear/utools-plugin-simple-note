// 您可以在进行窗口交互
// utools文档

// https://www.u.tools/docs/developer/api.html#%E7%AA%97%E5%8F%A3%E4%BA%A4%E4%BA%92
import * as fs from "fs";
import * as path from "path";
import {debounce} from "lodash";
import * as fsp from 'fs/promises'

interface Profile {
    lastOpenedNote: string; // 最后打开的笔记
    notesOrder: string[]; // 笔记的顺序
}

let notesDir = ''

const setNotesDir = (_notesDir: string) => {
    notesDir = _notesDir
}

const getNotesDir = () => {
    return notesDir
}

const isNotesDirExist = () => {
    return fs.existsSync(notesDir)
}

const getNotePath = (note: string) => {
    return path.join(notesDir, `${note}.jianji`)
}

const getProfilePath = () => {
    return path.join(notesDir, '简记配置文件（勿删）.json')
}

const getNoteListAndLastOpenedNote = (): { noteList: string[], lastOpenedNote: string } => {
    const files = fs.readdirSync(notesDir)
    if (files.length === 0) {
        return {
            noteList: [],
            lastOpenedNote: ''
        }
    }
    const noteList = files
        .filter((file: string) =>
            fs.statSync(path.join(notesDir, file)).isFile() && path.extname(file) === '.jianji')
        .map((file: string) => file.slice(0, -7))
    try {
        const profile = JSON.parse(fs.readFileSync(getProfilePath(), 'utf8')) as Profile
        noteList.sort((a: string, b: string) => profile.notesOrder.indexOf(a) - profile.notesOrder.indexOf(b))
        return {
            noteList,
            lastOpenedNote: profile.lastOpenedNote
        }
    } catch (e) {
        return {
            noteList,
            lastOpenedNote: ''
        }
    }
}

const getNoteContent = (note: string) => {
    return fs.readFileSync(getNotePath(note), 'utf8');
}

const createNewNote = () => {
    let i = 1
    while (true) {
        if (fs.existsSync(getNotePath(`新笔记-${i}`))) {
            i++
        } else {
            break
        }
    }
    const note = `新笔记-${i}`
    fs.writeFileSync(getNotePath(note), '<p></p>');
    return note
}

const renameNote = (_old: string, _new: string) => {
    fs.renameSync(getNotePath(_old), getNotePath(_new))
}

const saveNote = debounce((note: string, content: string) => {
    fs.writeFileSync(getNotePath(note), content, 'utf8')
}, 250)

const getNoteInfo = (note: string) => {
    const {birthtime, mtime} = fs.statSync(getNotePath(note))
    const info = {
        createTime: birthtime.toLocaleString(),
        lastModifyTime: mtime.toLocaleString()
    }
    return info
}

const saveProfile = (profile: Profile) => {
    fs.writeFileSync(getProfilePath(), JSON.stringify(profile), 'utf8')
}

const removeNote = (note: string) => {
    fs.unlinkSync(getNotePath(note))
}

const moveNotesAndProfile = async (sourceDir: string, targetDir: string) => {
    let successCount = 0
    const notes = []
    try {
        const files = await fsp.readdir(sourceDir)
        for (const file of files) {
            if ((await fsp.stat(path.join(sourceDir, file))).isFile() && path.extname(file) === '.jianji') {
                notes.push(file)
            }
        }
        for (const note of notes) {
            try {
                await fsp.rename(path.join(sourceDir, note), path.join(targetDir, note))
                successCount++
            } catch (e) {

            }
        }
        fs.renameSync(path.join(sourceDir, '简记配置文件（勿删）.json'), path.join(targetDir, '简记配置文件（勿删）.json'))
    } finally {
        return {
            successCount,
            targetCount: notes.length
        }
    }
}

window.p = {
    setNotesDir,
    getNotesDir,
    isNotesDirExist,
    getNoteListAndLastOpenedNote,
    getNoteContent,
    createNewNote,
    renameNote,
    saveNote,
    getNoteInfo,
    removeNote,
    saveProfile,
    moveNotesAndProfile
}