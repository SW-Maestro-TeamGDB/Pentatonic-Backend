import { ReadStream, WriteStream } from "fs-capacitor"
import { createWriteStream } from "fs"
import env from "config/env"

export const uploadStream = (stream: ReadStream, path: string) =>
    new Promise((resolve, reject) => {
        const capacitor = new WriteStream()
        const destination = createWriteStream(path)
        stream.pipe(capacitor)
        capacitor
            .createReadStream()
            .pipe(destination)
            .on('error', reject)
            .on('finish', resolve)
    })

const validImageExtensions = [".jpg", ".jpeg", ".png"]

export const isValidImage = (fileName: String) => {
    for (const extension of validImageExtensions) {
        if (fileName.endsWith(extension) === true) {
            return true
        }
    }
    return false
}