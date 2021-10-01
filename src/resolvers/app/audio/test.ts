import request from "supertest"
import app from "test"

import fetch from "node-fetch"
import env from "config/env"
import { deepStrictEqual as equal } from "assert"
import * as redis from "config/connectRedis"
import { Redis, JWTUser } from "config/types"
import DB from "config/connectDB"
import jwt from "jsonwebtoken"
import { Db } from "mongodb"

describe("Audio Services Test", () => {
    after(async () => {
        const db = (await DB.get()) as Db
        await db.collection("audio").deleteMany({})
    })
    describe("Mutation mergeAudios", () => {
        describe("Success", () => {
            it("Successfully merged audio file normally", async () => {
                const query = `
                    mutation {
                        mergeAudios(
                            input: {
                                audios: [
                                    "${env.S3_URI}/violin.mp3",
                                    "${env.S3_URI}/violin.mp3",
                                    "${env.S3_URI}/violin.mp3"
                                ]
                            }
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set({ "Content-Type": "application/json" })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.data.mergeAudios.startsWith("https://"), true)
            }).timeout(50000)
        })
    })
})
