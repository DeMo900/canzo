import { Hono } from "hono";
import { clientSignupSchema
 ,deliverySignupSchema} from "../validation/auth";
import { zValidator } from "@hono/zod-validator";
import bcrypt from "bcryptjs"
const authRouter = new Hono()
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
    return c.json({message:"User registered successfully",data:{username,email,phoneNumber,address,activityType,activityName,hashedPassword}},201)
        }catch(error){
            return c.json({error:"Internal server error"},500)
        }
    }).post("/signup/delivery",zValidator("json",deliverySignupSchema,(result,c)=>{
        if(!result.success){
            return c.json({error:result.error.issues[0].message},400)
        }
       }) 
        ,async(c)=>{
            try{
        const {username,password,email,phoneNumber} =  c.req.valid("json")
        const hashedPassword = await bcrypt.hash(password, 10)
        return c.json({message:"User registered successfully",data:{username,email,phoneNumber,hashedPassword}},201)
            }catch(error){
                return c.json({error:"Internal server error"},500)
            }
        })
export default authRouter 