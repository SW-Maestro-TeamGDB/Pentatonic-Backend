const config = {
    DB_HOST: process.env.DB_HOST || "mongodb://localhost:27017/database",
    PORT: process.env.PORT || 4000,
    REDIS_HOST: process.env.REDIS_HOST || "redis://127.0.0.1",
    SMS_KEY: process.env.SMS_KEY,
    NCP_ACCESS_KEY: process.env.NCP_ACCESS_KEY,
    NCP_SECRET_KEY: process.env.NCP_SECRET_KEY,
    PHONE_NUMBER: process.env.PHONE_NUMBER
}

export default config