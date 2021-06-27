import { Mutation as upload } from "resolvers/upload"
import { Mutation as auth } from "resolvers/app/auth"

export default {
    // ...upload,
    ...auth
}