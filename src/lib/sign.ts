import { genSaltSync, hashSync, compareSync } from "bcrypt"

export const createHashedPassword = (password: string) => {
    const saltRounds = 10
    const salt = genSaltSync(saltRounds)
    const hashedPassword = hashSync(password, salt)
    return hashedPassword
}

export const checkPassword = (password: string, hashedPassword: string) => compareSync(password, hashedPassword)