import * as express from 'express'
import * as path from 'path'
import * as cookieParser from 'cookie-parser'
import * as logger from 'morgan'
import apiRouter from './routes/api-router'
import config from './config'

let app = express()

app.all('*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "*")
    res.header("Access-Control-Allow-Methods","PUT,PATCH,POST,GET,DELETE,OPTIONS")
    next()
});
app.use(logger('dev'))
app.use(express.json({strict: false}))
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(`${config.PREFIX}/static`, express.static(path.join(__dirname, 'public')))

app.use(`${config.PREFIX}/api/`, apiRouter)

export {app}
