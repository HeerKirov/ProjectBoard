import config from '../config'
import {User} from "../models/model"
import {Types} from "mongoose";
import {ObjectID} from 'mongodb'

const EmptyObjectId: ObjectID = new ObjectID(String.fromCharCode(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0))

function oid(id: string): ObjectID {
    if(ObjectID.isValid(id)) {
        return ObjectID.createFromHexString(id)
    }else{
        return EmptyObjectId
    }
}

export class Filter {
    private readonly sort: any = {}
    private readonly sortDefault: string
    private readonly nest: string[] = null     //param.field : query.field
    private readonly lookup: string = 'id'
    constructor(param: {sort?: string[], sortDefault?: string, nest?: string[], lookup?: string}) {
        if(param.sort) {
            for(let s of param.sort) {
                this.sort[s] = null
            }
        }

        this.sortDefault = param.sortDefault || undefined
        if(param.nest) this.nest = param.nest
        if(param.lookup) this.lookup = param.lookup
    }

    filter(param: {user?: string | {userId: string, field: string}, query: any, params: any}): {find: any, sort: string, limit: number, skip: number} {
        let find = {}
        if(typeof param.user === 'string') find['_user'] = param.user
        else if(typeof param.user === 'object') find[param.user.field] = param.user.userId
        if(this.nest) {
            for(let paramName of this.nest) {
                find[`_${paramName}`] = oid(param.params[paramName])
            }
        }

        let sort
        let sortExpected: string = param.query[config.SORT.FIELD]
        if(sortExpected) {
            let sortAsc: boolean = true
            if(sortExpected.startsWith('-')) {
                sortAsc = false
                sortExpected = sortExpected.substring(1)
            }
            sort = (sortExpected && sortExpected in this.sort) ? `${sortAsc ? '' : '-'}${sortExpected}` : this.sortDefault
        }else{
            sort = this.sortDefault
        }

        let limit = parseInt(param.query[config.PAGINATION.LIMIT_FIELD])
        if(limit == null) limit = config.PAGINATION.DEFAULT_LIMIT
        if(limit <= 0) limit = undefined
        let skip = parseInt(param.query[config.PAGINATION.OFFSET_FIELD]) || undefined

        return {find, sort, limit, skip}
    }
    filterOne(param: {user?: string | {userId: string, field: string}, query: any, params: any}): any {
        let find = {}
        if(typeof param.user === 'string') find['_user'] = param.user
        else if(typeof param.user === 'object') find[param.user.field] = param.user.userId
        if(this.nest) {
            for(let paramName of this.nest) {
                find[`_${paramName}`] = oid(param.params[paramName])
            }
        }
        find[`_${this.lookup}`] = oid(param.params[this.lookup])

        return find
    }
    filterParent(param: {user?: string| {userId: string, field: string}, query: any, params: any}): any {
        let find = {}
        if(typeof param.user === 'string') find['_user'] = param.user
        else if(typeof param.user === 'object') find[param.user.field] = param.user.userId
        if(this.nest) {
            for(let i = 0; i < this.nest.length - 1; ++i) {
                let paramName = this.nest[i]
                find[`_${paramName}`] = oid(param.params[paramName])
            }
            find[`_id`] = oid(param.params[this.nest[this.nest.length - 1]])
        }

        return find
    }
}