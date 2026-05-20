import { Hono } from 'hono'
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import {jwt} from "hono/jwt"
import clientRouter from './routes/client';
import imageRouter from './routes/image';
import {prettyJSON} from "hono/pretty-json"
import verifyRole from "./middlewares/verifyRole"
type Bindings = {
    JWT_SECRET: string
}

const app = new Hono<{Bindings:Bindings}>()
app.use(prettyJSON())
app.use("/api/client/*",(c,next)=>{
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
    alg: 'HS256',
  })
  return jwtMiddleware(c, next)
})
app.use("/api/client/*",verifyRole("Client"))
app.use("/api/admin/*",verifyRole("Admin"))
app.route("/api/admin/", adminRouter)
app.route("/auth/", authRouter)
app.route("/api/client/", clientRouter)
app.route("/",imageRouter)

export default app
