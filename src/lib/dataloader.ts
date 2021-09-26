import DataLoader from "dataloader"
import DB from "config/connectDB"
import { Instrument } from "resolvers/app/song/models"
import { Song } from "resolvers/app/song/models"
import {
    Band,
    Session,
    BatchSesssion,
    SessionInformation,
} from "resolvers/app/band/models"
import { ObjectID, Db } from "mongodb"
import { sessionMap } from "config/init"
import { snakeToCamel, camelToSnake } from "lib"
import { PositionRank } from "lib/models"
import { Comment } from "resolvers/app/comment/models"
import { LikeStatusBatch } from "resolvers/app/like/models"
import { Follow } from "resolvers/app/follow/models"

const generateIdxTable = (keys: readonly (string | ObjectID)[]) =>
    keys.reduce((acc, cur, idx) => {
        if (acc[cur.toString()]) {
            acc[cur.toString()].push(idx)
        } else {
            acc[cur.toString()] = [idx]
        }
        return acc
    }, {} as { [key: string]: number[] })

const batchLoadInstrumentFn = async (songIds: readonly ObjectID[]) => {
    const db = (await DB.get()) as Db
    const instruments: Instrument[] = await db
        .collection("instrument")
        .find({ songId: { $in: songIds } })
        .toArray()
    const idxTable = generateIdxTable(songIds)
    const resultArray: Instrument[][] = Array.from(
        Array(songIds.length),
        () => []
    )
    instruments.forEach((instrument: Instrument) => {
        const key = instrument.songId.toString()
        idxTable[key].forEach((idx) => resultArray[idx].push(instrument))
    })
    return resultArray
}

const batchLoadSongFn = async (songIds: readonly ObjectID[]) => {
    const db = (await DB.get()) as Db
    const resultArray: Song[] = Array.from(Array(songIds.length))
    const idxTable = generateIdxTable(songIds)
    const songs: Song[] = await db
        .collection("song")
        .find({ _id: { $in: songIds } })
        .toArray()
    songs.forEach((song) => {
        const key = song._id.toString()
        idxTable[key].forEach((idx) => (resultArray[idx] = song))
    })
    return resultArray
}

const batchLoadUserFn1 = async (userIds: readonly string[]) => {
    const idxTable = generateIdxTable(userIds)
    const db = (await DB.get()) as Db
    const data = await db
        .collection("user")
        .find({ id: { $in: userIds } })
        .toArray()
    const resultArray = Array.from(Array(userIds.length))
    data.forEach((item) => {
        const key = item.id
        idxTable[key].forEach((idx) => (resultArray[idx] = item))
    })
    return resultArray
}

const batchLoadSessionFn = async (bandIds: readonly ObjectID[]) => {
    const db = (await DB.get()) as Db
    const data = await Promise.all([
        db
            .collection("join")
            .find({ bandId: { $in: bandIds } })
            .toArray(),
        db
            .collection("band")
            .find({ _id: { $in: bandIds } })
            .toArray(),
    ])
    const coverId = data[0].map((e) => e.coverId)
    const library = await db
        .collection("library")
        .find({ _id: { $in: coverId } })
        .toArray()
    const table = new Map()
    const resultArray: BatchSesssion[][] = Array.from(
        Array(bandIds.length),
        () => [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
    )
    bandIds.forEach((id, index) => {
        table.set(id.toString(), index)
    })
    library.forEach(({ _id }, index) => {
        table.set(_id.toString(), index)
    })
    data[1].forEach((band: Band) => {
        for (const [k, v] of Object.entries(band.sessions)) {
            const index = sessionMap[k as keyof SessionInformation],
                id = table.get(band._id.toString())
            resultArray[id][index] = {
                position: camelToSnake(k) as keyof SessionInformation,
                maxMember: v,
                cover: [],
            }
        }
    })
    data[0].forEach((session: Session) => {
        const id = table.get(session.bandId.toString()) as number
        const coverId = session.coverId
        const coverData = library[table.get(coverId.toString())]
        const position = snakeToCamel(
            coverData.position
        ) as keyof SessionInformation
        ;(resultArray[id][sessionMap[position]]["cover"] as Session[]).push(
            coverData
        )
    })
    return resultArray.map((e: BatchSesssion[]) =>
        e.filter((f: BatchSesssion) => Object.keys(f).length !== 0)
    )
}

const batchLoadBandFn = async (songIds: readonly ObjectID[]) => {
    const db = (await DB.get()) as Db
    const resultArray: Band[][] = Array.from(Array(songIds.length), () => [])
    const data = await db
        .collection("band")
        .find({ songId: { $in: songIds } })
        .toArray()
    const idxTable = generateIdxTable(songIds)
    data.forEach((band: Band) => {
        const key = band.songId.toString()
        idxTable[key].forEach((idx) => resultArray[idx].push(band))
    })
    return resultArray
}

const batchLoadLikeCountFn = async (bandIds: readonly ObjectID[]) => {
    const db = (await DB.get()) as Db
    const data = await db
        .collection("like")
        .find({ bandId: { $in: bandIds } })
        .toArray()
    const mp = new Map()
    bandIds.forEach((x, idx) => mp.set(x.toString(), idx))
    const resultArray: number[] = Array.from(Array(bandIds.length), () => 0)
    data.forEach(({ bandId }) => resultArray[mp.get(bandId.toString())]++)
    return resultArray
}

const batchLoadFollowerCount = async (userIds: readonly string[]) => {
    const idxTable = generateIdxTable(userIds),
        resultArray = Array.from(Array(userIds.length), () => 0)
    const db = (await DB.get()) as Db
    await db
        .collection("follow")
        .aggregate([
            { $match: { following: { $in: userIds } } },
            { $group: { _id: "$following", count: { $sum: 1 } } },
        ])
        .toArray()
        .then((x) =>
            x.forEach(({ _id, count }) => {
                idxTable[_id].forEach((idx) => (resultArray[idx] += count))
            })
        )
    return resultArray
}

const batchLoadFollowingCount = async (userIds: readonly string[]) => {
    const idxTable = generateIdxTable(userIds),
        resultArray = Array.from(Array(userIds.length), () => 0)
    const db = (await DB.get()) as Db
    await db
        .collection("follow")
        .aggregate([
            { $match: { userId: { $in: userIds } } },
            { $group: { _id: "$userId", count: { $sum: 1 } } },
        ])
        .toArray()
        .then((x) =>
            x.forEach((u) => {
                idxTable[u._id].forEach((idx) => (resultArray[idx] += u.count))
            })
        )
    return resultArray
}

const batchLoadPosition = async (userIds: readonly string[]) => {
    const resultArray = Array.from(
            Array(userIds.length),
            () => []
        ) as PositionRank[][],
        db = (await DB.get()) as Db
    const uIdMapping = userIds.reduce((acc, cur, idx) => {
        acc[cur] = idx
        return acc
    }, {} as { [key: string]: number })
    const joinData = await db
        .collection("join")
        .find({ userId: { $in: userIds } })
        .toArray()
    const bandIdObjectId = [
        ...joinData.reduce((acc, cur) => {
            acc.add(cur.bandId.toString())
            return acc
        }, new Set()),
    ].map((id) => new ObjectID(id))
    const likeCount = await db
        .collection("like")
        .aggregate([
            { $match: { bandId: { $in: bandIdObjectId } } },
            { $group: { _id: "$bandId", count: { $sum: 1 } } },
        ])
        .toArray()
        .then((x) => {
            return x.reduce((acc, cur) => {
                acc[cur._id.toString()] = cur.count
                return acc
            }, {})
        })
    const positionMap = new Map<string, Map<string, number>>()
    for (const item of joinData) {
        if (likeCount[item.bandId.toString()] === undefined) continue
        const idx = uIdMapping[item.userId],
            arrLen = resultArray[idx].length,
            pMap = positionMap.get(item.userId)
        if (pMap === undefined) {
            positionMap.set(item.userId, new Map([[item.position, 0]]))
            resultArray[idx][arrLen] = {
                position: item.position,
                likeCount: likeCount[item.bandId.toString()],
            }
        } else if (pMap.get(item.position) === undefined) {
            pMap.set(item.position, arrLen)
            positionMap.set(item.userId, pMap)
            resultArray[idx][arrLen] = {
                position: item.position,
                likeCount: likeCount[item.bandId.toString()],
            }
        } else {
            resultArray[idx][pMap.get(item.position) as number]["likeCount"] +=
                likeCount[item.bandId.toString()]
        }
    }
    return resultArray.map((userInfo) =>
        userInfo.sort((a, b) => b.likeCount - a.likeCount)
    )
}

const batchLoadComment = async (bandIds: readonly ObjectID[]) => {
    const db = (await DB.get()) as Db,
        idxTable = generateIdxTable(bandIds)
    const data = await db
        .collection("comment")
        .find({ bandId: { $in: bandIds } })
        .sort({ createdAt: -1 })
        .toArray()
    const resultArray: Comment[][] = Array.from(Array(bandIds.length), () => [])
    data.forEach((item) => {
        idxTable[item.bandId.toString()].forEach((idx) =>
            resultArray[idx].push(item)
        )
    })
    return resultArray
}

const batchLoadLikeStatus = async (bandData: readonly LikeStatusBatch[]) => {
    const db = (await DB.get()) as Db,
        idxTable = generateIdxTable(bandData.map((x) => x.bandId))
    const resultArray: boolean[] = Array.from(
        Array(bandData.length),
        () => false
    )
    const likeStatus = await db
        .collection("like")
        .find({ $or: bandData as LikeStatusBatch[] })
        .toArray()
    likeStatus.forEach((like) => {
        idxTable[like.bandId.toString()].forEach(
            (idx) => (resultArray[idx] = true)
        )
    })
    return resultArray
}

const batchLoadFollowingStatus = async (follow: readonly Follow[]) => {
    const resultArr = Array.from(Array(follow.length), () => false)
    const idxTable = generateIdxTable(follow.map((x) => x.following))
    const db = (await DB.get()) as Db
    await db
        .collection("follow")
        .find({ $or: follow as Follow[] })
        .toArray()
        .then((x) =>
            x.forEach((data) => {
                idxTable[data.following].forEach(
                    (idx) => (resultArr[idx] = true)
                )
            })
        )
    return resultArr
}

export const followingStatusLoader = new DataLoader(batchLoadFollowingStatus, {
    cache: false,
})

export const likeStatusLoader = new DataLoader(batchLoadLikeStatus, {
    cache: false,
})

export const commentsLoader = new DataLoader(batchLoadComment, {
    cache: false,
})

export const positionLoader = new DataLoader(batchLoadPosition, {
    cache: false,
})

export const followingLoader = new DataLoader(batchLoadFollowingCount, {
    cache: false,
})
export const followerLoader = new DataLoader(batchLoadFollowerCount, {
    cache: false,
})
export const userLoader1 = new DataLoader(batchLoadUserFn1, { cache: false })
export const songsLoader = new DataLoader(batchLoadSongFn, { cache: false })
export const instrumentsLoader = new DataLoader(batchLoadInstrumentFn, {
    cache: false,
})

export const bandsLoader = new DataLoader(batchLoadBandFn, { cache: false })

export const sessionsLoader = new DataLoader(batchLoadSessionFn, {
    cache: false,
})

export const likeCountsLoader = new DataLoader(batchLoadLikeCountFn, {
    cache: false,
})
