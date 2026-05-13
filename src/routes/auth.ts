import { Hono } from "hono";
import { clientSignupSchema,loginSchema} from "../validation/auth";
import { zValidator } from "@hono/zod-validator";
import jwt from "hono/jwt"
import bcrypt from "bcryptjs"
//user
type User = {
    id: number
    user_name: string
    phone_number: string
    email: string
    password_hash: string
    user_role: "Client" | "Admin"
}
//client
type Client = {
    id: number
    user_id: number
    address: string
    activity_type: string
    activity_name: string
}
type Bindings = {
    canzo: D1Database
    JWT_SECRET: string
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
if (!identifier || !password) {
    return c.json({ error: "Identifier and password are required" }, 400);
}
try{
const result: { results: User[] } = await c.env.canzo.prepare("SELECT * FROM users WHERE email = ? OR user_name = ?").bind(identifier,identifier).all()
if(result.results.length === 0){
    return c.json({error:"Invalid credentials"},401)
}
const passwordMatch = await bcrypt.compare(password, result.results[0].password_hash)
if(!passwordMatch){
    return c.json({error:"Invalid credentials"},401)
}
const expirationTime = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30); // 30 days
const token = await jwt.sign({userId:result.results[0].id,userRole:result.results[0].user_role,exp: expirationTime}, c.env.JWT_SECRET, );
return c.json({message:"Login successful", token});
}catch(error){
    console.log(error)
    return c.json({error:"Internal server error"},500)
}
    })
export default authRouter 