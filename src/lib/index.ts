export * from "lib/permissions"
export * from "lib/sms"
export * from "lib/sign"
export * from "lib/upload"
export * from "lib/audio"
export * from "lib/dataloader"



import {
    SessionInformation,
    SessionConfig
} from "resolvers/app/band/models"


export const snakeToCamel = (str: string) =>
    str.toLowerCase().replace(/([_][a-z])/g, group =>
        group
            .toUpperCase()
            .replace('_', '')
    )


export const camelToSnake = (str: string) => {
    return str.replace(/([A-Z])/g, (m) => "_" + m[0]).toUpperCase()
}

export const sessionParse = (x: SessionConfig[]) => {
    const session: SessionInformation = {}
    for (const item of x) {
        session[snakeToCamel(item.session) as keyof SessionInformation] = item.maxMember
    }
    return session
}