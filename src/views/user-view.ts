import * as express from 'express'
import {User} from "../models/model"
import {Selector} from "../common/selector"
import {Use, View} from "../common/view"
import {AuthService, TokenService, authentication, permission} from "../services/user-service"
import config from "../config"


export class TokenView extends View {
    getURLPath(): string {
        return '/token'
    }

    get(req: express.Request, res: express.Response) {
        let token = req.query.token
        if(!token) {
            res.send({ok: false})
        }else{
            let payload: {aud: string, iat: number, exp: number} | null = TokenService.verifyToken(token)
            if(payload) {
                res.send({ok: true, username: payload.aud, exp: payload.exp})
            }else{
                res.send({ok: false})
            }
        }
    }
    async post(req: express.Request, res: express.Response) {
        let body: {username?: string, password?: string, duration?: number} = req.body
        if(body.username && body.password) {
            let user = await AuthService.authenticate(body.username, body.password)
            if(user != null) {
                let duration = body.duration ? (body.duration < config.TOKEN.MAX_DURATION ? body.duration : config.TOKEN.MAX_DURATION) : config.TOKEN.DURATION
                let token = TokenService.issueToken(user.username, duration)
                res.contentType('text/plain').send(token)
            }else{
                res.sendStatus(401)
            }
        }else{
            res.sendStatus(400)
        }
    }
}

export class UserView extends View {
    getURLPath(): string {
        return '/profile'
    }

    protected authentication(): Use {
        return authentication.TOKEN
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

    get(req: express.Request, res: express.Response) {
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