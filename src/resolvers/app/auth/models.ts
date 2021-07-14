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

interface Spec {
    session: String
    level: Number
}

export interface InputPassword {
    password: string
}
export interface InputUser extends InputId, InputPassword {
    username: string
    phone: SMSSend
    spec: Spec[]
    type: number
}

export interface InputResetPassword {
    token: string
    resetPassword: string
}

export interface InputLogin extends InputPassword {
    id: string
}

export interface InputChangePassword extends InputPassword {
    changePassword: string
}

export interface InputFile {
    file: File
}

export interface InputChangeProfile extends InputUsername {
    profileURI: URL
    introduce: string
    spec: Spec[]
    type: string
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

export interface InputFindPasswordSMSSend extends InputSMSSend, InputId { }
export interface InputFindPasswordSMSCheck extends InputSMSCheck, InputId { }