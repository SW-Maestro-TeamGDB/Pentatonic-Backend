import request from "supertest"
import app from "test"
import env from "config/env"
import { Db } from "mongodb"
import { deepStrictEqual as equal } from "assert"
import DB from "config/connectDB"
import * as Redis from "config/connectRedis"

const songIds: string[] = []
const phoneNumber = `+8210${(env.PHONE_NUMBER as string).slice(3, (env.PHONE_NUMBER as string).length)}`
let token: string = ""

describe("FreeSong Service Test", () => {
    after(async () => {
        const db = await DB.get() as Db
        await Promise.all([
            db.collection("follow").deleteMany({}),
            db.collection("user").deleteMany({}),
            db.collection("song").deleteMany({}),
            db.collection("band").deleteMany({}),
            db.collection("freeBand").deleteMany({})
        ])
    })
    before(async () => {
        await Redis.setex(phoneNumber as string, 600, "123456")
        const query = `
            mutation{
                register(
                    input: {
                        user: {
                            id: "test1234",
                            password: "test1234",
                            username: "test1234",
                            type: 1
                        },
                        phoneNumber: "${phoneNumber}",
                        authCode: 123456
                    }
                )
            }`
        const { body } = await request(app)
            .post("/api")
            .set("Content-Type", "application/json")
            .send(JSON.stringify({ query }))
            .expect(200)
        token = body.data.register
    })
    describe("Mutation createFreeBand", () => {
        describe("Success", () => {
            it("If you normally create free band", async () => {
                const query = `
                    mutation {
                        createFreeBand(
                            input: {
                                song: {
                                    songURI: "${env.S3_URI}/result.mp3",
                                    name: "example Name",
                                    artist: "example Artist"
                                }, 
                                band: {
                                    name: "example Name",
                                    introduce: "example Introduce"
                                },
                                sessionConfig: [{
                                    session: DRUM,
                                    maxMember: 2
                                }]
                            }
                        ){
                            name
                            song{
                                name
                            }
                        }
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.data.createFreeBand.name, "example Name")
                equal(body.data.createFreeBand.song.name, "example Name")
            })
        })
    })
})