import * as express from 'express'
// import * as path from 'path'
import * as cookieParser from 'cookie-parser'
import * as logger from 'morgan'
import apiRouter from './routes/api-router'
import config from './config'

let app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));

app.use(`${config.PREFIX}/api/`, apiRouter);

export {app}
