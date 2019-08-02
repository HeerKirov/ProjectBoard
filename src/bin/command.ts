import config from '../config'
import * as mongoose from 'mongoose'
import {AuthService, TokenService} from "../services/user-service";

async function test() {

}

async function init() {
    console.log('Initializing user ...')
    let initUser = await AuthService.findUserByUsername(config.INITIAL_USER.USERNAME)
    if(initUser != null) {
        console.log('Init user is already exists.')
    }else{
        await AuthService.createUser({
            username: config.INITIAL_USER.USERNAME,
            name: config.INITIAL_USER.NAME,
            password: config.INITIAL_USER.PASSWORD,
            isStaff: true
        })
        console.log('Init user is created.')
    }
    await mongoose.disconnect()
}

async function cleanToken() {
    console.log('clean expired token ...')
    await TokenService.cleanToken()
    console.log('clean completed.')
}

(async function(argv: string[]) {
    if(argv.length <= 2) {
        console.warn('Please choose one command.')
        await mongoose.disconnect()
        return;
    }
    switch (argv[2].toLowerCase()) {
        case 'init': await init(); break
        case 'test': await test(); break
        case 'clean-token': await cleanToken(); break
        default:
            console.log(`Unknown command '${argv[2]}'.`)
            await mongoose.disconnect()
    }
})(process.argv)
