import * as express from 'express'
import * as multer from 'multer'
import {Model} from "mongoose"
import {RestMethod, RestView, RestViewSet, Use} from "../common/view"
import {Selector} from "../common/selector"
import {optionsUse} from "../common/router"
import {Dict, MongoID} from "../common/utils"
import {authentication, permission} from "../services/user-service"
import {ImgService, OssService, UPLOAD_PATH} from "../services/img-service"
import {ImgSelector} from "../selectors/img-selector"
import {ImageModel, ProjectModel} from "../models/mongo"
import {Img} from "../models/model"
import config from "../config"

const upload = multer({dest: UPLOAD_PATH})
const TYPE = config.IMAGE.TYPE

export class ResourceImgView extends RestView {
    static asView(router: express.Router) {
        let view = new ResourceImgView()
        let path = view.getURLPath()
        router.post(path, view.getAuthentication(), view.getPermission(), upload.single('file'), (req, res) => view.create(req, res))
        router.options(path, optionsUse)
        router.get(path + '/' + view.getURLDetailSuffix(), (req, res) => view.retrieve(req, res))
    }
    getURLPath(): string {
        return "/resource/images"
    }

    getAuthentication(): Use {
        return authentication.ALL
    }
    getPermission(): Use {
        return permission.LOGIN
    }

    async create(req: express.Request, res: express.Response): Promise<void> {
        if(req.file == undefined) {
            res.status(400).send('No File')
            return
        }
        let type = req.body.type
        let img
        if(type === 'public') {
            let projectId: string = req.body.projectId
            let project = await ProjectModel.findById(MongoID.oid(projectId)).exec()
            if(project!= null && !project._user.equals(req['user']._id)) {
                res.status(400).send('Wrong Project')
                return
            }
            img = await ImgService.savePublicImage(req.file.filename, req['user'], project)
        }else if(type === 'cover') {
            let projectId: string = req.body.projectId
            if(projectId == null) {
                res.status(400).send('Need "projectId"')
                return
            }
            let project = await ProjectModel.findById(MongoID.oid(projectId)).exec()
            if(project == null || !project._user.equals(req['user']._id)) {
                res.status(400).send('Wrong Project')
                return
            }
            img = await ImgService.saveCoverImage(req.file.filename, req['user'], project)
        }else if(type === 'avatar') {
            img = await ImgService.saveAvatarImage(req.file.filename, req['user'])
        }else{
            res.status(400).send('Wrong Type')
            return
        }
        res.status(201).send(ImgSelector.readFields(img))
    }

    async retrieve(req: express.Request, res: express.Response): Promise<void> {
        if(TYPE === 'oss') {
            res.redirect(OssService.signUrl(req.params.id + '.jpg'))
        }else{
            res.redirect(`${config.PREFIX}/static/${config.IMAGE.FILEPATH}${req.params.id}.jpg`)
        }
    }
}

export class ImgView extends RestViewSet<Img> {
    protected resourceName(): string {
        return "image"
    }

    protected methods(): RestMethod[] {
        return ['LIST', 'RETRIEVE', 'DELETE']
    }

    protected queryModel(): Model<Img> {
        return ImageModel
    }
    protected selector(): Selector {
        return ImgSelector
    }
    protected authentication(): Use {
        return authentication.ALL
    }
    protected permission(): Use {
        return permission.LOGIN
    }

    protected sortFields(): string[] {
        return ['uploadTime', 'project']
    }
    protected sortDefaultField(): string {
        return '-uploadTime'
    }
    protected filterDefaultField(): Dict<any> {
        return {type: 'public'}
    }

    async performDelete(instance: Img): Promise<void> {
        await ImgService.deleteImage(instance._id)
    }
}