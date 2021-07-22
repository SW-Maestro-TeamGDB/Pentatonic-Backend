import { UploadCoverFileInput } from "resolvers/app/library/models"
import { Context } from "config/types"
import { ApolloError } from "apollo-server-express"
import { uploadS3 } from "lib"


const isValidAudio = (name: string) => {
    for (const extension of ["mp3", "m4a"]) {
        if (name.endsWith(extension)) {
            return true
        }
    }
    return false
}

export const uploadCoverFile = async (parent: void, args: UploadCoverFileInput, context: Context) => {
    const file = await args.input.file
    if (isValidAudio(file.filename) === false) {
        return new ApolloError("mp3, m4a 파일이 아닙니다")
    }
    const stream = file.createReadStream()
    const fileName = `${Date.now()}-${file.filename}`
    return await uploadS3(stream, fileName, file.mimetype)
}