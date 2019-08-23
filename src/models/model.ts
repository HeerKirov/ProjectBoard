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

export interface Token extends Document {
    token: string
    _user: Types.ObjectId
    username: string
    platform: string        //标注这个token的使用平台
    ip: string              //标注这个token的使用者的ip
    createTime: number      //创建时间
    updateTime: number      //上次更新这个token的时间
    effectiveDuration: number   //有效时长
    expireTime: number      //token到期的时间
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

    _module?: Types.ObjectId
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

export interface Img extends Document {
    type: "public" | "avatar" | "cover"
    uploadTime: number
    _user: Types.ObjectId
}