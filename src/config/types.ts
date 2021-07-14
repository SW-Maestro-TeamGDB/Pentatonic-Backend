import { ReadStream } from "fs"
import { Db } from "mongodb"
export interface File {
    filename: string
    mimetype: string
    encoding: string
    createReadStream: () => ReadStream
}

export interface Redis {
    get(arg1: string): Promise<string | null>
    setex(args1: string, args2: number, args3: string | number): Promise<string>
    del(args1: string): Promise<number>
}

export interface JWTUser {
    id: string
}

export interface Context {
    user: JWTUser
    db: Db
    redis: Redis
}