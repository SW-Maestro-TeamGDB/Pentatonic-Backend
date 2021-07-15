import { ReadStream } from "fs"
import { Db, ObjectID } from "mongodb"
import DataLoader from "dataloader"
export interface File {
    filename: string
    mimetype: string
    encoding: string
    createReadStream: () => ReadStream
}

interface Loaders {
    loaders: {
        instrumentsLoader: DataLoader<ObjectID, any, ObjectID>
    }
}

export interface Redis {
    get(arg1: string): Promise<string | null>
    setex(args1: string, args2: number, args3: string | number): Promise<string>
    del(args1: string): Promise<number>
}

export interface JWTUser {
    id: string
}

export interface Context extends Loaders {
    user: JWTUser
    db: Db
    redis: Redis
}