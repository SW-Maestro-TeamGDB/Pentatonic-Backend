import { deepStrictEqual as equal } from "assert"
import app from "test"
import { getAudioDuration } from "lib"
import env from "config/env"

describe("getAudioDuration unit test", () => {
    it("get duration of the m4a file", async () => {
        const audioDuration = await getAudioDuration(`${env.S3_URI}/violin.m4a`)
        equal(audioDuration, 216.711837)
    }).timeout(100000)
    it("get duration of the wav", async () => {
        const audioDuration = await getAudioDuration(`${env.S3_URI}/mr-1.wav`)
        equal(audioDuration, 216.711837)
    }).timeout(100000)
    it("get duration of the mp3", async () => {
        const audioDuration = await getAudioDuration(`${env.S3_URI}/mr-2.mp3`)
        equal(audioDuration, 216.737959)
    }).timeout(100000)
}).timeout(100000 << 1)