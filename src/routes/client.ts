import { Hono } from "hono";
import { JwtVariables } from "hono/jwt";
import {zValidator} from "@hono/zod-validator"
import {arrayBasketsSchema} from "../validation/client"

//baskets
type Basket = {
    id: number
    client_id: number
    content_type: string
    content_weight: number
    order_id: number
    is_full: boolean
}
//binding
type Bindings = {
    canzo: D1Database
    JWT_SECRET: string
    RESEND_API_KEY: string
    canzo_KV:KVNamespace
}
type Variables = {
    jwtPayload: TokenPayload
}
//orders
type Order = {
    id: number
    client_id: number
    status: string
    created_at: string
}
//transactions
type Transaction = {
    id: number
    client_id: number
    amount: number
    status: string
    created_at: string
}
//wallet
type Wallet = {
    user_id: number
    balance: number
    created_at: string
}
type TokenPayload = {
    userId: number
    user_role: string
}
const clientRouter = new Hono<{Bindings:Bindings,Variables:Variables}>()
clientRouter.post("/baskets",zValidator("json",arrayBasketsSchema,(result,c)=>{
    if(!result.success){
        return c.json({error:result.error.issues[0].message},400)
    }
}),async(c)=>{
    try{
 const {userId} = c.get("jwtPayload") as TokenPayload
 const baskets = c.req.valid("json")
   await c.env.canzo.batch([
    ...baskets.map(b =>
        c.env.canzo.prepare("INSERT INTO baskets (client_id, content_type, content_weight, is_full) VALUES (?1, ?2, ?3, false)")
            .bind(userId, b.content_type, b.content_weight)
    )
])
return c.json({ message: "Baskets added successfully" }, 201);
    }catch(error){
        console.log(`error while adding basket ${error}`)
        return c.json({error:"Internal server error"},500)
    }
}).patch("/baskets/:id/fill",async(c)=>{
    try{
const {userId} = c.get("jwtPayload") as TokenPayload
const basketId = c.req.param("id")
const isOrderExist = 
await c.env.canzo.prepare("SELECT id,client_id FROM orders WHERE client_id = ?1 AND status = 'Pending'").bind(userId).first<Order>()
if(isOrderExist){
const updateBasketWithOrderResult= await c.env.canzo.prepare("UPDATE baskets SET is_full = 1 , order_id = ?1, updated_at = datetime('now') WHERE id = ?2 AND client_id = ?3").bind(isOrderExist.id,basketId,userId).run()
 if(updateBasketWithOrderResult.meta.changes === 0 ){
   return c.json({error:"Failed to set basket to full or basket not found"},400)
 }
return c.json({message:"Basket filled successfully"},200)
}
const [insertrResult,updateBasketWithNoOrderResult]= await c.env.canzo.batch([
 c.env.canzo.prepare("INSERT INTO orders (client_id,status) VALUES (?1,'Pending')").bind(userId),
 c.env.canzo.prepare("UPDATE baskets SET is_full = 1 , order_id = 2, updated_at = datetime('now') WHERE id = ?1 AND client_id = ?2").bind(basketId,userId)
])
if(updateBasketWithNoOrderResult.meta.changes === 0){
return c.json({error:"Failed to set basket to full or basket not found"},400)
}
return c.json({message:"Basket filled successfully"},200)
    }catch(error){
        console.log(`error while setting basket full ${error}`)
        return c.json({error:"Internal server error"},500)
    }
}).get("/baskets",async(c)=>{
    try{
const {userId,user_role} = c.get("jwtPayload") as TokenPayload
if(user_role !== "Client"){
  return c.json({error:"Forbidden"}, 403)
}
const baskets = await c.env.canzo.prepare("SELECT id,content_type,content_weight,is_full FROM baskets WHERE client_id = ?1").bind(userId).all<Basket[]>()
return c.json({baskets:baskets.results})
    }catch(error){
        console.log(`error while getting baskets ${error}`)
        return c.json({error:"Internal server error"},500)
    }
}).get("/orders/:status",async(c)=>{
    try{
const {userId,user_role} = c.get("jwtPayload") as TokenPayload
const status = c.req.param("status")
const OrderStatus = ["Pending","Completed","Cancelled"]
if(!OrderStatus.includes(status)){
    return c.json({error:"Invalid status"},400)
}
if(user_role !== "Client"){
  return c.json({error:"Forbidden"}, 403)
}
const orders = await c.env.canzo.prepare("SELECT o.id,o.status,o.created_at ,c.address, COUNT(b.id) AS total_baskets ,SUM(b.content_weight) AS total_weight ,COUNT(CASE WHEN b.content_type = 'Plastic' THEN 1 END) AS plastic_count ,COUNT(CASE WHEN b.content_type = 'Canz' THEN 1 END) AS canz_count FROM orders o LEFT JOIN baskets b ON o.id = b.order_id JOIN clients c ON o.client_id = c.user_id WHERE o.client_id = ?1 AND status = ?2 GROUP BY o.id,o.status,o.created_at,c.address").bind(userId,status).all<Order>()
return c.json({orders:orders.results})
    }catch(error){
        console.log(`error while getting orders ${error}`)
        return c.json({error:"Internal server error"},500)
    }
}).get("/transactions",async(c)=>{
    try{    
const {userId} = c.get("jwtPayload") as TokenPayload
const transactions = await c.env.canzo.prepare("SELECT id,amount,created_at,screenshot_path FROM transactions WHERE client_id = ?1").bind(userId).all<Transaction>()
return c.json({transactions:transactions.results})
    }catch(error){
        console.log(`error while getting transactions ${error}`)
        return c.json({error:"Internal server error"},500)
    }
}).get("/wallet",async(c)=>{
    try{
const {userId} = c.get("jwtPayload") as TokenPayload
let wallet = await c.env.canzo.prepare("SELECT balance FROM wallets WHERE user_id = ?1").bind(userId).first<Wallet>()
if (!wallet){
    await c.env.canzo.prepare("INSERT INTO wallets (user_id, balance) VALUES (?1, 0)").bind(userId).run()
     wallet = await c.env.canzo.prepare("SELECT balance FROM wallets WHERE user_id = ?1").bind(userId).first<Wallet>()
}
return c.json({wallet})
    }catch(error){
        console.log(`error while getting wallet ${error}`)
        return c.json({error:"Internal server error",message:error},500)
    }
})

export default clientRouter
