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
    describe("Mutation mergeAudios", () => {
        describe("Success", () => {
            it("Successfully merged audio file normally", async () => {
                const query = `
                    mutation {
                        mergeAudios(
                            input: {
                                audios: [
                                    "${env.S3_URI}/violin.m4a",
                                    "${env.S3_URI}/piano.m4a",
                                    "${env.S3_URI}/drum.m4a"
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
