import { Mutation as auth } from "resolvers/app/auth"
import { Mutation as song } from "resolvers/app/song"
import { Mutation as lib } from "resolvers/app/library"

export default {
    ...auth,
    ...song,
    ...lib
}