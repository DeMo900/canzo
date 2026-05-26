import { Hono } from "hono";
import { sign } from "hono/jwt";
import { zValidator } from "@hono/zod-validator";
import { setupProfileSchema,googleLoginSchema } from "../validation/google";
type Bindings = {
    GOOGLE_CLIENT_ID: string;
    canzo: D1Database
    JWT_SECRET: string
}
type User = {
    id: number
    user_name: string
    phone_number: string
    email: string
    password_hash: string
    user_role: "Client" | "Admin"
}
const googleRouter = new Hono<{Bindings:Bindings,Variables:User}>();
googleRouter.post("/setup-profile",
    zValidator("json",setupProfileSchema,(result,c)=>{
        if(!result.success){
            return c.json({error:result.error.issues[0].message},400)
        }
    }),async(c)=>{
    try {
        type TokenPayload = {
    userId: number
    user_role: string
}
        const {userId} = c.get("jwtPayload") as TokenPayload
        const {address,activityType,activityName} = c.req.valid("json")
        await c.env.canzo
        .prepare("INSERT INTO clients (user_id,address,activity_type,activity_name) VALUES (?, ?, ?,?)")
        .bind(userId,address,activityType,activityName)
        .run();
        return c.json({message:"Profile setup successful"})
    } catch (error) {
        console.error(`error while setting up profile ${error}`)
        return c.json({error:"Internal server error"},500)
    }
});
export default googleRouter;