import { Context } from "config/types"
import { MergeAudiosInput } from "resolvers/app/audio/models"
import { mergeAudios as merge } from "lib"
import cryptoRandomString from "crypto-random-string"
export const mergeAudios = async (
    parent: void,
    args: MergeAudiosInput,
    context: Context
) => {
    const audios = args.input.audios.map((x) => x.href)
    const fileName = `${cryptoRandomString({
        length: 16,
        type: "url-safe",
    })}.mp3`
    return merge(audios, fileName)
}
