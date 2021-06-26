import dotenv from "dotenv"
dotenv.config()

import { express as voyagerMiddleware } from "graphql-voyager/middleware"
import { ApolloServer, ApolloError } from "apollo-server-express"
import { readFileSync } from "fs"
import { createServer } from "http"
import queryComplexity, { simpleEstimator } from "graphql-query-complexity"
import depthLimit from "graphql-depth-limit"
import DB from "config/connectDB"

import { makeExecutableSchema } from "@graphql-tools/schema"
import * as graphqlScalars from 'graphql-scalars'
import { applyMiddleware } from "graphql-middleware"
import { permissions } from "lib/permissions"
import express from "express"
import expressPlayground from "graphql-playground-middleware-express"
import { bodyParserGraphQL } from "body-parser-graphql"

import resolvers from "resolvers"
const typeDefsGraphQL = readFileSync("src/typeDefs.graphql", "utf-8")

const app = express()
app.use(bodyParserGraphQL())
app.use("/voyager", voyagerMiddleware({ endpointUrl: "/api" }))
app.use("/graphql", expressPlayground({ endpoint: "/api" }))
app.use("/api-docs", express.static("docs"))

const schema = makeExecutableSchema({
    typeDefs: `
        ${typeDefsGraphQL}
        ${graphqlScalars.typeDefs.join('\n')}
    `,
    resolvers: {
        ...resolvers,
        ...graphqlScalars.resolvers
    }
})

const server = new ApolloServer({
    schema: applyMiddleware(schema, permissions),
    context: async () => {
        const db = await DB.get()
        return { db }
    },
    validationRules: [
        depthLimit(8),
        queryComplexity({
            estimators: [
                simpleEstimator({ defaultComplexity: 1 })
            ],
            maximumComplexity: 1000,
            onComplete: (complexity: number) => {
                console.log(`Query Complexity: ${complexity}`)
            },
            createError: (max: number, actual: number) => {
                return new ApolloError(`Query is too complex: ${actual}. Maximum allowed complexity: ${max}`);
            },
        })
    ]
})

server.applyMiddleware({
    app,
    path: "/api"
})

const httpServer = createServer(app)
httpServer.timeout = 5000
export default httpServer