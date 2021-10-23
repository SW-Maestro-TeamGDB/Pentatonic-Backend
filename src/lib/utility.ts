import { SessionInformation, SessionConfig } from "resolvers/app/band/models"

export const snakeToCamel = (str: string) =>
    str
        .toLowerCase()
        .replace(/([_][a-z])/g, (group) => group.toUpperCase().replace("_", ""))

export const camelToSnake = (str: string) => {
    return str.replace(/([A-Z])/g, (m) => "_" + m[0]).toUpperCase()
}

export const sessionParse = (x: SessionConfig[]) => {
    const session: SessionInformation = {}
    for (const item of x) {
        session[snakeToCamel(item.session) as keyof SessionInformation] =
            item.maxMember
    }
    return session
}

export const shuffle = (array: any[]) => {
    let currentIndex = array.length,
        randomIndex
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex--
        ;[array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ]
    }
    return array
}

export const rand = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min)) + min

export const getRandomImage = () => {
    const img = [
        "https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=2116&q=80",
        "https://images.unsplash.com/photo-1481886756534-97af88ccb438?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=2532&q=80",
        "https://images.unsplash.com/photo-1521547418549-6a31aad7c177?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1492528086374-eebc6e3fa7ce?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=2076&q=80",
        "https://images.unsplash.com/photo-1519753888173-87c071176960?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=2066&q=80",
    ]
    return img[rand(0, 6)]
}
