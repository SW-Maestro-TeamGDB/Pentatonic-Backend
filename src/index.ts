import dotenv from "dotenv"
dotenv.config()
import env from "config/env"

import { express as voyagerMiddleware } from "graphql-voyager/middleware"
import { ApolloServer, GraphQLUpload } from "apollo-server-express"
import { ApolloServerPluginUsageReporting } from "apollo-server-core"
import { createServer } from "http"
import depthLimit from "graphql-depth-limit"
import DB from "config/connectDB"
import * as redis from "config/connectRedis"
import { customScalar } from "config/scalars"

import { makeExecutableSchema } from "@graphql-tools/schema"
import { loadFilesSync } from "@graphql-tools/load-files"
import * as graphqlScalars from 'graphql-scalars'
import { applyMiddleware } from "graphql-middleware"
import {
    permissions,
    getUser,
    instrumentsLoader,
    songsLoader,
    userLoader1,
    sessionsLoader
} from "lib"
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
        ...customScalar,
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
                    songsLoader: songsLoader(),
                    instrumentsLoader: instrumentsLoader(),
                    userLoader1: userLoader1(),
                    sessionsLoader: sessionsLoader()
                }
            }
        },
        validationRules: [
            depthLimit(8),
        ],
        plugins: [
            ApolloServerPluginUsageReporting({
                sendVariableValues: { all: true }
            })
        ],
        debug: false
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