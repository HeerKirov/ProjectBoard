import Router from '../common/router'
import * as express from 'express'
import {TokenView, UserView} from "../views/user-view"
import {ProjectView} from "../views/project-view"
import {ModuleView} from "../views/module-view"
import {NoteView, ModuleNoteView, ProjectNoteView} from "../views/note-view"
import {TaskListView, TaskView, ModuleTaskView, ProjectTaskView} from "../views/task-view"
import {ImgView, ResourceImgView} from "../views/img-view"

let expressRouter = express.Router()

let router = new Router(expressRouter)

router.routeAsRestView(new TokenView())
router.routeAsView(new UserView())
router.routeAsRestView(new ProjectView())
router.routeAsRestView(new ProjectTaskView())
router.routeAsRestView(new ProjectNoteView())
router.routeAsRestView(new ModuleView())
router.routeAsRestView(new ModuleNoteView())
router.routeAsRestView(new ModuleTaskView())
router.routeAsRestView(new NoteView())
router.routeAsRestView(new TaskView())
router.routeAsRestView(new TaskListView())
router.routeAsRestView(new ImgView())
router.route(ResourceImgView.asView)
export default expressRouter
