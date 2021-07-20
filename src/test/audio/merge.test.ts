import { deepStrictEqual as equal } from "assert"
import app from "test"
import { mergeAudios } from "lib"
import env from "config/env"
import { ApolloError } from "apollo-server-express"

describe("mergeAudios unit test", () => {
    it("2 audios is normally merged to the wav", async () => {
        const result = await mergeAudios([
            `${env.S3_URI}/drum.m4a`,
            `${env.S3_URI}/violin.m4a`
        ], "mr-1.wav")
        equal(result, `${env.S3_URI}/mr-1.wav`)
    }).timeout(100000)
    it("3 audios is normally merged to the mp3", async () => {
        const result = await mergeAudios([
            `${env.S3_URI}/drum.m4a`,
            `${env.S3_URI}/piano.m4a`,
            `${env.S3_URI}/violin.m4a`
        ], "mr-2.mp3")
        equal(result, `${env.S3_URI}/mr-2.mp3`)
    }).timeout(100000)
    it("If the wrong input is received", async () => {
        const result = await mergeAudios([
            "package.json"
        ], "package-lock.json") as ApolloError
        equal(result.extensions.code, undefined)
    })
}).timeout(100000 << 1)