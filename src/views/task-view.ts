import * as express from 'express'
import {RestMethod, RestView, RestViewSet, Use} from "../common/view"
import {Task, User} from "../models/model"
import {Document, Model} from "mongoose"
import {ModuleModel, ProjectModel, TaskModel} from "../models/mongo"
import {Selector} from "../common/selector"
import {authentication, permission} from "../services/user-service"
import {ProjectTaskSelector, TaskSelector} from "../selectors/task-selector"
import {TaskService} from "../services/task-service";

export class ProjectTaskView extends RestViewSet<Task> {
    protected nested(): string[] {
        return ['project']
    }
    protected resourceName(): string {
        return 'task'
    }
    protected methods(): RestMethod[] {
        return ['LIST']
    }

    protected nestedModel(): Model<Document> {
        return ProjectModel
    }
    protected queryModel(): Model<Task> {
        return TaskModel
    }
    protected selector(): Selector {
        return ProjectTaskSelector
    }
    protected authentication(): Use {
        return authentication.ALL
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
}

export class ModuleTaskView extends RestViewSet<Task> {
    protected nested(): string[] {
        return ['project', 'module']
    }
    protected resourceName(): string {
        return 'task'
    }
    protected methods(): RestMethod[] {
        return ['LIST', 'CREATE']
    }

    protected nestedModel(): Model<Document> {
        return ModuleModel
    }
    protected queryModel(): Model<Task> {
        return TaskModel
    }
    protected selector(): Selector {
        return TaskSelector
    }
    protected authentication(): Use {
        return authentication.ALL
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
        setter['statistics'] = TaskService.statistic(setter['list'])
        return await super.performCreate(setter, req);
    }
}

export class TaskView extends RestViewSet<Task> {
    protected resourceName(): string {
        return 'task'
    }
    protected methods(): RestMethod[] {
        return ['RETRIEVE', 'UPDATE', 'DELETE']
    }

    protected queryModel(): Model<Task> {
        return TaskModel
    }
    protected selector(): Selector {
        return TaskSelector
    }
    protected authentication(): Use {
        return authentication.ALL
    }
    protected permission(): Use {
        return permission.LOGIN
    }

    async performUpdate(instance: Task, setter: any, req: express.Request): Promise<void> {
        if(setter['list'] != null) {
            setter['statistics'] = TaskService.statistic(setter['list'])
        }
        await super.performUpdate(instance, setter, req);
    }
}

export class TaskListView extends RestView {
    getURLPath(): string {
        return '/tasks/:task/list'
    }
    getURLDetailSuffix(): string {
        return ':index'
    }

    protected authentication(): Use {
        return authentication.ALL
    }
    protected permission(): Use {
        return permission.LOGIN
    }

    async list(req: express.Request, res: express.Response) {
        let user: User = req['user']
        let task = await TaskModel.findOne({_user: user._id, _id: req.params.task}).exec()
        if(!task) {
            res.sendStatus(404)
            return
        }
        let list = task.list || []
        res.send({count: list.length, statistics: task.statistics, result: list})
    }
    async retrieve(req: express.Request, res: express.Response) {
        let user: User = req['user']
        let task = await TaskModel.findOne({_user: user._id, _id: req.params.task}).exec()
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
        let task = await TaskModel.findOne({_user: user._id, _id: req.params.task}).exec()
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
        let setter = TaskService.writeTaskListItem(req.body)
        if(!setter) {
            res.status(400).send('Wrong Field List')
            return
        }
        if(!TaskService.equalType(setter, list[index])) {
            res.status(400).send('Type Changed')
            return
        }
        list.splice(index, 1, setter)
        await task.set({list}).save()
        res.contentType('application/json').send(JSON.stringify(setter))
    }
}