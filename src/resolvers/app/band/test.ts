import request from "supertest"
import app from "test"
import env from "config/env"
import { Db } from "mongodb"
import { deepStrictEqual as equal } from "assert"
import DB from "config/connectDB"
import * as Redis from "config/connectRedis"

const songIds: string[] = []
const coverIds: string[] = []
const bandIds: string[] = []
const phoneNumber = `+8210${(env.PHONE_NUMBER as string).slice(3, (env.PHONE_NUMBER as string).length)}`
let token: string = ""

describe("Band services test", () => {
    after(async () => {
        const db = await DB.get() as Db
        await Promise.all([
            db.collection("user").deleteMany({}),
            db.collection("song").deleteMany({}),
            db.collection("library").deleteMany({}),
            db.collection("band").deleteMany({})
        ])
    })
    describe("Before Register & upload", () => {
        it("mock user register", async () => {
            await Redis.setex(phoneNumber as string, 600, "123456")
            const query = `
            mutation{
                register(
                    input: {
                        user:{
                            id: "user1234",
                            password: "user1234",
                            username: "pukuba",
                            type: 1
                        },
                        phoneNumber: "${phoneNumber}",
                        authCode: 123456
                    }
                )
            }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            token = body.data.register
        })
        it("Successfully uploaded a song", async () => {
            const query = `
                    mutation{
                        uploadSong(
                            input: {
                                code: "${env.JWT_SECRET}",
                                song: {
                                    name: "Viva La Vida",
                                    songURI: "${env.S3_URI}/result.mp3",
                                    songImg: "https://kr.seaicons.com/wp-content/uploads/2016/05/Letter-P-blue-icon.png",
                                    genre: "Pop",
                                    artist: "artist",
                                    weeklyChallenge: false,
                                    releaseDate: "2019-01-01",
                                    level: 2,
                                    album: "Viva la Vida or Death and All His Friends"
                                }
                            }
                        ){
                            songId
                        }
                    }`
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            songIds.push(body.data.uploadSong.songId)
        })
    })
    describe("Mutation createBand", () => {
        describe("Success", () => {
            it("Successfully create band", async () => {
                const query = `
                    mutation{
                        createBand(
                            input: {
                                band: {
                                    songId:"${songIds[0]}",
                                    introduce:"Test-Band-1",
                                    name:"테스트 밴드입니다 >.<"
                                },
                                sessionConfig:[
                                    {
                                        session: GAYAGEUM,
                                        maxMember:1
                                    }
                                ]
                            }
                        ){
                            bandId
                            name
                            song{
                                name
                                songId
                            }
                            session{
                                position
                            }
                            creator{
                                username
                                userId
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
                equal(body.data.createBand.name, "테스트 밴드입니다 >.<")
                equal(body.data.createBand.song.name, "Viva La Vida")
                equal(body.data.createBand.song.songId, songIds[0])
                equal(body.data.createBand.session[0].position, "GAYAGEUM")
                equal(body.data.createBand.creator.username, "pukuba")
                equal(body.data.createBand.creator.userId, "user1234")
                bandIds.push(body.data.createBand.bandId)
            })
        })
    })
})