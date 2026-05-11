import { Hono } from "hono";
import { clientSignupSchema,loginSchema} from "../validation/auth";
import { zValidator } from "@hono/zod-validator";
import bcrypt from "bcryptjs"
type Bindings = {
    canzo: D1Database
}
const authRouter = new Hono<{Bindings:Bindings}>()

.post("/signup/client",
   zValidator("json",clientSignupSchema,(result,c)=>{
    if(!result.success){
        return c.json({error:result.error.issues[0].message},400)
    }
   }) 
    ,async(c)=>{
        try{
    const {username,password,email,phoneNumber,address,activityType,activityName} =  c.req.valid("json")
    const hashedPassword = await bcrypt.hash(password, 10)
const result = await c.env.canzo
.prepare(" INSERT INTO users (user_name, phone_number, email, password_hash, user_role) VALUES (?, ?, ?, ?, 'Client')")
.bind(username,phoneNumber,email,hashedPassword).run()
const id = result.meta.last_row_id
await c.env.canzo.prepare("INSERT INTO clients (user_id, address, activity_type, activity_name) VALUES (?, ?, ?, ?)").bind(id,address,activityType,activityName).run()
return c.json({message:"Client registered successfully"})
}catch(error){
            return c.json({error:"Internal server error"},500)
        }
    }).post("login",zValidator("json",loginSchema,(result,c)=>{
        if(!result.success){
            return c.json({error:result.error.issues[0].message},400)
        }
    }),async(c)=>{
const {identifier,password} = c.req.valid("json")
    })
export default authRouter 