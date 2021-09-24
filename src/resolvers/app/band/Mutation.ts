import { Context } from "config/types"
import {
    CreateBandInput,
    SessionInformation,
    OutBandInput,
    JoinBandInput,
    UpdateBandInput,
    UpdateBandQuery,
    DeleteBandInput,
} from "resolvers/app/band/models"
import { sessionParse, snakeToCamel } from "lib"
import { ObjectID } from "mongodb"
import { ApolloError } from "apollo-server-express"

export const createBand = async (
    parent: void,
    args: CreateBandInput,
    context: Context
) => {
    if (args.input.band.isSoloBand) {
        if (
            args.input.sessionConfig.length > 1 ||
            args.input.sessionConfig[0].maxMember !== 1 ||
            args.input.sessionConfig.length === 0
        ) {
            throw new ApolloError(
                "솔로 밴드의 세션은 언제나 1명만 참여 가능합니다"
            )
        }
    }
    const sessionArr: SessionInformation = sessionParse(
        args.input.sessionConfig
    )
    const song = await context.db
        .collection("song")
        .findOne({ _id: new ObjectID(args.input.band.songId) })
    return context.db
        .collection("band")
        .insertOne({
            creatorId: context.user.id,
            name: args.input.band.name,
            introduce: args.input.band.introduce,
            songId: new ObjectID(args.input.band.songId),
            backGroundURI: args.input.band.backGroundURI.href,
            sessions: { ...sessionArr },
            isFreeBand: song.isFreeSong === true ? true : false,
            createDate: new Date(),
            isSoloBand: args.input.band.isSoloBand,
        })
        .then(({ ops }) => ops[0])
}

export const joinBand = async (
    parent: void,
    args: JoinBandInput,
    context: Context
) => {
    const data = await Promise.all([
        context.db
            .collection("band")
            .findOne({ _id: new ObjectID(args.input.band.bandId) }),
        context.db
            .collection("join")
            .find({
                bandId: new ObjectID(args.input.band.bandId),
                position: args.input.session.position,
            })
            .toArray(),
        context.db.collection("library").findOne({
            _id: new ObjectID(args.input.session.coverId),
            position: args.input.session.position,
        }),
    ])
    if (data[0] === null) {
        throw new ApolloError("밴드가 존재하지 않습니다")
    }
    if (data[2] === null) {
        throw new ApolloError("커버내역이 존재하지 않습니다")
    }
    if (
        data[1].find((x) => x.coverId.toString() === args.input.session.coverId)
    ) {
        throw new ApolloError("이미 참여한 유저입니다")
    }
    const myPosition = snakeToCamel(args.input.session.position)
    try {
        if (
            !data[0]["sessions"][myPosition] ||
            data[1].length >= data[0]["sessions"][myPosition]
        ) {
            throw new Error()
        }
        return context.db
            .collection("join")
            .insertOne({
                bandId: new ObjectID(args.input.band.bandId),
                position: args.input.session.position,
                userId: context.user.id,
                coverId: new ObjectID(args.input.session.coverId),
            })
            .then(({ result }) => result.n === 1)
    } catch {
        throw new ApolloError("세션이 가득찾거나 존재하지 않습니다")
    }
}

export const leaveBand = async (
    parent: void,
    args: OutBandInput,
    context: Context
) => {
    const uid = context.user.id
    const cover = await context.db.collection("library").findOne({
        _id: new ObjectID(args.input.session.coverId),
    })
    if (cover !== null) {
        const [join, band] = await Promise.all([
            context.db.collection("join").findOne({
                bandId: new ObjectID(args.input.band.bandId),
                coverId: new ObjectID(args.input.session.coverId),
            }),
            context.db.collection("band").findOne({
                _id: new ObjectID(args.input.band.bandId),
                creatorId: uid,
            }),
        ])
        if (join !== null) {
            if (cover.coverBy.toString() === context.user.id || band !== null) {
                return context.db
                    .collection("join")
                    .deleteOne({
                        bandId: new ObjectID(args.input.band.bandId),
                        position: cover.position,
                        userId: cover.coverBy,
                        coverId: new ObjectID(args.input.session.coverId),
                    })
                    .then(({ result }) => result.n === 1)
            }
            throw new ApolloError("권한이 없습니다")
        } else {
            throw new ApolloError("세션이 존재하지 않습니다")
        }
    }
    throw new ApolloError("해당 커버가 존재하지 않습니다")
}

export const updateBand = async (
    parent: void,
    args: UpdateBandInput,
    context: Context
) => {
    const bandInfo = await context.db
        .collection("band")
        .findOne({ _id: new ObjectID(args.input.band.bandId) })
    if (bandInfo === null || bandInfo.creatorId !== context.user.id) {
        throw new ApolloError("권한이 없거나 밴드가 올바르지 않습니다")
    }
    const { bandId, ...data } = args.input.band
    const query: UpdateBandQuery = {
        $set: data,
    }
    if (Object.keys(data).length === 0 && !args.input.sessionConfig) {
        return context.db.collection("band").findOne({
            _id: new ObjectID(args.input.band.bandId),
        })
    }
    if (args.input.sessionConfig !== undefined) {
        if (bandInfo.isSoloBand) {
            throw new ApolloError(
                "이 밴드는 솔로밴드입니다 세션 정보를 수정할 수 없습니다"
            )
        }
        const nowSession = await context.db
            .collection("join")
            .find({ bandId: new ObjectID(args.input.band.bandId) })
            .toArray()
        const session = args.input.sessionConfig
        const mp = new Map()
        nowSession.forEach((x) => {
            const mpResult = mp.get(x.position)
            if (mpResult === undefined) {
                mp.set(x.position, 1)
            } else {
                mp.set(x.position, mpResult + 1)
            }
        })
        session.forEach((x) => {
            const result = mp.get(x.session)
            if (result === undefined) {
                return
            }
            if (result <= x.maxMember) {
                mp.delete(x.session)
                return
            }
            throw new ApolloError(
                "현재 세션에 있는 유저를 없앤뒤 다시 수정해주세요"
            )
        })
        if ([...mp].length > 0) {
            throw new ApolloError(
                "현재 세션에 있는 유저를 없앤뒤 다시 수정해주세요"
            )
        }
        (query.$set.sessions as SessionInformation) = sessionParse(
            args.input.sessionConfig
        )
    }
    return context.db
        .collection("band")
        .findOneAndUpdate(
            {
                _id: new ObjectID(args.input.band.bandId),
            },
            query,
            { returnDocument: "after" }
        )
        .then(({ value }) => value)
}

export const deleteBand = async (
    parent: void,
    args: DeleteBandInput,
    context: Context
) => {
    const bandDeleteResult = await context.db
        .collection("band")
        .findOneAndDelete({
            _id: new ObjectID(args.input.band.bandId),
            creatorId: context.user.id,
        })
        .then(({ value }) => value)
    if (bandDeleteResult) {
        const promiseArray = [
            context.db.collection("join").deleteMany({
                bandId: new ObjectID(args.input.band.bandId),
            }),
            context.db.collection("like").deleteMany({
                bandId: new ObjectID(args.input.band.bandId),
            }),
            context.db.collection("comment").deleteMany({
                bandId: new ObjectID(args.input.band.bandId),
            }),
        ]
        if (bandDeleteResult.isFreeBand) {
            promiseArray.push(
                context.db.collection("song").deleteMany({
                    _id: new ObjectID(bandDeleteResult.songId),
                })
            )
            promiseArray.push(
                context.db.collection("library").deleteMany({
                    songId: new ObjectID(bandDeleteResult.songId),
                })
            )
        }
        await Promise.all(promiseArray)
    }
    return bandDeleteResult ? true : false
}
