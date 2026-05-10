import { Hono } from "hono";
const authRouter = new Hono()

authRouter.post("/signup/client")
authRouter.post("/signup/delivery")
authRouter.post("/login")

export default authRouter 