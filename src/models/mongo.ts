import * as mongoose from 'mongoose'
import {Module, Material, Project, User, Note, Task} from "./model"
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

export const ProjectModel = mongoose.model<Project>("Project", new mongoose.Schema({
    name: {type: Types.String, required: true, index: true},
    description: {type: Types.String, required: true},
    archived: {type: Types.Boolean, required: true, default: false},
    createTime: {type: Types.Number, required: true},
    updateTime: {type: Types.Number, required: true},
    imageHash: Types.String,
    _user: {type: Types.ObjectId, required: true}
}))

export const MaterialModel = mongoose.model<Material>("Material", new mongoose.Schema({
    title: {type: Types.String, required: true},
    content: {type: Types.String, required: true},
    createTime: {type: Types.Number, required: true},
    updateTime: {type: Types.Number, required: true},
    _user: {type: Types.ObjectId, required: true},
    _project: {type: Types.ObjectId, required: true}
}))

export const ModuleModel = mongoose.model<Module>("Module", new mongoose.Schema({
    name: {type: Types.String, required: true},
    description: {type: Types.String, required: true},
    createTime: {type: Types.Number, required: true},
    updateTime: {type: Types.Number, required: true},
    _user: {type: Types.ObjectId, required: true},
    _project: {type: Types.ObjectId, required: true}
}))

export const NoteModel = mongoose.model<Note>("Note", new mongoose.Schema({
    title: {type: Types.String, required: true},
    content: {type: Types.String, required: true},
    createTime: {type: Types.Number, required: true},
    updateTime: {type: Types.Number, required: true},
    _user: {type: Types.ObjectId, required: true},
    _project: {type: Types.ObjectId, required: true},
    _module: {type: Types.ObjectId, required: true}
}))

export const TaskModel = mongoose.model<Task>("Task", new mongoose.Schema({
    title: {type: Types.String, required: true},
    description: {type: Types.String, required: true},
    archived: {type: Types.Boolean, required: true, default: false},
    list: {type: Types.Array, required: true, default: []},
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