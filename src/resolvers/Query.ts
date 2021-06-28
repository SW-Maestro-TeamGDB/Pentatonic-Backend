import { Query as auth } from "resolvers/app/auth"
import { Query as health } from "resolvers/app/health"
export default {
    ...health,
    ...auth
}