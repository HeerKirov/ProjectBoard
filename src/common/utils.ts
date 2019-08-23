import {ObjectID} from "mongodb"

const EmptyObjectId: ObjectID = new ObjectID(String.fromCharCode(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0))

export class MongoID {
    static oid(id: string): ObjectID {
        if(ObjectID.isValid(id)) {
            return ObjectID.createFromHexString(id)
        }else{
            return EmptyObjectId
        }
    }
}

export interface Dict<T> {[key: string]: T}