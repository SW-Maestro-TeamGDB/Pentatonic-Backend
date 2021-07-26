export const includes = (str: string, search: string) => {
    const result = str.includes(search)
    if (false === result) {
        return new Error(`Expected ${str} to include ${search}`)
    }
    return result
}