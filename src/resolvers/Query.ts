import { Query as auth } from "resolvers/app/auth"
import { Query as health } from "resolvers/app/health"
import { Query as song } from "resolvers/app/song"
import { Query as lib } from "resolvers/app/library"
import { Query as band } from "resolvers/app/band"
import { Query as follow } from "resolvers/app/follow"
import { Query as like } from "resolvers/app/like"

export default {
    ...health,
    ...auth,
    ...song,
    ...lib,
    ...band,
    ...follow,
    ...like
}