import {
    Song as SongInterface,
    Instrument as InstrumentInterface
} from "resolvers/app/song/models"
import {
    Cover as CoverInterface
} from "resolvers/app/library/models"
import {
    Band as BandInterface
} from "resolvers/app/band/models"
import {
    User as UserInterface
} from "resolvers/app/auth/models"

import { Context } from "config/types"

export const Song = {
    songId: (parent: SongInterface) => parent._id,
    instrument: (parent: SongInterface, args: void, context: Context) =>
        context.loaders.instrumentsLoader.load(parent._id),
    band: (parent: SongInterface, args: void, context: Context) =>
        context.loaders.bandsLoader.load(parent._id)

}

export const UserInfo = {
    band: (parent: UserInterface, args: void, context: Context) => {
        const st = new Set()
        return context.db.collection("join").aggregate([
            {
                $match: { userId: parent.id }
            }, {
                $lookup: {
                    from: "band",
                    localField: "bandId",
                    foreignField: "_id",
                    as: "band"
                }
            }]).toArray().then(u => {
                return u.flatMap(x => {
                    const _id = x.band[0]._id.toString()
                    if (st.has(_id)) {
                        return []
                    }
                    else {
                        st.add(_id)
                        return x.band[0]
                    }
                })
            })
    },
    library: (parent: UserInterface, args: void, context: Context) => {
        if (context.user.id === parent.id) {
            return context.db.collection("library").find({ coverBy: context.user.id }).toArray()
        }
        return null
    }
}

export const BandLink = {
    bandId: (parent: BandInterface) => parent._id,
    likeCount: (parent: BandInterface, args: void, context: Context) => context.loaders.likeCountsLoader.load(parent._id)
}

export const SongLink = {
    songId: (parent: SongInterface) => parent._id
}

export const UserLink = {
    userId: (parent: UserInterface) => parent.id
}

export const Instrument = {
    instId: (parent: InstrumentInterface) => parent._id
}

export const Cover = {
    coverId: (parent: CoverInterface) => parent._id
}

export const Band = {
    bandId: (parent: BandInterface) => parent._id,
    song: (parent: BandInterface, args: void, context: Context) =>
        context.loaders.songsLoader.load(parent.songId.toString()),
    session: (parent: BandInterface, args: void, context: Context) => context.loaders.sessionsLoader.load(parent._id),
    creator: (parent: BandInterface, args: void, context: Context) => context.loaders.userLoader1.load(parent.creatorId),
    likeCount: (parent: BandInterface, args: void, context: Context) => context.loaders.likeCountsLoader.load(parent._id)

}