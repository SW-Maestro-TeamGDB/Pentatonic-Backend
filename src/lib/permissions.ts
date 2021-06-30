import { rule, shield } from "graphql-shield"
import { ApolloError } from "apollo-server-express"
import { JWTUser } from "config/types"

const isLogin = rule()((parent: void, args: void, { user }: { user: JWTUser }) => {
    if (user === null) {
        return new ApolloError("Authorization Error")
    }
    return true
})

export const permissions = shield({
    Mutation: {
        resetPassword: isLogin
    }
})