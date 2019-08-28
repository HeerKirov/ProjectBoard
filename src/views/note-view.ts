import * as express from 'express'
import {RestMethod, RestViewSet, Use} from "../common/view"
import {Note} from "../models/model"
import {Document, Model} from "mongoose"
import {ModuleModel, NoteModel, ProjectModel} from "../models/mongo"
import {Selector} from "../common/selector"
import {authentication, permission} from "../services/user-service"
import {NoteSelector, ProjectNoteSelector} from "../selectors/note-selector"

export class ProjectNoteView extends RestViewSet<Note> {
    protected nested(): string[] {
        return ['project']
    }
    protected resourceName(): string {
        return 'note'
    }
    protected methods(): RestMethod[] {
        return ['LIST', 'CREATE']
    }

    protected nestedModel(): Model<Document> {
        return ProjectModel
    }
    protected queryModel(): Model<Note> {
        return NoteModel
    }
    protected selector(): Selector {
        return ProjectNoteSelector
    }
    protected authentication(): Use {
        return authentication.ALL
    }
    protected permission(): Use {
        return permission.LOGIN
    }

    protected sortFields(): string[] {
        return ['updateTime', 'createTime', 'title']
    }
    protected sortDefaultField(): string {
        return '-updateTime'
    }
}

export class ModuleNoteView extends RestViewSet<Note> {
    protected nested(): string[] {
        return ['project', 'module']
    }
    protected resourceName(): string {
        return 'note'
    }
    protected methods(): RestMethod[] {
        return ['LIST', 'CREATE']
    }

    protected nestedModel(): Model<Document> {
        return ModuleModel
    }
    protected queryModel(): Model<Note> {
        return NoteModel
    }
    protected selector(): Selector {
        return NoteSelector
    }
    protected authentication(): Use {
        return authentication.ALL
    }
    protected permission(): Use {
        return permission.LOGIN
    }

    protected sortFields(): string[] {
        return ['updateTime', 'createTime', 'title']
    }
    protected sortDefaultField(): string {
        return '-updateTime'
    }
}

export class NoteView extends RestViewSet<Note> {
    protected resourceName(): string {
        return 'note'
    }
    protected methods(): RestMethod[] {
        return ['RETRIEVE', 'UPDATE', 'DELETE']
    }

    protected queryModel(): Model<Note> {
        return NoteModel
    }
    protected selector(): Selector {
        return NoteSelector
    }
    protected authentication(): Use {
        return authentication.ALL
    }
    protected permission(): Use {
        return permission.LOGIN
    }
}