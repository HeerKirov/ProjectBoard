import * as express from 'express'
import {MaterialModel, ModuleModel, NoteModel, ProjectModel, TaskModel} from "../models/mongo"
import {Project, Material, Module, Note, Task, TaskTodo, TaskThink, TaskNote, User} from "../models/model"
import {Selector} from "../common/selector"
import {RestView, RestViewSet, Use} from "../common/view"
import {authentication, permission} from "../services/user-service"
import {Model, Document} from "mongoose"


export class ProjectView extends RestViewSet<Project> {
    protected resourceName(): string {
        return 'project'
    }

    protected queryModel(): Model<Project> {
        return ProjectModel
    }
    protected selector(): Selector {
        return new Selector([
            {name: 'id', field: '_id', readonly: true},
            {name: 'name', required: true, writeAs: Selector.notBlank},
            'description',
            {name: 'archived', default: false},
            {name: 'createTime', readonly: true},
            {name: 'updateTime', readonly: true},
            {name: 'imageHash', readonly: true}
        ])
    }
    protected authentication(): Use {
        return authentication.TOKEN
    }
    protected permission(): Use {
        return permission.LOGIN
    }

    protected sortFields(): string[] {
        return ['updateTime', 'createTime', 'name']
    }
    protected sortDefaultField(): string {
        return '-createTime'
    }

    protected subModel(): { models: Model<Document>[]; lookup: string } {
        return {models: [MaterialModel, ModuleModel, NoteModel, TaskModel], lookup: '_project'}
    }
}

export class MaterialView extends RestViewSet<Material> {
    protected nested(): string[] {
        return ['project']
    }
    protected resourceName(): string {
        return 'material'
    }

    protected nestedModel(): Model<Document> {
        return ProjectModel
    }
    protected queryModel(): Model<Material> {
        return MaterialModel
    }
    protected selector(): Selector {
        return new Selector([
            {name: 'id', field: '_id', readonly: true},
            {name: 'title', required: true, writeAs: Selector.notBlank},
            'content',
            {name: 'createTime', readonly: true},
            {name: 'updateTime', readonly: true}
        ])
    }
    protected authentication(): Use {
        return authentication.TOKEN
    }
    protected permission(): Use {
        return permission.LOGIN
    }

    protected sortFields(): string[] {
        return ['updateTime', 'createTime']
    }
    protected sortDefaultField(): string {
        return '-updateTime'
    }
}

export class ModuleView extends RestViewSet<Module> {
    protected nested(): string[] {
        return ['project']
    }
    protected resourceName(): string {
        return 'module'
    }

    protected nestedModel(): Model<Document> {
        return ProjectModel
    }
    protected queryModel(): Model<Module> {
        return ModuleModel
    }
    protected selector(): Selector {
        return new Selector([
            {name: 'id', field: '_id', readonly: true},
            {name: 'name', required: true, writeAs: Selector.notBlank},
            'description',
            {name: 'createTime', readonly: true},
            {name: 'updateTime', readonly: true}
        ])
    }
    protected authentication(): Use {
        return authentication.TOKEN
    }
    protected permission(): Use {
        return permission.LOGIN
    }

    protected sortFields(): string[] {
        return ['updateTime', 'createTime']
    }
    protected sortDefaultField(): string {
        return 'createTime'
    }

    protected subModel(): { models: Model<Document>[]; lookup: string } {
        return {models: [NoteModel, TaskModel], lookup: '_module'}
    }
}

export class NoteView extends RestViewSet<Note> {
    protected nested(): string[] {
        return ['project', 'module']
    }
    protected resourceName(): string {
        return 'note'
    }

    protected nestedModel(): Model<Document> {
        return ModuleModel
    }
    protected queryModel(): Model<Note> {
        return NoteModel
    }
    protected selector(): Selector {
        return new Selector([
            {name: 'id', field: '_id', readonly: true},
            {name: 'name', required: true, writeAs: Selector.notBlank},
            'content',
            {name: 'createTime', readonly: true},
            {name: 'updateTime', readonly: true}
        ])
    }
    protected authentication(): Use {
        return authentication.TOKEN
    }
    protected permission(): Use {
        return permission.LOGIN
    }

    protected sortFields(): string[] {
        return ['updateTime', 'createTime']
    }
    protected sortDefaultField(): string {
        return '-updateTime'
    }
}

export class TaskView extends RestViewSet<Task> {
    protected nested(): string[] {
        return ['project', 'module']
    }
    protected resourceName(): string {
        return 'task'
    }

    protected nestedModel(): Model<Document> {
        return ModuleModel
    }
    protected queryModel(): Model<Task> {
        return TaskModel
    }
    protected selector(): Selector {
        return new Selector([
            {name: 'id', field: '_id', readonly: true},
            {name: 'name', required: true, writeAs: Selector.notBlank},
            'description',
            {name: 'list', writeAs: TaskView.writeTaskList, onlyOnDetail: true},
            {name: 'statistics', readonly: true},
            {name: 'deadline', default: null, nullable: true},
            {name: 'archived', default: false},
            {name: 'createTime', readonly: true},
            {name: 'updateTime', readonly: true}
        ])
    }
    protected authentication(): Use {
        return authentication.TOKEN
    }
    protected permission(): Use {
        return permission.LOGIN
    }

    protected sortFields(): string[] {
        return ['updateTime', 'createTime', 'archived', 'deadline']
    }
    protected sortDefaultField(): string {
        return '-createTime'
    }

    async performCreate(setter: any, req: express.Request): Promise<Task> {
        setter['statistics'] = TaskView.statistic(setter['list'])
        return await super.performCreate(setter, req);
    }

    async performUpdate(instance: Task, setter: any, req: express.Request): Promise<void> {
        if(setter['list'] != null) {
            setter['statistics'] = TaskView.statistic(setter['list'])
        }
        await super.performUpdate(instance, setter, req);
    }

    private static writeTaskList(list: any): (TaskTodo | TaskThink | TaskNote | string)[] | undefined {
        if(typeof list !== 'object') return undefined
        let ret = []
        for(let item of list) {
            let result = TaskListView.writeTaskListItem(item)
            if(result === undefined) return undefined
            ret.push(result)
        }
        return ret
    }

    private static statistic(list: (TaskTodo | TaskThink | TaskNote)[]): any {
        let ret = {
            todoNum: 0, todoComplete: 0,
            thinkNum: 0, thinkComplete: 0,
            noteNum: 0
        }
        for(let item of list) {
            if(item.type === 'todo') {
                ret.todoNum += 1
                if(item.complete) ret.todoComplete += 1
            }else if(item.type === 'think') {
                ret.thinkNum += 1
                if(item.remark != null) ret.thinkComplete += 1
            }else{
                ret.noteNum += 1
            }
        }
        return ret
    }
}

export class TaskListView extends RestView {
    getURLPath(): string {
        return '/projects/:project/modules/:module/tasks/:task/list'
    }
    getURLDetailSuffix(): string {
        return ':index'
    }

    protected authentication(): Use {
        return authentication.TOKEN
    }
    protected permission(): Use {
        return permission.LOGIN
    }

    async list(req: express.Request, res: express.Response) {
        let user: User = req['user']
        let task = await TaskModel.findOne({_user: user._id, _project: req.params.project, _module: req.params.module, _id: req.params.task}).exec()
        if(!task) {
            res.sendStatus(404)
            return
        }
        let list = task.list || []
        res.send({count: list.length, statistics: task.statistics, result: list})
    }
    async retrieve(req: express.Request, res: express.Response) {
        let user: User = req['user']
        let task = await TaskModel.findOne({_user: user._id, _project: req.params.project, _module: req.params.module, _id: req.params.task}).exec()
        if(!task) {
            res.sendStatus(404)
            return
        }
        let index = parseInt(req.params.index)
        let list = task.list || []
        if(isNaN(index) || index < 0 || index >= list.length) {
            res.sendStatus(404)
            return
        }
        res.contentType('application/json').send(JSON.stringify(list[index]))
    }
    async update(req: express.Request, res: express.Response, partial: boolean = false) {
        let user: User = req['user']
        let task = await TaskModel.findOne({_user: user._id, _project: req.params.project, _module: req.params.module, _id: req.params.task}).exec()
        if(!task) {
            res.sendStatus(404)
            return
        }
        let index = parseInt(req.params.index)
        let list = task.list || []
        if(isNaN(index) || index < 0 || index >= list.length) {
            res.sendStatus(404)
            return
        }
        let setter = TaskListView.writeTaskListItem(req.body)
        if(!setter) {
            res.status(400).send('Wrong Field List')
            return
        }
        if(!TaskListView.equalType(setter, list[index])) {
            res.status(400).send('Type Changed')
            return
        }
        list.splice(index, 1, setter)
        await task.set({list}).save()
        res.contentType('application/json').send(JSON.stringify(setter))
    }

    static writeTaskListItem(item: any): TaskTodo | TaskThink | TaskNote | string | undefined {
        if(typeof item === 'string') {
            return item
        }else if(typeof item === 'object') {
            if (!(TaskListView.taskListSelector[item['type']] !== undefined)) return undefined
            let result = TaskListView.taskListSelector[item['type']].writeFields(item)
            if (result === undefined) return undefined
            return result
        }else{
            return undefined
        }
    }
    static equalType(itemA: any, itemB: any): boolean {
        if(itemA == null || itemB == null) return false
        if(typeof itemA === 'string' && typeof itemB === 'string') return true
        return itemA.type == itemB.type
    }

    private static readonly taskListSelector = {
        todo: new Selector([
            {name: 'type'},
            {name: 'content'},
            {name: 'complete', default: false},
            {name: 'remark', default: null, nullable: true},
            {name: 'deadline', default: null, nullable: true}
        ]),
        think: new Selector([
            {name: 'type'},
            {name: 'content'},
            {name: 'remark', default: null, nullable: true},
            {name: 'deadline', default: null, nullable: true}
        ]),
        note: new Selector([
            {name: 'type'},
            {name: 'content'}
        ])
    }
}
