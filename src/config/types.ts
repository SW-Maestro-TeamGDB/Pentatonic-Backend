import { ReadStream } from "fs"
import { Db, ObjectID } from "mongodb"
import DataLoader from "dataloader"
import * as loaders from "lib/dataloader"

export interface File {
    filename: string
    mimetype: string
    encoding: string
    createReadStream: () => ReadStream
}
interface Loaders {
    loaders: {
        instrumentsLoader: DataLoader<ObjectID, any, ObjectID>
        songsLoader: DataLoader<string, any, string>
        userLoader1: DataLoader<string, any, string>
        sessionsLoader: DataLoader<ObjectID, any, ObjectID>
        bandsLoader: DataLoader<ObjectID, any, ObjectID>
        likeCountsLoader: DataLoader<ObjectID, any, ObjectID>
        followerLoader: DataLoader<string, any, string>
        followingLoader: DataLoader<string, any, string>
        followingStatusLoader: DataLoader<string, any, string>
        positionLoader: DataLoader<string, any, string>
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