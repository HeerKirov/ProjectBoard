import * as express from 'express'
import {MaterialModel, ModuleModel, NoteModel, ProjectModel, TaskModel} from "../models/mongo"
import {User, Project, Material, Module, Note, Task, TaskTodo, TaskThink, TaskNote} from "../models/model"
import {Selector} from "../common/selector"
import {RestView, RestViewSet, Use} from "../common/view"
import {authentication, permission} from "../services/user-service"
import {Filter} from "../common/filter"
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
            'name',
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
        return {models: [MaterialModel, ModuleModel], lookup: '_project'} //TODO 持续更新
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
            'title',
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
            'name',
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
        return {models: [], lookup: '_module'} //TODO 持续更新
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
            'title',
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
            'title',
            'description',
            {name: 'list', writeAs: TaskView.writeTaskList},
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

    private static writeTaskList(list: any): (TaskTodo | TaskThink | TaskNote)[] | undefined {
        if(typeof list !== 'object') return undefined
        let ret = []
        for(let item of list) {
            if (typeof item !== 'object') return undefined
            if (!(TaskView.taskListSelector[item['type']] !== undefined)) return undefined
            let result = TaskView.taskListSelector[item['type']].writeFields(item)
            if (result === undefined) return undefined
            ret.push(result)
        }
        return ret
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
//TODO 修改selector和view的联动，使其能方便地区分list和detail等时的fields列表，以便区分两种不同需要下的fields。
