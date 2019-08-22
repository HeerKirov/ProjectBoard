import * as express from 'express'
import {Token, User} from "../models/model"
import {Selector} from "../common/selector"
import {RestView, Use, View} from "../common/view"
import {AuthService, TokenService, authentication, permission} from "../services/user-service"
import config from "../config"


export class TokenView extends RestView {
    getURLPath(): string {
        return '/token'
    }
    getURLDetailSuffix(): string {
        return ':token'
    }

    private selector = new Selector([
        {name: 'token', readonly: true},
        {name: 'username', readonly: true},
        {name: 'createTime', readonly: true},
        {name: 'updateTime', readonly: true},
        {name: 'effectiveDuration', readonly: true},
        {name: 'expireTime', readonly: true}
    ])

    async create(req: express.Request, res: express.Response) {
        let body: {username?: string, password?: string, effectiveDuration?: number} = req.body
        if(!(body.username && body.password)) {
            res.status(400).send('Invalid Field List')
            return
        }
        let user = await AuthService.authenticate(body.username, body.password)
        if(user == null) {
            res.status(401).send('Authenticate Failed')
            return
        }
        let userAgent = req.headers["user-agent"] || null
        let ip = req.ip
        let duration = TokenView.calcDuration(body.effectiveDuration)
        let token = await TokenService.issueToken(user, duration, userAgent, ip)
        res.status(201).send(this.selector.readFields(token, true))
    }
    async retrieve(req: express.Request, res: express.Response) {
        let token = req.params.token
        let result: Token | string = await TokenService.verifyToken(token)
        if(typeof result === 'string') {
            res.status(401).send(result)
            return
        }
        res.send(this.selector.readFields(result, true))
    }
    async update(req: express.Request, res: express.Response) {
        let body: {effectiveDuration?: number} = req.body
        let token = req.params.token
        let result: Token | string = await TokenService.verifyToken(token)
        if(typeof result === 'string') {
            res.status(401).send(result)
            return
        }
        result = await TokenService.updateToken(result, TokenView.calcDuration(body.effectiveDuration))
        res.send(this.selector.readFields(result, true))
    }
    async delete(req: express.Request, res: express.Response) {
        let token = req.params.token
        let result: Token | string = await TokenService.verifyToken(token)
        if(typeof result === 'string') {
            res.status(401).send(result)
            return
        }
        result.remove().finally()
        res.sendStatus(204)
    }

    private static calcDuration(paramDuration: number | null): number | null {
        if(paramDuration > 0) {
            if(config.TOKEN.MAX_DURATION > 0) {
                return paramDuration > config.TOKEN.MAX_DURATION ? config.TOKEN.MAX_DURATION : paramDuration
            }else{
                return paramDuration
            }
        }else{
            return config.TOKEN.DURATION > 0 ? config.TOKEN.DURATION : null
        }
    }
}

export class UserView extends View {
    getURLPath(): string {
        return '/profile'
    }

    protected authentication(): Use {
        return authentication.ALL
    }
    protected permission(): Use {
        return permission.LOGIN
    }

    private selector = new Selector([
        {name: 'username', readonly: true},
        'name',
        {name: 'dateJoined', readonly: true},
        {name: 'lastLoginIp', readonly: true},
        {name: 'lastLogin', readonly: true},
        {name: 'isStaff', readonly: true},
        {name: 'imageHash', readonly: true}
    ])

    async get(req: express.Request, res: express.Response): Promise<void> {
        let user: User = req['user']
        res.send(this.selector.readFields(user, true))
    }
    async put(req: express.Request, res: express.Response, partial: boolean = false) {
        let user: User = req['user']

        let setter = this.selector.writeFields(req.body, partial);
        if(!setter) {
            res.status(400).send('Wrong Field List')
            return
        }
        await user.set(setter).save()
        res.send(this.selector.readFields(user, true))
    }
    async patch(req: express.Request, res: express.Response) {
        await this.put(req, res, true)
    }
}