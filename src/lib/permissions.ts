import { rule, shield } from "graphql-shield"
import { ApolloError } from "apollo-server-express"
import { JWTUser } from "config/types"
import { Db } from "mongodb"
const isLogin = rule()(async (parent: void, args: void, { user, db }: { user: JWTUser, db: Db }) => {
    if (user === null) {
        return new ApolloError("Authorization Error")
    }
    if (await db.collection("user").findOne({ id: user.id }) === null) {
        return new ApolloError("인증 정보가 유효하지 않습니다")
    }
    return true
})

export const permissions = shield({
    Mutation: {
        changePassword: isLogin,
        uploadProfile: isLogin,
        changeProfile: isLogin
    },
    Query: {
        getPersonalInformation: isLogin
    }
})