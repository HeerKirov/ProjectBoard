import * as express from 'express'
import {View, RestView, Use} from './view'

const emptyUse: Use = (req, res, next) => next()

export const optionsUse: Use = (req, res, next) => {
    if(req.method.toUpperCase() === 'OPTIONS') {
        res.header('Access-Control-Max-Age', "600")
        res.sendStatus(200)
        return
    }
    next()
}

class Router {
    private readonly router: express.Router = express.Router()
    private readonly routeList: string[] = []

    constructor(router: express.Router) {
        this.router = router
        this.routeDefaultView()
    }

    routeAsView(view: View): Router {
        let path = view.getURLPath()
        this.router.all(path, optionsUse, view.getAuthentication() || emptyUse, view.getPermission() || emptyUse, (req, res) => {
            let throwException = Router.throwException(res)
            switch (req.method) {
                case 'GET': view.get(req, res).catch(throwException); break
                case 'POST': view.post(req, res).catch(throwException); break
                case 'PUT': view.put(req, res).catch(throwException); break
                case 'PATCH': view.patch(req, res).catch(throwException); break
                case 'DELETE': view.delete(req, res).catch(throwException); break
                case 'OPTIONS': view.options(req, res).catch(throwException); break
                default: View.methodNotAllowed(req, res)
            }
        })
        this.routeList.push(path)
        return this
    }
    routeAsRestView(view: RestView): Router {
        let listPath = view.getURLPath(), detailSuffix = view.getURLDetailSuffix()
        this.router.all(listPath, optionsUse, view.getAuthentication() || emptyUse, view.getPermission() || emptyUse, (req, res) => {
            let throwException = Router.throwException(res)
            switch (req.method) {
                case 'GET': view.list(req, res).catch(throwException); break
                case 'POST': view.create(req, res).catch(throwException); break
                case 'OPTIONS': view.options(req, res).catch(throwException); break
                default: View.methodNotAllowed(req, res)
            }
        })
        this.router.all(listPath + '/' + detailSuffix, optionsUse,view.getAuthentication() || emptyUse, view.getPermission() || emptyUse, (req, res) => {
            let throwException = Router.throwException(res)
            switch (req.method) {
                case 'GET': view.retrieve(req, res).catch(throwException); break
                case 'PUT': view.update(req, res).catch(throwException); break
                case 'PATCH': view.partialUpdate(req, res).catch(throwException); break
                case 'DELETE': view.delete(req, res).catch(throwException); break
                case 'OPTIONS': view.options(req, res).catch(throwException); break
                default: View.methodNotAllowed(req, res)
            }
        })
        this.routeList.push(listPath, listPath + '/' + detailSuffix)
        return this
    }
    route(asView: (router: express.Router) => void): Router {
        asView(this.router)
        return this
    }

    private static throwException(res: express.Response) {
        return (e: Error) => {
            res.sendStatus(500)
            console.error(e)
        }
    }

    private routeDefaultView() {
        this.router.get('/', (req, res) => {
            res.send(this.routeList)
        })
    }
}

export default Router