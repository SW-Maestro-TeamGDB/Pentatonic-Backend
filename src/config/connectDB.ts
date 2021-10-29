import env from "config/env"
import { MongoClient, Db } from "mongodb"

let db: Db | null = null
const connectDB = () => {
    const connect = async () => {
        try {
            const client = await MongoClient.connect(
                process.env.NODE_ENV === "test"
                    ? "mongodb://localhost:27017/test"
                    : env.DB_HOST,
                {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                }
            )
            const _db = client.db()
            await Promise.all([
                _db
                    .collection("trend")
                    .createIndex(
                        { createdAt: 1 },
                        { expireAfterSeconds: 60 * 60 * 24 * 7 }
                    ),
                _db
                    .collection("view")
                    .createIndex(
                        { createdAt: 1 },
                        { expireAfterSeconds: 60 * 30 }
                    ),
                _db.collection("user").createIndex({ id: 1 }, { unique: true }),
                _db
                    .collection("user")
                    .createIndex({ phoneNumber: 1 }, { unique: true }),
                _db
                    .collection("user")
                    .createIndex({ username: 1 }, { unique: true }),
            ])

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
