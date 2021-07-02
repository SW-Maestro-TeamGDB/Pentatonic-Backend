const env = {
    DB_HOST: process.env.DB_HOST || "mongodb://localhost:27017/database",
    PORT: process.env.PORT || 4000,
    REDIS_HOST: process.env.REDIS_HOST || "redis://127.0.0.1",
    SMS_KEY: process.env.SMS_KEY,
    NCP_ACCESS_KEY: process.env.NCP_ACCESS_KEY,
    NCP_SECRET_KEY: process.env.NCP_SECRET_KEY,
    PHONE_NUMBER: process.env.PHONE_NUMBER,
    JWT_SECRET: process.env.JWT_SECRET || "applebanana",
    AWS_ID: process.env.AWS_ID,
    AWS_PW: process.env.AWS_PW,
    AWS_REGION: process.env.AWS_REGION,
    AWS_BUCKET: process.env.NODE_ENV === "test" ? process.env.AWS_BUCKET_TEST : process.env.AWS_BUCKET,
    S3_URI: process.env.NODE_ENV === "test" ?
        `https://${process.env.AWS_BUCKET_TEST}.s3.${process.env.AWS_REGION}.amazonaws.com`
        : `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`
}

export default env