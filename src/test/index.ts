import dotenv from "dotenv"
dotenv.config()
import env from "config/env"

import { express as voyagerMiddleware } from "graphql-voyager/middleware"
import { ApolloServer, ApolloError, GraphQLUpload } from "apollo-server-express"
import { readFileSync } from "fs"
import { createServer } from "http"
import depthLimit from "graphql-depth-limit"
import DB from "config/connectDB"
import * as redis from "config/connectRedis"

import { makeExecutableSchema } from "@graphql-tools/schema"
import * as graphqlScalars from 'graphql-scalars'
import { applyMiddleware } from "graphql-middleware"
import { permissions, getUser } from "lib"
import express from "express"
import expressPlayground from "graphql-playground-middleware-express"
import bodyParser from "body-parser"

import resolvers from "resolvers"
const typeDefsGraphQL = readFileSync("src/typeDefs.graphql", "utf-8")

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use("/voyager", voyagerMiddleware({ endpointUrl: "/api" }))
app.use("/graphql", expressPlayground({ endpoint: "/api" }))
app.use("/api-docs", express.static("docs"))

const schema = makeExecutableSchema({
    typeDefs: `
        ${graphqlScalars.typeDefs.join('\n')}
        ${typeDefsGraphQL}
    `,
    resolvers: {
        ...resolvers,
        Upload: GraphQLUpload as import("graphql").GraphQLScalarType,
        ...graphqlScalars.resolvers
    }
})

const server = new ApolloServer({
    schema: applyMiddleware(schema, permissions),
    context: async ({ req }) => {
        const db = await DB.get()
        const token = req.headers.authorization || ''
        const user = getUser(token)
        return { db, redis, user }
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

export default httpServer