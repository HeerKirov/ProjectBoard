import * as express from 'express'
import {Model, Document} from "mongoose"
import {Selector} from "./selector"
import {Filter} from "./filter"
import {Material, Project, User} from "../models/model"
import {MaterialModel, ProjectModel} from "../models/mongo"

export interface Use {(req: express.Request, res: express.Response, next?): void}

abstract class AbstractView {
    private readonly permissionComponent: Use
    private readonly authenticationComponent: Use

    constructor() {
        this.permissionComponent = this.permission()
        this.authenticationComponent = this.authentication()
    }

    abstract getURLPath(): string

    protected permission(): Use {
        return null
    }
    protected authentication(): Use {
        return null
    }
    getPermission(): Use {
        return this.permissionComponent
    }
    getAuthentication(): Use {
        return this.authenticationComponent
    }
}

abstract class View extends AbstractView {
    get(req: express.Request, res: express.Response) {
        View.methodNotAllowed(req, res)
    }
    post(req: express.Request, res: express.Response) {
        View.methodNotAllowed(req, res)
    }
    put(req: express.Request, res: express.Response) {
        View.methodNotAllowed(req, res)
    }
    patch(req: express.Request, res: express.Response) {
        View.methodNotAllowed(req, res)
    }
    delete(req: express.Request, res: express.Response) {
        View.methodNotAllowed(req, res)
    }
    options(req: express.Request, res: express.Response) {
        res.sendStatus(200)
    }

    static methodNotAllowed(req: express.Request, res: express.Response) {
        res.sendStatus(405)
    }
}

abstract class RestView extends AbstractView {
    getURLDetailSuffix(): string {
        return ':id'
    }
    list(req: express.Request, res: express.Response) {
        RestView.methodNotAllowed(req, res)
    }
    create(req: express.Request, res: express.Response) {
        RestView.methodNotAllowed(req, res)
    }
    retrieve(req: express.Request, res: express.Response) {
        RestView.methodNotAllowed(req, res)
    }
    update(req: express.Request, res: express.Response) {
        RestView.methodNotAllowed(req, res)
    }
    partialUpdate(req: express.Request, res: express.Response) {
        RestView.methodNotAllowed(req, res)
    }
    delete(req: express.Request, res: express.Response) {
        RestView.methodNotAllowed(req, res)
    }
    options(req: express.Request, res: express.Response) {
        res.sendStatus(200)
    }

    private static methodNotAllowed(req: express.Request, res: express.Response) {
        res.sendStatus(405)
    }
}

abstract class RestViewSet<T extends Document> extends RestView {
    protected queryModelComponent: Model<T>
    protected selectorComponent: Selector
    protected filterComponent: Filter
    private readonly nestedList: string[]
    private readonly queryNestedComponent: Model<Document>
    private readonly subModelComponent: {models: Model<Document>[], lookup: string}

    constructor() {
        super()
        this.queryModelComponent = this.queryModel()
        this.selectorComponent = this.selector()
        this.nestedList = this.nested() || []
        this.filterComponent = new Filter({
            sortDefault: this.sortDefaultField(),
            sort: this.sortFields(),
            nest: this.nestedList,
            lookup: this.lookupField()
        })
        this.queryNestedComponent = this.nestedModel()
        this.subModelComponent = this.subModel()
    }

    protected abstract queryModel(): Model<T>
    protected abstract selector(): Selector
    protected sortFields(): string[] {
        return []
    }
    protected sortDefaultField(): string {
        return undefined
    }
    protected lookupField(): string {
        return 'id'
    }
    protected nested(): string[] {
        return null
    }
    protected nestedModel(): Model<Document> {
        return undefined
    }
    protected subModel(): {models: Model<Document>[], lookup: string} {
        return null
    }
    protected abstract resourceName(): string

    getURLPath(): string {
        return this.nestedList.map(nested => `/${nested}s/:${nested}`).join('') + `/${this.resourceName()}s`
    }
    getURLDetailSuffix(): string {
        return ':' + this.lookupField()
    }

    async list(req: express.Request, res: express.Response) {
        let user: User = req['user']
        let filter = this.filterComponent.filter({user: user._id, query: req.query, params: req.params})
        let countPromise: Promise<number> = this.queryModelComponent.find(filter.find).countDocuments().exec()
        let list: T[] = await this.queryModelComponent
            .find(filter.find).sort(filter.sort)
            .limit(filter.limit).skip(filter.skip).exec()
        let result = list.map(value => this.selectorComponent.readFields(value))
        res.send({count: await countPromise, result})
    }
    async create(req: express.Request, res: express.Response) {
        let user: User = req['user']
        if(this.queryNestedComponent) {
            let parent: Document = await this.queryNestedComponent.findOne(this.filterComponent.filterParent({user: user._id, query: req.query, params: req.params})).exec()
            if(!parent) {
                res.sendStatus(404)
                return
            }
        }
        let setter = this.selectorComponent.writeFields(req.body)
        if(!setter) {
            res.status(400).send('Wrong Field List')
            return
        }
        let model = await this.performCreate(setter, req)
        res.status(201).send(this.selectorComponent.readFields(model))
    }
    async retrieve(req: express.Request, res: express.Response) {
        let user: User = req['user']
        let object: T = await this.queryModelComponent.findOne(this.filterComponent.filterOne({user: user._id, query: req.query, params: req.params})).exec()
        if(!object) {
            res.sendStatus(404)
            return
        }
        res.send(this.selectorComponent.readFields(object, true))
    }
    async update(req: express.Request, res: express.Response, partial: boolean = false) {
        let user: User = req['user']
        let object: T = await this.queryModelComponent.findOne(this.filterComponent.filterOne({user: user._id, query: req.query, params: req.params})).exec()
        if(!object) {
            res.sendStatus(404)
            return
        }
        let setter = this.selectorComponent.writeFields(req.body, partial);
        if(!setter) {
            res.status(400).send('Wrong Field List')
            return
        }
        await this.performUpdate(object, setter, req)
        res.send(this.selectorComponent.readFields(object, true))
    }
    async partialUpdate(req: express.Request, res: express.Response) {
        await this.update(req, res, true)
    }
    async delete(req: express.Request, res: express.Response) {
        let user: User = req['user']
        let object: T = await this.queryModelComponent.findOneAndDelete(this.filterComponent.filterOne({user: user._id, query: req.query, params: req.params})).exec()
        if(!object) {
            res.sendStatus(404)
            return
        }
        await this.performDelete(object)
        res.sendStatus(204)
    }

    async performCreate(setter: any, req: express.Request): Promise<T> {
        setter['_user'] = req['user']._id
        if(this.nestedList) {
            for(let nested of this.nestedList) {
                setter[`_${nested}`] = req.params[nested]
            }
        }
        setter['createTime'] = setter['updateTime'] = new Date().getTime()
        return await this.queryModelComponent.create(setter)
    }
    async performUpdate(instance: T, setter: any, req: express.Request) {
        setter['updateTime'] = new Date().getTime()
        await instance.set(setter).save()
    }
    async performDelete(instance: T) {
        let promises = []
        if(this.subModelComponent) {
            for(let model of this.subModelComponent.models) {
                let c = {}
                c[this.subModelComponent.lookup] = instance._id
                promises.push(model.remove(c).exec())
            }
        }
        for(let promise of promises) {
            await promise
        }
    }
}


export {View, RestView, RestViewSet}