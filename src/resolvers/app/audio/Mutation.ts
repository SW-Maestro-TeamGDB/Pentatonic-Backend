import { Context } from "config/types"
import { MergeAudiosInput } from "resolvers/app/audio/models"
import { mergeAudios as merge } from "lib"
import cryptoRandomString from "crypto-random-string"
export const mergeAudios = async (
    parent: void,
    args: MergeAudiosInput,
    context: Context
) => {
    const audios = args.input.audios.map((x) => x.href).sort()
    const fileName = `${Date.now()}-${cryptoRandomString({
        length: 16,
        type: "url-safe",
    })}.mp3`
    const cache = await context.db
        .collection("audio")
        .findOne({ audios: audios.join("/") })
    if (cache) {
        return cache.link
    } else {
        const link = await merge(audios, fileName)
        await context.db.collection("audio").insertOne({
            audios: audios.join("/"),
            link,
        })
        return link
    }
}
