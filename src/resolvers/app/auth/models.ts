export interface WheelHouse {
    [position: string]: number;
}

export interface TokenInterface {
    username: string,
    id: string
}

export interface SMSSend {
    phoneNumber: string
}

export interface SMSCheck {
    phoneNumber: string
    authenticationNumber: number
}

export interface IdPwSearchResult {
    message: string
    [key: string]: string
}

export interface PlayingSpec {
    position: String
    level: Number
}