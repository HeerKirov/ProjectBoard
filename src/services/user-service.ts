import * as express from "express"
import {encode, decode} from "base64-url"
import {createHmac} from "crypto"
import {Token, User} from "../models/model"
import {TokenModel, UserModel} from "../models/mongo"
import config from "../config"

const TOKEN_PREFIX = 'Bearer'
const TOKEN_START_INDEX = TOKEN_PREFIX.length + 1

class PasswordUtil {
    static encrypt(password: string): string {
        return password
    }
    static equal(password1: string, password2: string): boolean {
        return password1 === password2
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
}

export class AuthService {
    static findUserByUsername(username: string): Promise<User | null> {
        return UserModel.findOne({username}).exec()
    }
    static createUser(params: {username: string, name: string, password: string, isStaff?: boolean}): Promise<User> {
        return UserModel.create({
            username: params.username,
            name: params.name,
            password:PasswordUtil.encrypt(params.password),
            dateJoined: new Date().getTime(),
            isStaff: params.isStaff || false
        })
    }

    static async authenticate(username: string, password: string): Promise<User| null> {
        let user = await UserModel.findOne({username}).exec()
        if(user && PasswordUtil.equal(user.password, password)) {
            return user
        }else{
            return null
        }
    }
}

export const authentication = {
    async TOKEN(req: express.Request, res: express.Response, next) {
        let token = req.headers.authorization
        if(token == null) {
            req['authentication'] = false
            next();return
        }
        if(!token.startsWith(TOKEN_PREFIX)) {
            res.status(401).send('Invalid Token Type')
            return
        }
        let result = await TokenService.verifyToken(token.substring(TOKEN_START_INDEX))
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

export const permission = {
    LOGIN(req: express.Request, res: express.Response, next) {
        if(req['authentication']) {
            next()
        }else{
            res.sendStatus(401)
        }
    },
    STAFF(req: express.Request, res: express.Response, next) {
        if(req['authentication'] && req['user'].isStaff) {
            next()
        }else{
            res.sendStatus(403)
        }
    }
}