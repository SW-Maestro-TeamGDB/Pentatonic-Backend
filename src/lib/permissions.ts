import { rule, shield } from "graphql-shield"
import { ApolloError } from "apollo-server-express"

// const isValid = rule()((parent: void, args: void) => {
//     return true
// })

export const permissions = shield({

})