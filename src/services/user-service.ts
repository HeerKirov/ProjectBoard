import * as express from "express"
import {encode, decode} from "base64-url"
import {createHmac} from "crypto"
import {Token, User} from "../models/model"
import {TokenModel, UserModel} from "../models/mongo"
import config from "../config"

const AUTH_BEARER_PREFIX = 'Bearer'
const AUTH_BEARER_START_INDEX = AUTH_BEARER_PREFIX.length + 1
const AUTH_BASIC_PREFIX = 'Basic'
const AUTH_BASIC_START_INDEX = AUTH_BASIC_PREFIX.length + 1

class PasswordUtil {
    static encrypt(password: string, userKeyMessage: string): string {
        let hmac = createHmac('sha256', config.TOKEN.SECRET)
        return hmac.update(password).update(userKeyMessage).digest('hex').toString()
    }
}

export class TokenService {
    static readonly VERIFY_TOKEN_EXCEPTION = {
        NO_SUCH_TOKEN: 'No Such Token',
        EXPIRED: 'Expired'
    }
    private static generateTokenString(username: string, now: number, ip: string): string {
        let hmac = createHmac('sha256', config.TOKEN.SECRET)
        return hmac.update(`${username}.${now}.${ip}`).digest('hex').toString()
    }
    static issueToken(user: User, effective: number | null, platform: string, ip: string): Promise<Token> {
        let now = new Date().getTime()
        return TokenModel.create({
            token: TokenService.generateTokenString(user.username, now, ip),
            _user: user._id,
            username: user.username,
            platform,
            ip,
            createTime: now,
            updateTime: now,
            effectiveDuration: effective,
            expireTime: effective ? effective + now : null
        })
    }

    static async verifyToken(tokenString: string): Promise<Token | string> {
        let token = await TokenModel.findOne({token: tokenString}).exec()
        if(token == null) return TokenService.VERIFY_TOKEN_EXCEPTION.NO_SUCH_TOKEN
        if(token.expireTime) {
            let now = new Date().getTime()
            if(token.expireTime < now) {
                token.remove().finally()
                return TokenService.VERIFY_TOKEN_EXCEPTION.EXPIRED
            }else{
                return token
            }
        }else{
            return token
        }
    }

    static updateToken(token: Token, effectiveDuration: number): Promise<Token> {
        let now = new Date().getTime()
        return token.set({updateTime: now, effectiveDuration, expireTime: effectiveDuration ? effectiveDuration + now : null}).save()
    }

    static async cleanToken(all: boolean = false): Promise<void> {
        await TokenModel.deleteMany({}).where('expireTime').lt(new Date().getTime()).exec()
    }

    static async expressTokenAuthenticate(token: string, req: express.Request, res: express.Response, next) {
        let result = await TokenService.verifyToken(token)
        if(typeof result === 'string') {
            res.status(401).send(result)
            return
        }
        let user = await UserModel.findById((result as Token)._user).exec()
        if(user.isActive) {
            req['authentication'] = true
            req['username'] = user.username
            req['user'] = user
            next()
        }else{
            res.status(401).send('No Such User')
        }
    }
}

export class AuthService {
    static findUserByUsername(username: string): Promise<User | null> {
        return UserModel.findOne({username}).exec()
    }
    static createUser(params: {username: string, name: string, password: string, isStaff?: boolean}): Promise<User> {
        let now = new Date().getTime()
        return UserModel.create({
            username: params.username,
            name: params.name,
            password: PasswordUtil.encrypt(params.password, now.toString()),
            dateJoined: now,
            isStaff: params.isStaff || false
        })
    }

    static async authenticate(username: string, password: string): Promise<User| null> {
        let user = await UserModel.findOne({username}).exec()
        if(user && user.password === PasswordUtil.encrypt(password, user.dateJoined.toString())) {
            return user
        }else{
            return null
        }
    }
    static async setPassword(user: User, newPassword: string): Promise<void> {
        await user.set({password: PasswordUtil.encrypt(newPassword, user.dateJoined.toString())}).save()
    }

    static async expressBasicAuthenticate(token: string, req: express.Request, res: express.Response, next) {
        let split = decode(token).split(":", 2)
        let username = split[0]
        let password = split[1]
        let user = await AuthService.authenticate(username, password)
        if(!user) {
            res.status(401).send('Authenticate Failed')
        }else if(user.isActive) {
            req['authentication'] = true
            req['username'] = user.username
            req['user'] = user
            next()
        }else{
            res.status(401).send('No Such User')
        }
    }
}

export const authentication = {
    async BASIC_AUTH(req: express.Request, res: express.Response, next) {
        let token = req.headers.authorization
        if(!token) {
            req['authentication'] = false
            next();return
        }
        if(!token.startsWith(AUTH_BASIC_PREFIX)) {
            res.status(401).send('Invalid Basic Auth Type')
            return
        }
        AuthService.expressBasicAuthenticate(token.substring(AUTH_BASIC_START_INDEX), req, res, next).finally()
    },
    async TOKEN(req: express.Request, res: express.Response, next) {
        let token = req.headers.authorization
        if(!token) {
            req['authentication'] = false
            next();return
        }
        if(!token.startsWith(AUTH_BEARER_PREFIX)) {
            res.status(401).send('Invalid Token Type')
            return
        }
        TokenService.expressTokenAuthenticate(token.substring(AUTH_BEARER_START_INDEX), req, res, next).finally()
    },
    async ALL(req: express.Request, res: express.Response, next) {
        let token = req.headers.authorization
        if(!token) {
            req['authentication'] = false
            next()
        }else if(token.startsWith(AUTH_BEARER_PREFIX)) {
            TokenService.expressTokenAuthenticate(token.substring(AUTH_BEARER_START_INDEX), req, res, next).finally()
        }else if(token.startsWith(AUTH_BASIC_PREFIX)) {
            AuthService.expressBasicAuthenticate(token.substring(AUTH_BASIC_START_INDEX), req, res, next).finally()
        }else{
            res.status(401).send('Invalid Token Type')
        }
    }
}

export const permission = {
    LOGIN(req: express.Request, res: express.Response, next) {
        if(req['authentication']) {
            next()
        }else{
            res.sendStatus(401)
        }
    },
    STAFF(req: express.Request, res: express.Response, next) {
        if(req.method.toUpperCase() === 'OPTIONS') {
            next()
            return
        }
        if(req['authentication'] && req['user'].isStaff) {
            next()
        }else{
            res.sendStatus(403)
        }
    }
}