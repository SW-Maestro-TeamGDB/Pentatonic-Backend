import { File } from "config/types"


export interface CheckIdInput {
    id: string
}

export interface CheckUsernameInput {
    username: string
}


interface PasswordInput {
    password: string
}


export interface FindIdInput {
    input: {
        phoneNumber: string
        authCode: number
    }
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
        },
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
        file: File
    }
}
export interface ChangeProfileInput {
    input: {
        user: {
            username: string
            profileURI: URL
            introduce: string
            type: number
        }
    }
}

export interface DeleteAccountInput {
    input: {
        user: {
            password: string
        }
    }
}

export interface IdInput {
    id: string
}


export interface SendAuthCodeInput {
    input: {
        isRegistration: Boolean
        phoneNumber: string
    }
}