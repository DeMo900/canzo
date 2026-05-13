import { Hono } from 'hono'
import authRouter from './routes/auth';
import {prettyJSON} from "hono/pretty-json"
const app = new Hono()
app.use(prettyJSON())
app.route("/", authRouter)

export default app
