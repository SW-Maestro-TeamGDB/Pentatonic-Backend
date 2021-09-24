import { UserInputError, ApolloError } from "apollo-server-errors"
import { GraphQLScalarType, Kind } from "graphql"
import Hangul from "hangul-js"

const specialCharacters = "\"'\\!@#$%^&*()_-=+/?.><, [{]}|;:"

const isValidName = (value: string) => {
    if (!(2 <= value.length && value.length <= 40)) {
        return new ApolloError("Name의 길이는 2이상 40이하여야 합니다", "400")
    }
    for (const c of value) {
        if (
            !(
                ("a" <= c && c <= "z") ||
                ("A" <= c && c <= "Z") ||
                ("0" <= c && c <= "9") ||
                Hangul.isComplete(c) ||
                specialCharacters.includes(c) === true
            )
        ) {
            return new ApolloError(
                "Name의 영문 소문자, 대문자, 숫자, 특수문자, 올바른 한글 이여야 합니다",
                "400"
            )
        }
    }
    return value
}

const isValidId = (value: string) => {
    if (!(5 < value.length && value.length < 15)) {
        return new ApolloError("id의 길이는 6이상 14이하여야 합니다", "400")
    }
    for (const c of value) {
        if (
            !(
                ("a" <= c && c <= "z") ||
                ("A" <= c && c <= "Z") ||
                ("0" <= c && c <= "9")
            )
        ) {
            return new ApolloError(
                "id는 영문 소문자, 대문자, 숫자여야합니다",
                "400"
            )
        }
    }
    return value
}

const isValidPassword = (value: string) => {
    if (!(5 < value.length && value.length < 15)) {
        return new ApolloError(
            "Password의 길이는 6이상 14이하여야 합니다",
            "400"
        )
    }
    for (const c of value) {
        if (
            !(
                ("a" <= c && c <= "z") ||
                ("A" <= c && c <= "Z") ||
                ("0" <= c && c <= "9") ||
                specialCharacters.includes(c) === true
            )
        ) {
            return new ApolloError(
                "Password는 영문 소문자, 대문자, 숫자, 특수문자여야 합니다",
                "400"
            )
        }
    }
    return value
}

const isValidUsername = (value: string) => {
    if (!(2 <= value.length && value.length < 15)) {
        return new ApolloError(
            "username의 길이는 6이상 14이하여야 합니다",
            "400"
        )
    }
    for (const c of value) {
        if (
            !(
                ("a" <= c && c <= "z") ||
                ("A" <= c && c <= "Z") ||
                ("0" <= c && c <= "9") ||
                Hangul.isComplete(c)
            )
        ) {
            return new ApolloError(
                "username은 영문 소문자, 대문자, 숫자, 올바른 한글 이여야 합니다",
                "400"
            )
        }
    }
    return value
}

const GraphQLId = new GraphQLScalarType({
    name: "Id",
    description: "길이는 5 ~ 15, 영문과 숫자",
    parseValue: isValidId,
    serialize: isValidId,
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            return isValidId(ast.value)
        }
        return new ApolloError("Id는 String입니다", "400")
    },
})

const GraphQLPassword = new GraphQLScalarType({
    name: "Password",
    description: "길이는 5 ~ 15, 영문, 숫자, 특수문자",
    parseValue: isValidPassword,
    serialize: isValidPassword,
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            return isValidPassword(ast.value)
        }
        return new ApolloError("Password는 String입니다", "400")
    },
})

const GraphQLUsername = new GraphQLScalarType({
    name: "Username",
    description: "길이는 2 ~ 15, 영문, 한글, 숫자",
    parseValue: isValidUsername,
    serialize: isValidUsername,
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            return isValidUsername(ast.value)
        }
        return new ApolloError("Username은 String입니다", "400")
    },
})

const GraphQLName = new GraphQLScalarType({
    name: "Name",
    description: "길이는 2 ~ 40, 영문, 한글, 숫자, 특수문자",
    parseValue: isValidName,
    serialize: isValidName,
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            return isValidName(ast.value)
        }
        return new ApolloError("Name은 String입니다", "400")
    },
})

export const customScalar = {
    Username: GraphQLUsername,
    Password: GraphQLPassword,
    Id: GraphQLId,
    Name: GraphQLName,
}
