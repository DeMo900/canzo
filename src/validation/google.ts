import z from "zod"
const googleLoginSchema = z.object({
    idToken: z.string().min(1, "ID token is required")
})
const setupProfileSchema = z.object({
  address:z.string()
      .min(1,"address is required")
      .min(10, 'Address too short')
      .max(255, 'Address too long'),
      activityType: z.enum(["Wedding hall","Restaurant","Cafe","Club"],
          {message:"activity type must be one of the following: Wedding hall, Restaurant, Cafe, Club"}),
      activityName: z.string().max(50,"activity name is too long").min(1,"activity name is required")
})
export {googleLoginSchema,setupProfileSchema}
