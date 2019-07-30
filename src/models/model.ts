import {Document, Types} from "mongoose"

export interface User extends Document {
    username: string
    name: string
    password: string
    imageHash: string

    dateJoined: number
    lastLogin: number
    lastLoginIp: string

    isStaff: boolean
    isActive: boolean
}

export interface Project extends Document {
    name: string
    description: string
    archived: boolean
    createTime: number
    updateTime: number
    imageHash: string

    _user: Types.ObjectId
}

export interface Material extends Document {
    title: string
    content: string
    createTime: number
    updateTime: number

    _project: Types.ObjectId
    _user: Types.ObjectId
}

export interface Module extends Document {
    name: string
    description: string
    createTime: number
    updateTime: number

    _project: Types.ObjectId
    _user: Types.ObjectId
}

export interface Note extends Document {
    title: string
    content: string
    createTime: number
    updateTime: number

    _module: Types.ObjectId
    _project: Types.ObjectId
    _user: Types.ObjectId
}

export interface Task extends Document {
    title: string
    description: string
    archived: boolean
    list: (TaskTodo | TaskThink | TaskNote | string)[]
    statistics: {
        todoNum: number, todoComplete: number,
        thinkNum: number, thinkComplete: number,
        noteNum: number
    }
    deadline?: number
    createTime: number
    updateTime: number

    _module: Types.ObjectId
    _project: Types.ObjectId
    _user: Types.ObjectId
}

export interface TaskTodo {
    type: "todo"
    content: string
    complete: boolean
    remark?: string
    deadline?: number
}
export interface TaskThink {
    type: "think"
    content: string
    remark?: string
    deadline?: number
}
export interface TaskNote {
    type: "note"
    content: string
}