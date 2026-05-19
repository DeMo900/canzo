import { Hono } from "hono";
import { clientSignupSchema,loginSchema,resetPasswordSchema,enterEmailSchema,enterOtpSchema} from "../validation/auth";
import { zValidator } from "@hono/zod-validator";
import {jwt,sign} from "hono/jwt"
import {sendEmail,emailData} from "../servieces/sendingEmails"
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
    BRAVO_API_KEY: string
    canzo_KV:KVNamespace
}
const authRouter = new Hono<{Bindings:Bindings}>()

.post("/client/signup",
   zValidator("json",clientSignupSchema,(result,c)=>{
    if(!result.success){
        return c.json({error:result.error.issues[0].message},400)
      
    }
   }) 
    ,async(c)=>{
        try{
    const {username,password,email,phoneNumber,address,activityType,activityName} =  c.req.valid("json")
    const hashedPassword = await bcrypt.hash(password, 10)
const user = await c.env.canzo.prepare("SELECT user_name FROM users WHERE email = ?1 OR phone_number = ?2").bind(email,phoneNumber).first<User>()
    if(user){
        return c.json({error:"User already exists"},409)
    }
await c.env.canzo.batch([
    c.env.canzo
.prepare(" INSERT INTO users (user_name, phone_number, email, password_hash, user_role) VALUES (?1, ?2, ?3, ?4, 'Client')")
.bind(username,phoneNumber,email,hashedPassword),
 c.env.canzo.prepare("INSERT INTO clients (user_id, address, activity_type, activity_name) VALUES (last_insert_rowid(), ?1, ?2, ?3)").bind(address,activityType,activityName)
    ])
return c.json({message:"Client registered successfully"},201)
}catch(error){
    console.log(`error while registering client ${error}`)
    return c.json({error:"Internal server error"},500)
        }
    }).post("/login",zValidator("json",loginSchema,(result,c)=>{
        if(!result.success){
            return c.json({error:result.error.issues[0].message},400)
        }
    }),async(c)=>{
const {identifier,password} = c.req.valid("json")
try{
const result = await c.env.canzo.prepare("SELECT password_hash,user_role,id,user_name FROM users WHERE email = ?1 OR user_name = ?2").bind(identifier,identifier).first<User>()
if(!result){
    return c.json({error:"Invalid credentials"},401)
}
const passwordMatch = await bcrypt.compare(password, result.password_hash)
if(!passwordMatch){
    return c.json({error:"Invalid credentials"},401)
}
const expirationTime = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30); // 30 days
const token = await sign({userId:result.id,user_role:result.user_role,exp: expirationTime}, c.env.JWT_SECRET, );
return c.json({message:"Login successful", token,user:{id:result.id,user_role:result.user_role,user_name:result.user_name}});
}catch(error){
    console.log(error)
    return c.json({error:"Internal server error"},500)
}
    }).post("/forgot-password",zValidator("json",enterEmailSchema,(result,c)=>{
        if(!result.success){
            return c.json({error:result.error.issues[0].message},400)
        }
    }),async(c)=>{
try{
const {email} = c.req.valid("json")
const user = await c.env.canzo.prepare("SELECT user_name FROM users WHERE email=?")
.bind(email).first<User>()
if(!user){
    return c.json({error:"User not found"},404)
}
const otp:string = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
const emailData: emailData = {
    to: email,
    subject: "OTP for password reset",
    html: `
    <h1>OTP for password reset</h1>
    <p>Your OTP for password reset is: ${otp}</p>
    `
}
await c.env.canzo_KV.delete(`otp:${email}`)
await c.env.canzo_KV.put(`otp:${email}`,otp,{expirationTtl:300})
await sendEmail(c.env.BRAVO_API_KEY,emailData)
return c.json({message:"OTP sent successfully"})
}catch(error){
    console.log(`error while sending otp ${error}`)
    return c.json({error:"Internal server error "+error},500)
}
    }).post("/verify-otp",zValidator("json",enterOtpSchema,(result,c)=>{
        if(!result.success){
            return c.json({error:result.error.issues[0].message},400)
        }
    }),async(c)=>{
try{
const {email,otp} = c.req.valid("json")
const storedOtp = await c.env.canzo_KV.get(`otp:${email}`)
if(storedOtp !== otp ){
    return c.json({error:"Invalid OTP"},400)
}
await c.env.canzo_KV.delete(`otp:${email}`)
const resetToken = crypto.randomUUID()
await c.env.canzo_KV.put(`reset-token:${email}`,resetToken,{expirationTtl:2000})
return c.json({message:"OTP verified successfully",resetToken},200)
}catch(error){
    console.log(`error while verifying OTP ${error}`)
    return c.json({error:"Internal server error"},500)
}
    }).patch("/reset-password",zValidator("json",resetPasswordSchema,(result,c)=>{
        if(!result.success){
            return c.json({error:result.error.issues[0].message},400)
        }
    }),async(c)=>{
try{
    const {email,password,resetToken} = c.req.valid("json")
    const storedToken = await c.env.canzo_KV.get(`reset-token:${email}`)
    if(!storedToken || storedToken !== resetToken){
        return c.json({error:"Invalid reset token"},400)
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    await c.env.canzo.prepare("UPDATE users SET password_hash = ?1, updated_at = datetime('now') WHERE email = ?2").bind(hashedPassword,email).run()
    await c.env.canzo_KV.delete(`reset-token:${email}`)
    return c.json({message:"Password reset successful"},200)
}catch(error){
    console.log(`error while resetting password ${error}`)
    return c.json({error:"Internal server error"},500)
}
    })
export default authRouter 