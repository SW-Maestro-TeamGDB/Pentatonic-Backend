import { deepStrictEqual as equal } from "assert"
import app from "test"
import { mergeAudios } from "lib"
import env from "config/env"
import { ApolloError } from "apollo-server-express"

describe("mergeAudios unit test", () => {
    it("3 audios is normally merged to the mp3", async () => {
        const result = await mergeAudios(
            [
                `${env.S3_URI}/violin.mp3`,
                `${env.S3_URI}/violin.mp3`,
                `${env.S3_URI}/violin.mp3`,
            ],
            "mr-2.mp3"
        )
        equal(result, `${env.S3_URI}/mr-2.mp3`)
    }).timeout(100000)
    it("If the wrong input is received", async () => {
        const result = (await mergeAudios(
            ["package.json"],
            "package-lock.json"
        )) as ApolloError
        equal(result.extensions.code, undefined)
    })
}).timeout(100000 << 1)
