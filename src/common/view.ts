import * as express from 'express'
import {Model, Document} from "mongoose"
import {Selector} from "./selector"
import {Filter} from "./filter"
import {User} from "../models/model"

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
    async get(req: express.Request, res: express.Response): Promise<void> {
        View.methodNotAllowed(req, res)
    }
    async post(req: express.Request, res: express.Response): Promise<void> {
        View.methodNotAllowed(req, res)
    }
    async put(req: express.Request, res: express.Response): Promise<void> {
        View.methodNotAllowed(req, res)
    }
    async patch(req: express.Request, res: express.Response): Promise<void> {
        View.methodNotAllowed(req, res)
    }
    async delete(req: express.Request, res: express.Response): Promise<void> {
        View.methodNotAllowed(req, res)
    }
    async options(req: express.Request, res: express.Response): Promise<void> {
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
    async list(req: express.Request, res: express.Response): Promise<void> {
        RestView.methodNotAllowed(req, res)
    }
    async create(req: express.Request, res: express.Response): Promise<void> {
        RestView.methodNotAllowed(req, res)
    }
    async retrieve(req: express.Request, res: express.Response): Promise<void> {
        RestView.methodNotAllowed(req, res)
    }
    async update(req: express.Request, res: express.Response): Promise<void> {
        RestView.methodNotAllowed(req, res)
    }
    async partialUpdate(req: express.Request, res: express.Response) : Promise<void>{
        RestView.methodNotAllowed(req, res)
    }
    async delete(req: express.Request, res: express.Response): Promise<void> {
        RestView.methodNotAllowed(req, res)
    }
    async options(req: express.Request, res: express.Response): Promise<void> {
        res.sendStatus(200)
    }

    private static methodNotAllowed(req: express.Request, res: express.Response) {
        res.sendStatus(405)
    }
}

type RestMethod = "LIST" | "CREATE" | "RETRIEVE" | "UPDATE" | "DELETE"
const AllRestMethods = {LIST: true, CREATE: true, RETRIEVE: true, UPDATE: true, DELETE: true}

abstract class RestViewSet<T extends Document> extends RestView {
    protected queryModelComponent: Model<T>
    protected selectorComponent: Selector
    protected filterComponent: Filter
    private readonly nestedList: string[]
    private readonly queryNestedComponent: Model<Document>
    private readonly subModelComponent: {models: Model<Document>[], lookup: string}
    private readonly restMethods: {[key: string]: boolean}

    constructor() {
        super()
        this.restMethods = ((methods: RestMethod[]) => {
            if(methods == null) return AllRestMethods
            let ret = {}
            for(let method of methods) ret[method] = true
            return ret
        })(this.methods())
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

    protected methods(): RestMethod[] {
        return null
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

    async list(req: express.Request, res: express.Response): Promise<void> {
        if(!this.restMethods['LIST']) {
            View.methodNotAllowed(req, res)
            return
        }
        let user: User = req['user']
        let filter = this.filterComponent.filter({user: user._id, query: req.query, params: req.params})
        let countPromise: Promise<number> = this.queryModelComponent.find(filter.find).countDocuments().exec()
        let list: T[] = await this.queryModelComponent
            .find(filter.find).sort(filter.sort)
            .limit(filter.limit).skip(filter.skip).exec()
        let result = list.map(value => this.selectorComponent.readFields(value))
        res.send({count: await countPromise, result})
    }
    async create(req: express.Request, res: express.Response): Promise<void> {
        if(!this.restMethods['CREATE']) {
            View.methodNotAllowed(req, res)
            return
        }
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
        res.status(201).send(this.selectorComponent.readFields(model, true))
    }
    async retrieve(req: express.Request, res: express.Response): Promise<void> {
        if(!this.restMethods['RETRIEVE']) {
            View.methodNotAllowed(req, res)
            return
        }
        let user: User = req['user']
        let object: T = await this.queryModelComponent.findOne(this.filterComponent.filterOne({user: user._id, query: req.query, params: req.params})).exec()
        if(!object) {
            res.sendStatus(404)
            return
        }
        res.send(this.selectorComponent.readFields(object, true))
    }
    async update(req: express.Request, res: express.Response, partial: boolean = false): Promise<void> {
        if(!this.restMethods['UPDATE']) {
            View.methodNotAllowed(req, res)
            return
        }
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
    async partialUpdate(req: express.Request, res: express.Response): Promise<void> {
        await this.update(req, res, true)
    }
    async delete(req: express.Request, res: express.Response): Promise<void> {
        if(!this.restMethods['DELETE']) {
            View.methodNotAllowed(req, res)
            return
        }
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


export {View, RestView, RestViewSet, RestMethod}