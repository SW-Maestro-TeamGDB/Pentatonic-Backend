import DataLoader from "dataloader"
import DB from "config/connectDB"
import { Instrument } from "resolvers/app/song/models"
import { Song } from "resolvers/app/song/models"
import { Band, Session, BatchSesssion, SessionInformation } from "resolvers/app/band/models"
import { ObjectID, Db } from "mongodb"
import { sessionMap } from "config/init"
import { snakeToCamel, camelToSnake } from "lib"
import { PositionRank } from "lib/models"
import { Comment } from "resolvers/app/comment/models"

const batchLoadInstrumentFn = async (songIds: readonly ObjectID[]) => {
    const db = await DB.get() as Db
    const instruments: Instrument[] = await db.collection("instrument").find({ songId: { $in: songIds } }).toArray()
    const table = new Map()
    const resultArray: Instrument[][] = Array.from(Array(songIds.length), () => [])
    songIds.forEach((id, index) => { table.set(id.toString(), index) })
    instruments.forEach((instrument: Instrument) => resultArray[table.get(instrument.songId.toString())].push(instrument))
    return resultArray
}


const batchLoadSongFn = async (songIds: readonly ObjectID[]) => {
    const objIds = songIds.map(s => new ObjectID(s))
    const db = await DB.get() as Db
    const songs: Song[] = await db.collection("song").find({ _id: { $in: objIds } }).toArray()
    return songs
}

const batchLoadUserFn1 = async (userIds: readonly string[]) => {
    const db = await DB.get() as Db
    return await db.collection("user").find({ id: { $in: userIds } }).toArray()
}


const batchLoadSessionFn = async (bandIds: readonly ObjectID[]) => {
    const db = await DB.get() as Db
    const document = await db.collection("freeBand").findOne({ _id: bandIds[0] })
    const collectionName = document === null ? "band" : "freeBand"
    const data = await Promise.all([
        db.collection("session").find({ bandId: { $in: bandIds } }).toArray(),
        db.collection(collectionName).find({ _id: { $in: bandIds } }).toArray()
    ])
    const coverId = data[0].map((e) => e.coverId)
    const library = await db.collection("library").find({ _id: { $in: coverId } }).toArray()
    const table = new Map()
    const resultArray: BatchSesssion[][] = Array.from(Array(bandIds.length), () => [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}])
    bandIds.forEach((id, index) => {
        table.set(id.toString(), index)
    })
    library.forEach(({ _id }, index) => {
        table.set(_id.toString(), index)
    })
    data[1].forEach((band: Band) => {
        for (const [k, v] of Object.entries(band.sessions)) {
            const index = sessionMap[k as keyof SessionInformation], id = table.get(band._id.toString())
            resultArray[id][index] = {
                position: camelToSnake(k) as keyof SessionInformation,
                maxMember: v,
                cover: []
            }
        }
    })
    data[0].forEach((session: Session) => {
        const id = table.get(session.bandId.toString()) as number
        const coverId = session.coverId
        const coverData = library[table.get(coverId.toString())]
        const position = snakeToCamel(coverData.position) as keyof SessionInformation
        (resultArray[id][sessionMap[position]]["cover"] as Session[]).push(coverData)
    })
    return resultArray.map((e: BatchSesssion[]) => e.filter((f: BatchSesssion) => Object.keys(f).length !== 0))
}


const batchLoadBandFn = async (songIds: readonly ObjectID[]) => {
    const db = await DB.get() as Db
    const mp = new Map()
    songIds.forEach((x, idx) => mp.set(x.toString(), idx))
    const resultArr: Band[][] = Array.from(Array(songIds.length), () => [])
    const data = await db.collection("band").find({ songId: { $in: songIds } }).toArray()
    data.forEach(x => {
        const idx = mp.get(x.songId.toString())
        resultArr[idx].push(x)
    })
    bandsLoader.clearAll()
    return resultArr
}

const batchLoadLikeCountFn = async (bandIds: readonly ObjectID[]) => {
    const db = await DB.get() as Db
    const data = await db.collection("like").find({ bandId: { $in: bandIds } }).toArray()
    const mp = new Map()
    bandIds.forEach((x, idx) => mp.set(x.toString(), idx))
    const resultArr: number[] = Array.from(Array(bandIds.length), () => 0)
    data.forEach(({ bandId }) => resultArr[mp.get(bandId.toString())]++)
    return resultArr
}

const batchLoadFollowerCount = async (userIds: readonly string[]) => {
    const mp = new Map(), resultArr = Array.from(Array(userIds.length), () => 0)
    userIds.forEach((x, idx) => mp.set(x, idx))
    const db = await DB.get() as Db
    await db.collection("follow").aggregate([
        { $match: { following: { $in: userIds } } },
        { $group: { _id: "$following", count: { $sum: 1 } } }
    ]).toArray().then(x => x.forEach(({ _id, count }) => resultArr[mp.get(_id)] = count))
    return resultArr
}

const batchLoadFollowingCount = async (userIds: readonly string[]) => {
    const mp = new Map(), resultArr = Array.from(Array(userIds.length), () => 0)
    userIds.forEach((x, idx) => mp.set(x, idx))
    const db = await DB.get() as Db
    await db.collection("follow").aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: "$userId", count: { $sum: 1 } } }
    ]).toArray().then(x => x.forEach(u => resultArr[mp.get(u._id)] = u.count))
    return resultArr
}

const batchLoadPosition = async (userIds: readonly string[]) => {
    const resultArr = Array.from(Array(userIds.length), () => []) as PositionRank[][], db = await DB.get() as Db
    const uIdMapping = userIds.reduce((acc, cur, idx) => {
        acc[cur] = idx
        return acc
    }, {} as { [key: string]: number })
    const joinData = await db.collection("join").find({ userId: { $in: userIds } }).toArray()
    const bandIdObjectId = [...joinData.reduce((acc, cur) => {
        acc.add(cur.bandId.toString())
        return acc
    }, new Set())].map(id => new ObjectID(id))
    const likeCount = await db.collection("like").aggregate([
        { $match: { bandId: { $in: bandIdObjectId } } },
        { $group: { _id: "$bandId", count: { $sum: 1 } } }
    ]).toArray().then(x => {
        return x.reduce((acc, cur) => {
            acc[cur._id.toString()] = cur.count
            return acc
        }, {})
    })
    const positionMap = new Map<string, Map<string, number>>()
    for (const item of joinData) {
        if (likeCount[item.bandId.toString()] === undefined) continue
        const idx = uIdMapping[item.userId], arrLen = resultArr[idx].length, pMap = positionMap.get(item.userId)
        if (pMap === undefined) {
            positionMap.set(item.userId, new Map([[item.position, 0]]))
            resultArr[idx][arrLen] = {
                position: item.position,
                likeCount: likeCount[item.bandId.toString()]
            }
        }
        else if (pMap.get(item.position) === undefined) {
            pMap.set(item.position, arrLen)
            positionMap.set(item.userId, pMap)
            resultArr[idx][arrLen] = {
                position: item.position,
                likeCount: likeCount[item.bandId.toString()]
            }
        }
        else {
            resultArr[idx][pMap.get(item.position) as number]["likeCount"] += likeCount[item.bandId.toString()]
        }
    }
    return resultArr.map((userInfo) => userInfo.sort((a, b) => b.likeCount - a.likeCount))
}

export const batchLoadComment = async (bandIds: readonly ObjectID[]) => {
    const db = await DB.get() as Db
    const data = await db.collection("comment").find({ bandId: { $in: bandIds } }).sort({ createdAt: -1 }).toArray()
    const mp = bandIds.reduce((acc, cur, idx) => {
        acc[cur.toString()] = idx
        return acc
    }, {} as { [key: string]: number })
    const resultArr: Comment[][] = Array.from(Array(bandIds.length), () => [])
    data.forEach((item) => {
        resultArr[mp[item.bandId.toString()]].push(item)
    })
    return resultArr
}

// const batchLoadFollowingStatus = async (userIds: readonly string[]) => {
//     const mp = new Map(), resultArr = Array.from(Array(userIds.length), () => false)
//     userIds.forEach((x, idx) => mp.set(x, idx))
//     const db = await DB.get() as Db
//     await db.collection("follow").aggregate([
//         { $match: { userId: { $in: userIds } } },
//         { $group: { _id: "$userId", count: { $sum: 1 } } }
//     ]).toArray().then(x => x.forEach(({ _id, count }) => resultArr[mp.get(_id)] = count !== 0))
//     return resultArr
// }

// export const followingStatusLoader = new DataLoader(batchLoadFollowingStatus)

export const commentsLoader = new DataLoader(batchLoadComment)

export const positionLoader = new DataLoader(batchLoadPosition)

export const followingLoader = new DataLoader(batchLoadFollowingCount, { cache: false })
export const followerLoader = new DataLoader(batchLoadFollowerCount, { cache: false })
export const userLoader1 = new DataLoader(batchLoadUserFn1)
export const songsLoader = new DataLoader(batchLoadSongFn)
export const instrumentsLoader = new DataLoader(batchLoadInstrumentFn)

export const bandsLoader = new DataLoader(batchLoadBandFn)

export const sessionsLoader = new DataLoader(batchLoadSessionFn)

export const likeCountsLoader = new DataLoader(batchLoadLikeCountFn, { cache: false })