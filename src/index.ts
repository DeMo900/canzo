import { Hono } from 'hono'
import authRouter from './routes/auth';
const app = new Hono()
app.route("/", authRouter)

export default app
