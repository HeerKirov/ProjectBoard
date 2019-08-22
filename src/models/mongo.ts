import * as mongoose from 'mongoose'
import {Module, Project, User, Note, Task, Token} from "./model"
import config from '../config'

const dbConf = config.MONGO
const Types = mongoose.SchemaTypes
const options = {
    useCreateIndex: true,
    useNewUrlParser: true
}

if(dbConf.USERNAME || dbConf.PASSWORD) {
    mongoose.connect(`mongodb://${dbConf.USERNAME}:${dbConf.PASSWORD}@${dbConf.HOST}:${dbConf.PORT}/${dbConf.DATABASE}`, options).finally(() => {})
}else{
    mongoose.connect(`mongodb://${dbConf.HOST}:${dbConf.PORT}/${dbConf.DATABASE}`, options).finally(() => {})
}


export const UserModel = mongoose.model<User>('User', new mongoose.Schema({
    username: {type: Types.String, required: true, index: true, unique: true},
    name: {type: Types.String, required: true},
    password: {type: Types.String, required: true},
    imageHash: Types.String,
    dateJoined: {type: Types.Number, required: true},
    lastLogin: Types.Number,
    lastLoginIp: Types.String,
    isStaff: {type: Types.Boolean, required: true, default: false},
    isActive: {type: Types.Boolean, required: true, default: true}
}))

export const TokenModel = mongoose.model<Token>('Token', new mongoose.Schema({
    token: {type: Types.String, required: true, index: true},
    _user: {type: Types.ObjectId, required: true},
    username: {type: Types.String, required: true},
    platform: {type: Types.String, default: null},
    ip: {type: Types.String, default: null},
    createTime: {type: Types.Number, required: true},
    updateTime: {type: Types.Number, required: true},
    effectiveDuration: {type: Types.Number},
    expireTime: {type: Types.Number}
}))

export const ProjectModel = mongoose.model<Project>("Project", new mongoose.Schema({
    name: {type: Types.String, required: true, index: true},
    description: {type: Types.String},
    archived: {type: Types.Boolean, required: true, default: false},
    createTime: {type: Types.Number, required: true},
    updateTime: {type: Types.Number, required: true},
    imageHash: Types.String,
    _user: {type: Types.ObjectId, required: true}
}))

export const ModuleModel = mongoose.model<Module>("Module", new mongoose.Schema({
    name: {type: Types.String, required: true},
    description: {type: Types.String},
    createTime: {type: Types.Number, required: true},
    updateTime: {type: Types.Number, required: true},
    _user: {type: Types.ObjectId, required: true},
    _project: {type: Types.ObjectId, required: true}
}))

export const NoteModel = mongoose.model<Note>("Note", new mongoose.Schema({
    title: {type: Types.String, required: true},
    content: {type: Types.String},
    createTime: {type: Types.Number, required: true},
    updateTime: {type: Types.Number, required: true},
    _user: {type: Types.ObjectId, required: true},
    _project: {type: Types.ObjectId, required: true},
    _module: {type: Types.ObjectId, default: null}
}))

export const TaskModel = mongoose.model<Task>("Task", new mongoose.Schema({
    title: {type: Types.String, required: true},
    description: {type: Types.String},
    archived: {type: Types.Boolean, required: true, default: false},
    list: {type: [], required: true, default: []},
    statistics: {
        todoNum: Types.Number, todoComplete: Types.Number,
        thinkNum: Types.Number, thinkComplete: Types.Number,
        noteNum: Types.Number
    },
    deadline: {type: Types.Number},
    createTime: {type: Types.Number, required: true},
    updateTime: {type: Types.Number, required: true},
    _user: {type: Types.ObjectId, required: true},
    _project: {type: Types.ObjectId, required: true},
    _module: {type: Types.ObjectId, required: true}
}))