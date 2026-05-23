import {z} from "zod"

const addBasketSchema = z.object({
    content_type: z.enum(["Plastic","Canz"]),
    content_weight: z.number().positive().max(15),
})
const arrayBasketsSchema = z.array(addBasketSchema)

const updateProfileSchema = z.object({
    user_name: z.string().min(3,"user name must be at least 3 characters").max(50,"user name must be at most 50 characters").optional(),
    email: z.email("invalid email address").max(300).optional(),
    phone_number: z.string().regex(/^01[0125][0-9]{8}$/, 'Invalid phone number').optional(),
    address: z.string().min(10, 'Address too short').max(255, 'Address too long').optional(),
    activity_type: z.enum(["Wedding hall","Restaurant","Cafe","Club"], {message:"activity type must be one of the following: Wedding hall, Restaurant, Cafe, Club"}).optional(),
    activity_name: z.string().max(50,"activity name is too long").min(1,"activity name is required").optional(),
})
const passwordSchema = z.object({
    old_password: z.string().min(8,"password must be at least 8 characters"),
    new_password:  z.string().min(1,"password is required").min(8, 'Password must be at least 8 characters').max(72)
    .regex(/[A-Z]/, ' password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'password must contain at least one number'),
    confirm_password: z.string().min(1,"confirm password is required"),
}).refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
})

export {arrayBasketsSchema, updateProfileSchema,passwordSchema}
