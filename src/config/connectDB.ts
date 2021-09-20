import env from "config/env"
import { MongoClient, Db } from "mongodb"

let db: Db | null = null
let instance: number = 0
const connectDB = () => {

    const connect = async () => {

        try {
            const client = await MongoClient.connect(
                process.env.NODE_ENV === "test" ?
                    "mongodb://localhost:27017/test" :
                    env.DB_HOST
                , {
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                })
            const _db = client.db()
            await _db.collection("trend").createIndex({ "createdAt": 1 }, { "expireAfterSeconds": 60 * 60 * 24 * 7 })
            return _db
        } catch (e) {
            console.log(e)
            return null
        }
    }

    const get = async () => {
        if (db !== null) {
            return db
        } else {
            console.log(`getting new db connection`)
            db = await connect()
            return db
        }

    }

    return { get }
}

export default connectDB()