import * as express from "express"
import {encode, decode} from "base64-url"
import {createHmac} from "crypto"
import {User} from "../models/model"
import {UserModel} from "../models/mongo"
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
    /**
     * 给出username和签发时长，签发一个token。
     * @param username
     * @param duration
     */
    static issueToken(username: string, duration: number = 1000 * 60 * 60): string {
        let timestamp = new Date().getTime()
        let header = encode(JSON.stringify({alg: 'HS256', 'typ': 'jwt'}))
        let payload = encode(JSON.stringify({aud: username, iat: timestamp, exp: timestamp + duration}))
        let hmac = createHmac('sha256', config.TOKEN.SECRET)
        let signature = hmac.update(header).update('.').update(payload).digest('hex').toString()
        return `${header}.${payload}.${signature}`
    }

    /**
     * 给出一个token，验证此token是否仍有效，如果有效返回内包含的payload部分。
     * @param token
     */
    static verifyToken(token: string): {aud: string, iat: number, exp: number} | null {
        let t = token.split('.')
        if(t.length < 3) return null
        let hmac = createHmac('sha256', config.TOKEN.SECRET)
        let signature = hmac.update(t[0]).update('.').update(t[1]).digest('hex').toString()
        if(signature === t[2]) {
            let payload: {aud: string, iat: number, exp: number} = JSON.parse(decode(t[1]))
            if(payload.exp >= new Date().getTime()) {
                return payload
            }else{
                return null
            }
        }else{
            return null
        }
    }
}

export class AuthService {
    static async findUserByUsername(username: string): Promise<User | null> {
        return await UserModel.findOne({username}).exec()
    }
    static async createUser(params: {username: string, name: string, password: string, isStaff?: boolean}): Promise<User> {
        return await UserModel.create({
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
        if(token != null) {
            if(token.startsWith(TOKEN_PREFIX)) {
                let payload: {aud:string} | null = TokenService.verifyToken(token.substring(TOKEN_START_INDEX))
                if(payload != null) {
                    let user = await AuthService.findUserByUsername(payload.aud)
                    if(user.isActive) {
                        req['authentication'] = true
                        req['username'] = payload.aud
                        req['user'] = user
                        next()
                    }else{
                        res.status(401).send('Invalid token')
                    }
                }else{
                    res.status(401).send('Invalid token')
                }
            }else{
                res.status(401).send('Invalid token type')
            }
        }else{
            req['authentication'] = false
            next()
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