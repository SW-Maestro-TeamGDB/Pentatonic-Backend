import dotenv from "dotenv"
dotenv.config()
import env from "config/env"

import { express as voyagerMiddleware } from "graphql-voyager/middleware"
import { ApolloServer, ApolloError, GraphQLUpload, ExpressContext } from "apollo-server-express"
import { readFileSync } from "fs"
import { createServer } from "http"
import depthLimit from "graphql-depth-limit"
import DB from "config/connectDB"
import * as redis from "config/connectRedis"

import { makeExecutableSchema } from "@graphql-tools/schema"
import { loadFilesSync } from "@graphql-tools/load-files"
import * as graphqlScalars from 'graphql-scalars'
import { applyMiddleware } from "graphql-middleware"
import { permissions, getUser, instrumentsLoader } from "lib"
import express from "express"
import expressPlayground from "graphql-playground-middleware-express"
import bodyParser from "body-parser"

import resolvers from "resolvers"
const typeDefs = loadFilesSync("src/**/*.graphql")

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use("/voyager", voyagerMiddleware({ endpointUrl: "/api" }))
app.use("/graphql", expressPlayground({ endpoint: "/api" }))
app.use("/api-docs", express.static("docs"))

const schema = makeExecutableSchema({
    typeDefs: `
        ${graphqlScalars.typeDefs.join('\n')}
        ${typeDefs}
    `,
    resolvers: {
        ...resolvers,
        Upload: GraphQLUpload as import("graphql").GraphQLScalarType,
        ...graphqlScalars.resolvers
    }
})
const start = async () => {
    const db = await DB.get()
    const server = new ApolloServer({
        schema: applyMiddleware(schema, permissions),
        context: ({ req }) => {
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null
            const token = req.headers.authorization || ''
            const user = getUser(token)
            return {
                db,
                redis,
                user,
                ip,
                loaders: {
                    instrumentsLoader: instrumentsLoader()
                }
            }
        },
        validationRules: [
            depthLimit(8),
        ],
        debug: true
    })

    server.applyMiddleware({
        app,
        path: "/api"
    })

    const httpServer = createServer(app)
    httpServer.timeout = 5000
    httpServer.listen({ port: env.PORT }, () => {
        console.log(`GraphQL API Running at http://localhost:${env.PORT || 4000}/api`)
        console.log(`GraphQL Docs Running at http://localhost:${env.PORT || 4000}/api-docs`)
    })
}

start()