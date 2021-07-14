import { Mutation as auth } from "resolvers/app/auth"
import { Mutation as song } from "resolvers/app/song"

export default {
    ...auth,
    ...song
}