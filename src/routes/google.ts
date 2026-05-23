import { Hono } from "hono";
import { sign } from "hono/jwt";
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
googleRouter.post("/google", async (c) => {
    try {
        const {idToken} = await c.req.json()
        const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        const googleUser = await res.json<{
            sub: string;
            email: string;
            name: string;
            aud: string;
        }>();
        if (!res.ok) return c.json({ error: "Invalid token" }, 401);

  if (googleUser.aud !== c.env.GOOGLE_CLIENT_ID) {
    return c.json({ error: "Token not intended for this app" }, 401);
  }
   let user = await c.env.canzo
    .prepare("SELECT * FROM users WHERE google_id = ?")
    .bind(googleUser.sub)
    .first();

    if(!user){
    await c.env.canzo
    .prepare("INSERT INTO users (google_id,name, email) VALUES (?, ?, ?)")
    .bind(googleUser.sub,googleUser.name,googleUser.email)
    .run();
    
    user = await c.env.canzo
    .prepare("SELECT * FROM users WHERE google_id = ?")
    .bind(googleUser.sub)
    .first();
    }
const token = await sign({
    id: user?.id,
    user_name: user?.user_name,
    phone_number: user?.phone_number,
    user_role: user?.user_role,
    
},c.env.JWT_SECRET!);
return c.json({token})
    } catch (error) {
        console.log(error)
        return c.json({ message: "Error" })
    }
});
export default googleRouter;