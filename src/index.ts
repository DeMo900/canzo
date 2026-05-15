import { Hono } from 'hono'
import authRouter from './routes/auth';
import {jwt} from "hono/jwt"
import clientRouter from './routes/client';
import {prettyJSON} from "hono/pretty-json"
type Bindings = {
    JWT_SECRET: string
}

const app = new Hono<{Bindings:Bindings}>()
app.use(prettyJSON())
app.use("/api/client/",(c,next)=>{
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
    alg: 'HS256',
  })
  return jwtMiddleware(c, next)
})
app.route("/auth", authRouter)
app.route("/api/client", clientRouter)

export default app
