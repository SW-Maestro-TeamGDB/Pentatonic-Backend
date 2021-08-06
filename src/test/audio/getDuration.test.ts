import { deepStrictEqual as equal } from "assert"
import app from "test"
import { getAudioDuration } from "lib"
import env from "config/env"

describe("getAudioDuration unit test", () => {
    it("get duration of the m4a file", async () => {
        const audioDuration = await getAudioDuration(`${env.S3_URI}/violin.m4a`)
        equal(1 <= audioDuration && audioDuration <= 100, true)
    }).timeout(100000)
    it("get duration of the wav", async () => {
        const audioDuration = await getAudioDuration(`${env.S3_URI}/mr-1.wav`)
        equal(216 <= audioDuration && audioDuration <= 217, true)
    }).timeout(100000)
    it("get duration of the mp3", async () => {
        const audioDuration = await getAudioDuration(`${env.S3_URI}/mr-2.mp3`)
        equal(216 <= audioDuration && audioDuration <= 217, true)
    }).timeout(100000)
}).timeout(100000 << 1)