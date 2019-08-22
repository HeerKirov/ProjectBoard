import {RestViewSet, Use} from "../common/view"
import {Module} from "../models/model"
import {Document, Model} from "mongoose"
import {ModuleModel, NoteModel, ProjectModel, TaskModel} from "../models/mongo"
import {Selector} from "../common/selector"
import {authentication, permission} from "../services/user-service"

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
        return authentication.ALL
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