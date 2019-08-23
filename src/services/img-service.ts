import * as child from 'child_process'
import * as path from "path"
import * as fs from 'fs'
import * as OSS from 'ali-oss'
import {Types} from "mongoose"
import config from "../config"
import {ImageModel} from "../models/mongo"
import {Project, User, Img} from "../models/model"

const CONVERT = config.IMAGE.CONVERT

export const UPLOAD_PATH = path.join(__dirname, `../../${config.IMAGE.UPLOAD_PATH}`)
export const FS_PATH = path.join(__dirname, `../../public/${config.IMAGE.FILEPATH}`)

export class OssService {
    private static readonly ossClient = config.IMAGE.TYPE === 'oss' ? new OSS({
        accessKeyId: config.IMAGE.OSS.ACCESS_KEY_ID,
        accessKeySecret: config.IMAGE.OSS.ACCESS_KEY_SECRET,
        bucket: config.IMAGE.OSS.BUCKET,
        region: config.IMAGE.OSS.REGION
    }) : null
    private static cache: {[key: string]: {URL: string, timeout: number}} = {}

    static client(): OSS {
        return OssService.ossClient
    }
    static signUrl(filename: string): string {
        let now = new Date().getTime()
        let cache = OssService.cache[filename]
        if(cache != null && cache.timeout > now) {
            return cache.URL
        }else{
            let expires = config.IMAGE.OSS.SIGN_TIMEOUT
            let URL = OssService.client().signatureUrl(filename, {expires})
            let timeout = expires + now
            OssService.cache[filename] = {timeout, URL}
            return URL
        }
    }
}


export interface Size {
    width: number
    height: number
}

export class ImgService {
    static initFsPath() {
        if(!fs.existsSync(UPLOAD_PATH)) {
            console.log(`CREATE UPLOAD PATH "${UPLOAD_PATH}"`)
            fs.mkdirSync(UPLOAD_PATH, {recursive: true})
        }
        if(!fs.existsSync(FS_PATH)) {
            console.log(`CREATE FS PATH "${FS_PATH}"`)
            fs.mkdirSync(FS_PATH, {recursive: true})
        }
    }
    static async getSize(file: string): Promise<Size> {
        return new Promise<Size>((resolve, reject) => {
            child.exec(`convert ${file} -print "%w*%h" /dev/null`, (error, stdout, stderr) => {
                if(error) {
                    reject(new Error(stderr))
                }else{
                    let split = stdout.split("*")
                    resolve({width: parseInt(split[0]), height: parseInt(split[1])})
                }
            })
        })
    }
    static async cropResize(file: string, output: string, params?: {radius?: number, area?: Size}): Promise<void> {
        let crop = '', resize = ''
        let originSize = await ImgService.getSize(file), originRadius = originSize.width / originSize.height
        let size = originSize
        if(params && params.radius && params.radius !== originRadius) {
            size = originRadius < params.radius ?
                {width: originSize.width, height: originSize.width / params.radius} :
                {width: originSize.height * params.radius, height: originSize.height}
            crop = ` -gravity center -crop ${size.width}x${size.height}+0+0`
        }
        if(params && params.area && (size.width > params.area.width || size.height > params.area.height)) {
            resize = ` -resize ${params.area.width}x${params.area.height}`
        }
        return new Promise<void>((resolve, reject) => {
            child.exec(`convert ${file}${crop}${resize} ${output}`, (error, stdout, stderr) => {
                if(error) {
                    reject(new Error(stderr))
                }else{
                    resolve()
                }
            })
        })
    }
    static async save(filename: string, goalName: string, type: "public" | "avatar" | "cover") {
        /*上传业务流程：
            1 multer把图片上传到某个私有文件夹，并提供path、filename，并获得original name和extension
            2 如果是avatar或cover的image，那么执行裁剪流程
            3 如果public图片尺寸过大，将其缩小到确定的尺寸内
            4 如果图片非jpg格式，将其转换为jpg格式.所有存档的图片的目标格式都是jpg！
            5 将图片转移到images文件夹
            6 删除原先的暂存文件
            7 如果是oss模式，将其上传到oss，并删除源文件
         */
        let originFile = path.join(UPLOAD_PATH, filename)
        let params = type === 'public' ? {area: CONVERT.PUBLIC_MAX_SIZE} :
                     type === 'avatar' ? {area: CONVERT.AVATAR_SIZE, radius: CONVERT.AVATAR_SIZE.width / CONVERT.AVATAR_SIZE.height} :
                                         {area: CONVERT.COVER_SIZE, radius: CONVERT.COVER_SIZE.width / CONVERT.COVER_SIZE.height}
        if(config.IMAGE.TYPE === 'oss') {
            await ImgService.cropResize(originFile, originFile, params)
            await OssService.client().put(goalName + '.jpg', originFile)
        }else{
            await ImgService.cropResize(originFile, path.join(FS_PATH, goalName + '.jpg'), params)
        }
        fs.unlinkSync(originFile)
    }

    static async savePublicImage(filename: string, user: User, project?: Project): Promise<Img> {
        let imgModel = await ImageModel.create({
            type: "public",
            uploadTime: new Date().getTime(),
            _user: user._id,
            _project: project ? project._id : null
        })
        ImgService.save(filename, imgModel._id, "public").finally()
        return imgModel
    }

    static async saveAvatarImage(filename: string, user: User): Promise<Img> {
        let imgModel = await ImageModel.create({
            type: "avatar",
            uploadTime: new Date().getTime(),
            _user: user._id
        })
        ImgService.save(filename, imgModel._id, "avatar").finally()
        if(user.avatarId != null) {
            await ImgService.deleteImage(user.avatarId)
        }
        await user.set({avatarId: imgModel._id}).save()
        return imgModel
    }

    static async saveCoverImage(filename: string, user: User, project: Project): Promise<Img> {
        let imgModel = await ImageModel.create({
            type: "cover",
            uploadTime: new Date().getTime(),
            _user: user._id,
            _project: project._id
        })
        ImgService.save(filename, imgModel._id, "cover").finally()
        if(project.coverId!= null) {
            await ImgService.deleteImage(project.coverId)
        }
        await project.set({coverId: imgModel._id}).save()
        return imgModel
    }

    static async deleteImage(id: string | Types.ObjectId): Promise<void> {
        let goalName = (typeof id === 'string' ? id : id.toHexString()) + '.jpg'
        if(config.IMAGE.TYPE === 'oss') {
            OssService.client().delete(goalName).finally()
        }else{
            fs.unlinkSync(path.join(FS_PATH, goalName))
        }
        await ImageModel.deleteOne({_id: id}).exec()
    }
}

ImgService.initFsPath()