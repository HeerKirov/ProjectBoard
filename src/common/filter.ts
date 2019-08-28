import config from '../config'
import {Dict, MongoID} from "./utils"

const oid = MongoID.oid

export class Filter {
    private readonly sort: any
    private readonly sortDefault: string
    private readonly nest: string[] = null     //param.field : query.field
    private readonly lookup: string = 'id'
    private readonly filterDefault: Dict<any>
    constructor(param: {
        sort?: string[], sortDefault?: string,
        filterDefault?: Dict<any>,
        nest?: string[], lookup?: string
    }) {
        this.sort = (() => {
            let ret = {}
            if(param.sort) {
                for(let s of param.sort) {
                    ret[s] = null
                }
            }
            return ret
        })()
        this.sortDefault = param.sortDefault || undefined
        this.filterDefault = param.filterDefault || {}
        if(param.nest) this.nest = param.nest
        if(param.lookup) this.lookup = param.lookup
    }

    filter(param: {user?: string, query: any, params: any}): {find: any, sort: string, limit: number, skip: number} {
        let find = {}
        if(param.user != undefined) find['_user'] = param.user
        if(this.nest) {
            for(let paramName of this.nest) {
                find[`_${paramName}`] = oid(param.params[paramName])
            }
        }
        for(let field in this.filterDefault) {
            find[field] = this.filterDefault[field]
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
    filterOne(param: {user?: string, query: any, params: any}): any {
        let find = {}
        if(param.user != undefined) find['_user'] = param.user
        if(this.nest) {
            for(let paramName of this.nest) {
                find[`_${paramName}`] = oid(param.params[paramName])
            }
        }
        find[`_${this.lookup}`] = oid(param.params[this.lookup])
        for(let field in this.filterDefault) {
            find[field] = this.filterDefault[field]
        }

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