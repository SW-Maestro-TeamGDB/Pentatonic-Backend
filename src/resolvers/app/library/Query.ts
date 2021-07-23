import { Context } from "config/types"
import {
    GetCoverBySongIdInput,
    GetCoverByNameInput
} from "resolvers/app/library/models"
import { ObjectID } from "mongodb"

export const getMyCovers = async (parent: void, args: void, context: Context) =>
    context.db.collection("library").find({
        creatorId: context.user.id
    }).toArray()


export const getCoverBySongId = async (parent: void, args: GetCoverBySongIdInput, context: Context) =>
    context.db.collection("library").find({
        songId: new ObjectID(args.input.cover.songId),
        creatorId: context.user.id,
    }).toArray()

export const getCoverByName = async (parent: void, args: GetCoverByNameInput, context: Context) =>
    context.db.collection("library").find({
        creatorId: context.user.id,
        name: { $regex: new RegExp(args.input.cover.name, "ig") },
    }).toArray()