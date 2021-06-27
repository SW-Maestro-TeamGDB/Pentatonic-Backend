import { createClient, OverloadedCommand } from "redis"

declare module "util" {
    function promisify<T, U, R>(fn: OverloadedCommand<T, U, R>): {
        (arg1: T, arg2: T | T[]): Promise<U>
        (arg1: T | T[]): Promise<U>
        (...args: Array<T>): Promise<U>
    }
}

import { promisify } from "util"
import env from "config/env"

const redisClient = createClient(env.REDIS_HOST)
export const get = promisify(redisClient.get).bind(redisClient)
export const setex = promisify(redisClient.setex).bind(redisClient)
export const del = promisify(redisClient.del).bind(redisClient)

export interface Redis {
    get(arg1: string): Promise<string | null>
    setex(args1: string, args2: number, args3: string | number): Promise<string | number>
    del(args1: string): Promise<number>
}