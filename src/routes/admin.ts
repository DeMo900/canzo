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
    CANZO_R2: R2Bucket
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
      const {id} = c.req.param()
      const body = await c.req.parseBody()
      const image = body.image as File 
      const status = body.status as String
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
        if (!image || !(image instanceof File)) {
            return c.json({error:"Invalid image type"},400)
        }
        if(image.size > 2 * 1024 * 1024){
            return c.json({error:"Image size is greater than 2MB"},400)
        }
        const allowedTypes = ["image/jpeg","image/png","image/webp"]
        if(!allowedTypes.includes(image.type)){
            return c.json({error:"Invalid image type"},400)
        }
        const fileName = `${Date.now()}-${image.name}`
        await c.env.CANZO_R2.put(fileName,image,{
            "httpMetadata":{contentType:image.type}
        })
const order = await c.env.canzo.prepare("SELECT id FROM orders WHERE id = ?1").bind(id).first();
if (!order) return c.json({ error: "Order not found" }, 404);

const getBaskets = await c.env.canzo.prepare("SELECT id,content_type,content_weight FROM baskets WHERE order_id = ?1").bind(id).all<Basket>();

const mappedBaskets = getBaskets.results.map((basket: Basket) =>
  c.env.canzo.prepare("INSERT INTO sold (content_type,content_weight,total_price) VALUES(?1,?2,300)").bind(basket.content_type, basket.content_weight)
);

const [orderResult] = await c.env.canzo.batch([
  c.env.canzo.prepare("UPDATE orders SET status = ?1, updated_at = datetime('now') WHERE id = ?2").bind(status, id),
  c.env.canzo.prepare("INSERT INTO transactions (client_id,screenshot_path,amount) VALUES((SELECT client_id FROM orders WHERE id = ?1),?2,300)").bind(id, fileName),
  ...mappedBaskets,
  c.env.canzo.prepare("UPDATE baskets SET is_full = 0, order_id = NULL, updated_at = datetime('now') WHERE order_id = ?1").bind(id),
]);
        
if(orderResult.meta.changes === 0){
    return c.json({error:"Order not found"},404)
}
        return c.json({message:"Order updated successfully"},200)   
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