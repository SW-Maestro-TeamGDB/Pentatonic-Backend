import { genSaltSync, hashSync, compareSync } from "bcryptjs"
import jwt from "jsonwebtoken"
import env from "config/env"
import { JWTUser } from "config/types"
export const createHashedPassword = (password: string) => {
    const saltRounds = 10
    const salt = genSaltSync(saltRounds)
    const hashedPassword = hashSync(password, salt)
    return hashedPassword
}

export const checkPassword = (password: string, hashedPassword: string) => compareSync(password, hashedPassword)

export const getUser = (token: string): JWTUser | null => {
    try {
        return jwt.verify(token, env.JWT_SECRET) as JWTUser
    } catch {
        return null
    }
}