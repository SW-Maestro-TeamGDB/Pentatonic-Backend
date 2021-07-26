import dotenv from "dotenv"
dotenv.config()

import { express as voyagerMiddleware } from "graphql-voyager/middleware"
import { ApolloServer, GraphQLUpload } from "apollo-server-express"
import { createServer } from "http"
import depthLimit from "graphql-depth-limit"
import DB from "config/connectDB"
import * as redis from "config/connectRedis"

import { customScalar } from "config/scalars"
import { makeExecutableSchema } from "@graphql-tools/schema"
import * as graphqlScalars from 'graphql-scalars'
import { applyMiddleware } from "graphql-middleware"
import { permissions, getUser, instrumentsLoader } from "lib"
import express from "express"
import expressPlayground from "graphql-playground-middleware-express"
import bodyParser from "body-parser"
import { loadFilesSync } from "@graphql-tools/load-files"
const typeDefs = loadFilesSync("src/**/*.graphql")

import resolvers from "resolvers"

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

const server = new ApolloServer({
    schema: applyMiddleware(schema, permissions),
    context: async ({ req }) => {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
        const db = await DB.get()
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
    debug: true,
    engine: false
})

server.applyMiddleware({
    app,
    path: "/api"
})

const httpServer = createServer(app)
httpServer.timeout = 5000

export default httpServer