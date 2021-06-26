import { ReadStream } from "fs"

export interface File {
    filename: string
    mimetype: string
    encoding: string
    createReadStream: () => ReadStream
}