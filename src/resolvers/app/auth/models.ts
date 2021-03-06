import { File } from "config/types"
import { ObjectID } from "mongodb"

export interface User {
    _id: ObjectID
    id: string
    phoneNumber: string
}

export interface IsValidIdInput {
    id: string
}

export interface IsValidUsernameInput {
    username: string
}

export interface FindIdInput {
    phoneNumber: string
    authCode: number
}

export interface ResetPasswordInput {
    input: {
        phoneNumber: string
        authCode: number
        user: {
            password: string
        }
    }
}

export interface RegisterInput {
    input: {
        user: {
            id: string
            password: string
            username: string
            type: number
        }
        phoneNumber: string
        authCode: number
    }
}

export interface LoginInput {
    input: {
        user: {
            id: string
            password: string
        }
    }
}

export interface ChangePasswordInput {
    input: {
        user: {
            password: string
            changePassword: string
        }
    }
}

export interface UploadImageInput {
    input: {
        file: Promise<File>
    }
}

export type ChangeProfileKeys = keyof ChangeProfileQuery["$set"]

export type UpdateProfileType = {
    [key in ChangeProfileKeys]: string | URL | number
}

export interface ChangeProfileInput {
    input: {
        user: {
            username?: string
            profileURI?: URL
            introduce?: string
            type?: number
            social?: {
                facebook?: URL
                twitter?: URL
                instagram?: URL
                kakao?: URL
            }
        }
    }
}
export interface ChangeProfileQuery {
    $set: {
        profileURI?: string
        username?: string
        introduce?: string
        type?: number
        social?: Social
    }
}

export interface Social {
    facebook?: string
    twitter?: string
    instagram?: string
    kakao?: string
}

export interface DeleteAccountInput {
    input: {
        user: {
            password: string
        }
    }
}

export interface SendAuthCodeInput {
    input: {
        isRegistration: boolean
        phoneNumber: string
    }
}

export interface GetUserInfoInput {
    userId?: string
}

export interface QueryUserInput {
    username: string
}
