import { Query as auth } from "resolvers/app/auth"

export default {
    test: () => "Server On",
    ...auth
}