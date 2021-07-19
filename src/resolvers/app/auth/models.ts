import { File } from "config/types"

interface SMSSend {
    phoneNumber: string
}

interface SMSCheck {
    phoneNumber: string
    authenticationNumber: number
}

export interface IdPwSearchResult {
    message: string
    [key: string]: string
}


interface InputPassword {
    password: string
}

export interface InputDeleteAccount {
    user: InputPassword
}

export interface InputUser extends InputId, InputPassword {
    username: string
    phone: SMSSend
    type: number
}

export interface InputRegister {
    user: InputUser
}

export interface InputResetPassword {
    token: string
    reset: {
        password: string
    }
}

interface UserLogin extends InputPassword, InputId { }
export interface InputLogin {
    user: UserLogin
}

export interface InputChangePassword {
    change: {
        password: string
        changePassword: string
    }
}

export interface InputFile {
    file: File
}

interface ChangeProfile extends InputUsername {
    profileURI: URL
    introduce: string
    type: string
}

export interface InputChangeProfile {
    change: ChangeProfile
}

export interface InputId {
    id: string
}

export interface InputUsername {
    username: string
}

export interface InputSMSSend {
    phone: SMSSend
}

export interface InputSMSCheck {
    phone: SMSCheck
}

export interface InputFindPasswordSMSSend extends InputSMSSend, InputLogin { }
export interface InputFindPasswordSMSCheck extends InputSMSCheck, InputLogin { }