import * as express from 'express'
import {View, RestView, Use} from './view'

const emptyUse: Use = (req, res, next) => next()

class Router {
    private router: express.Router = express.Router()
    private routeList: string[] = []

    constructor(router: express.Router) {
        this.router = router
        this.routeDefaultView()
    }

    routeAsView(view: View): Router {
        let path = view.getURLPath()
        this.router.all(path, view.getAuthentication() || emptyUse, view.getPermission() || emptyUse, (req, res) => {
            switch (req.method) {
                case 'GET': view.get(req, res); break
                case 'POST': view.post(req, res); break
                case 'PUT': view.put(req, res); break
                case 'PATCH': view.patch(req, res); break
                case 'DELETE': view.delete(req, res); break
                case 'OPTIONS': view.options(req, res); break
                default: View.methodNotAllowed(req, res)
            }
        })
        this.routeList.push(path)
        return this
    }
    routeAsRestView(view: RestView): Router {
        let listPath = view.getURLPath(), detailSuffix = view.getURLDetailSuffix()
        this.router.all(listPath, view.getAuthentication() || emptyUse, view.getPermission() || emptyUse, (req, res) => {
            switch (req.method) {
                case 'GET': view.list(req, res); break
                case 'POST': view.create(req, res); break
                case 'OPTIONS': view.options(req, res); break
                default: View.methodNotAllowed(req, res)
            }
        })
        this.router.all(listPath + '/' + detailSuffix,view.getAuthentication() || emptyUse, view.getPermission() || emptyUse, (req, res) => {
            switch (req.method) {
                case 'GET': view.retrieve(req, res); break
                case 'PUT': view.update(req, res); break
                case 'PATCH': view.partialUpdate(req, res); break
                case 'DELETE': view.delete(req, res); break
                case 'OPTIONS': view.options(req, res); break
                default: View.methodNotAllowed(req, res)
            }
        })
        this.routeList.push(listPath, listPath + '/' + detailSuffix)
        return this
    }

    private routeDefaultView() {
        this.router.get('/', (req, res) => {
            res.send(this.routeList)
        })
    }
}

export default Router