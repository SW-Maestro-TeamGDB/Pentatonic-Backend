import { UserInputError } from "apollo-server-errors"
import { GraphQLScalarType, Kind } from "graphql"

const isValidId = (value: string) => {
    if (!(5 < value.length && value.length < 15)) {
        throw new UserInputError("id의 길이는 6이상 14이하여야 합니다")
    }
    for (const c of value) {
        if (!('a' <= c && c <= 'z' || 'A' <= c && c <= 'Z' || '0' <= c && c <= '9')) {
            throw new UserInputError("id는 영문 소문자, 대문자, 숫자여야합니다")
        }
    }
    return value
}

const specialCharacters = "\"'\\!@#$%^&*()_-=+/?.><,[{]}|;:"

const isValidPassword = (value: string) => {
    if (!(5 < value.length && value.length < 15)) {
        throw new UserInputError("Password의 길이는 6이상 14이하여야 합니다")
    }
    for (const c of value) {
        if (!('a' <= c && c <= 'z' || 'A' <= c && c <= 'Z' || '0' <= c && c <= '9' || specialCharacters.includes(c) === true)) {
            throw new UserInputError("Password는 영문 소문자, 대문자, 숫자, 특수문자여야 합니다")
        }
    }
    return true
}

const isValidUsername = (value: string) => {
    if (!(2 <= value.length && value.length < 15)) {
        throw new UserInputError("username의 길이는 6이상 14이하여야 합니다")
    }
    for (const c of value) {
        if (!('a' <= c && c <= 'z' || 'A' <= c && c <= 'Z' || '0' <= c && c <= '9')) {
            throw new UserInputError("username은 영문 소문자, 대문자, 숫자여야 합니다")
        }
    }
    return value
}

const GraphQLId = new GraphQLScalarType({
    name: 'Id',
    description: '길이는 5 ~ 15, 영문과 숫자',
    parseValue: isValidId,
    serialize: isValidId,
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            return isValidId(ast.value)
        }
        return null
    },
})

const GraphQLPassword = new GraphQLScalarType({
    name: 'Password',
    description: '길이는 5 ~ 15, 영문, 숫자, 특수문자',
    parseValue: isValidPassword,
    serialize: isValidPassword,
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            return isValidPassword(ast.value)
        }
        return null
    }
})

const GraphQLUsername = new GraphQLScalarType({
    name: 'Username',
    description: '길이는 2 ~ 15, 영문, 한글, 숫자',
    parseValue: isValidUsername,
    serialize: isValidUsername,
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            return isValidUsername(ast.value)
        }
        return null
    }
})

export const customScalar = {
    Username: GraphQLUsername,
    Password: GraphQLPassword,
    Id: GraphQLId,
}