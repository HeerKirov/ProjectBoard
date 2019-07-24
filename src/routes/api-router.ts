import Router from '../common/router'
import * as express from 'express'
import {TokenView, UserView} from "../views/user-view"
import {MaterialView, ModuleView, NoteView, ProjectView, TaskView} from "../views/project-view"

let expressRouter = express.Router()

let router = new Router(expressRouter)

router.routeAsView(new TokenView())
router.routeAsView(new UserView())
router.routeAsRestView(new ProjectView())
router.routeAsRestView(new MaterialView())
router.routeAsRestView(new ModuleView())
router.routeAsRestView(new NoteView())
router.routeAsRestView(new TaskView())

export default expressRouter
