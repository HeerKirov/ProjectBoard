import * as express from 'express'
import {ModuleModel, NoteModel, ProjectModel, TaskModel} from "../models/mongo"
import {Project, Module} from "../models/model"
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
        return authentication.ALL
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
        return {models: [ModuleModel, NoteModel, TaskModel], lookup: '_project'}
    }
}
