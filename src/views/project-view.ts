import {Model, Document} from "mongoose"
import {ModuleModel, NoteModel, ProjectModel, TaskModel} from "../models/mongo"
import {Project} from "../models/model"
import {Selector} from "../common/selector"
import {RestViewSet, Use} from "../common/view"
import {authentication, permission} from "../services/user-service"


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
            'content',
            {name: 'archived', default: false},
            {name: 'createTime', readonly: true},
            {name: 'updateTime', readonly: true},
            {name: 'coverId', readonly: true}
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
