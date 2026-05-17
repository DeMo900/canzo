import {Hono} from 'hono';

//types
type User = {
    id: number
    user_name: string
    phone_number: string
    email: string
    password_hash: string
    user_role: "Client" | "Admin"
}
type Client = {
    id: number
    user_id: number
    address: string
    activity_type: string
    activity_name: string
}
type Basket = {
    id: number
    client_id: number
    content_type: string
    content_weight: number
    order_id: number
    is_full: boolean
}
type OrderWithDetails = {
  id: number
  user_name: string
  address: string
  phone_number: string
  created_at: string
  status: string
  baskets_count: number
  total_weight: number
  plastic_count: number
  canz_count: number
}
type Transaction = {
    id: number
    client_id: number
    amount: number
    status: string
    created_at: string
}
type Wallet = {
    id: number
    user_id: number
    balance: number
    created_at: string
}
type Bindings = {
    canzo: D1Database
    JWT_SECRET: string
    RESEND_API_KEY: string
    canzo_KV:KVNamespace
}
type Variables = {
    jwtPayload: TokenPayload
}
type TokenPayload = {
    userId: number
    user_role: string
}
const adminRouter = new Hono<{Bindings:Bindings,Variables:Variables}>()
.get("/orders",async(c)=>{
    try{
      const orders = await c.env.canzo.prepare("SELECT o.id, u.user_name,c.address,u.phone_number,o.created_at,o.status ,COUNT(b.id) AS baskets_count, SUM(b.content_weight) AS total_weight ,COUNT(CASE WHEN b.content_type = 'Plastic' THEN 1 END) AS plastic_count ,COUNT(CASE WHEN b.content_type = 'Canz' THEN 1 END) AS canz_count FROM orders o JOIN users u ON o.client_id = u.id JOIN baskets b ON o.id = b.order_id JOIN clients c ON o.client_id = c.user_id GROUP BY u.user_name,o.created_at,o.status,c.address,u.phone_number,o.id").all<OrderWithDetails[]>()
   return c.json({orders:orders.results},200)
    }catch(error){
        console.log(`error while getting orders ${error}`)
        return c.json({error:"Internal server error"},500)
    }
}).patch("/order/:id",async(c)=>{
    try{
      const {id} = await c.req.param()
      const {status,image} = await c.req.json()
      if(status === "Pending" || status === "Completed" || status === "Cancelled"){
        if (status === "Cancelled"){
     const [updateOrderResult,setEmptyResult] = await c.env.canzo.batch([
        c.env.canzo.prepare("UPDATE orders SET status = ?1 , updated_at = datetime('now') WHERE id = ?2").bind(status,id),
        c.env.canzo.prepare("UPDATE baskets SET is_full = 0 , order_id = NULL, updated_at = datetime('now') WHERE order_id = ?1").bind(id)
     ])
    if(updateOrderResult.meta.changes === 0 || setEmptyResult.meta.changes === 0){
        return c.json({error:"Order not found"},404)
    }
    return c.json({message:"Order cancelled successfully"},200)
    }
    if(status === "Completed"){
        
    }
      }else{
        return c.json({error:"Invalid status"},400)
      }
    }catch(error){
        console.log(`error while updating order status ${error}`)
        return c.json({error:"Internal server error"},500)
    }
})  
export default adminRouter