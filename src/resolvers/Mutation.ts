import { Mutation as auth } from "resolvers/app/auth"
import { Mutation as song } from "resolvers/app/song"
import { Mutation as lib } from "resolvers/app/library"
import { Mutation as band } from "resolvers/app/band"
import { Mutation as audio } from "resolvers/app/audio"
import { Mutation as follow } from "resolvers/app/follow"
import { Mutation as like } from "resolvers/app/like"
import { Mutation as comment } from "resolvers/app/comment"

export default {
    ...auth,
    ...song,
    ...lib,
    ...band,
    ...audio,
    ...follow,
    ...like,
    ...comment
}