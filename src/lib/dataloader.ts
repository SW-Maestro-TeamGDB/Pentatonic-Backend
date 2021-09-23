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
import { LikeStatusBatch } from "resolvers/app/like/models"

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
    const db = await DB.get() as Db
    const resultArray: Song[] = Array.from(Array(songIds.length))
    const mp = songIds.reduce((acc, cur, idx) => {
        if (acc[cur.toString()]) {
            acc[cur.toString()].push(idx)
        }
        else {
            acc[cur.toString()] = [idx]
        }
        return acc
    }, {} as { [key: string]: number[] })
    const songs: Song[] = await db.collection("song").find({ _id: { $in: songIds } }).toArray()
    songs.forEach(song => {
        const key = song._id.toString()
        while (mp[key].length) {
            const idx = mp[key].pop()
            resultArray[idx as number] = song
        }
    })
    return resultArray
}

const batchLoadUserFn1 = async (userIds: readonly string[]) => {
    const mp = userIds.reduce((acc, cur, idx) => {
        if (acc[cur]) {
            acc[cur].push(idx)
        } else {
            acc[cur] = [idx]
        }
        return acc
    }, {} as { [key: string]: number[] })
    const db = await DB.get() as Db
    const data = await db.collection("user").find({ id: { $in: userIds } }).toArray()
    const resultArray = Array.from(Array(userIds.length))
    data.forEach(item => {
        const key = item.id
        while (mp[key].length) {
            const idx = mp[key].pop()
            resultArray[idx as number] = item
        }
    })
    return resultArray
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

const batchLoadComment = async (bandIds: readonly ObjectID[]) => {
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

const batchLoadLikeStatus = async (bandData: readonly LikeStatusBatch[]) => {
    const db = await DB.get() as Db
    const mp = bandData.reduce((acc, cur, idx) => {
        acc[cur.bandId.toString()] = idx
        return acc
    }, {} as { [key: string]: number })
    const retArr: boolean[] = Array.from(Array(bandData.length), () => false)
    const likeStatus = await db.collection("like").find({ $or: bandData as LikeStatusBatch[] }).toArray()
    likeStatus.forEach((like) => {
        retArr[mp[like.bandId.toString()]] = true
    })
    return retArr
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

export const likeStatusLoader = new DataLoader(batchLoadLikeStatus, { cache: false })

export const commentsLoader = new DataLoader(batchLoadComment, { cache: false })

export const positionLoader = new DataLoader(batchLoadPosition, { cache: false })

export const followingLoader = new DataLoader(batchLoadFollowingCount, { cache: false })
export const followerLoader = new DataLoader(batchLoadFollowerCount, { cache: false })
export const userLoader1 = new DataLoader(batchLoadUserFn1, { cache: false })
export const songsLoader = new DataLoader(batchLoadSongFn, { cache: false })
export const instrumentsLoader = new DataLoader(batchLoadInstrumentFn, { cache: false })

export const bandsLoader = new DataLoader(batchLoadBandFn, { cache: false })

export const sessionsLoader = new DataLoader(batchLoadSessionFn, { cache: false })

export const likeCountsLoader = new DataLoader(batchLoadLikeCountFn, { cache: false })