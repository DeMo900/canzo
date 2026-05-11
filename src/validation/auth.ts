import {z} from "zod";

const baseSchema = z.object({
    username: z.string().min(1,"username is required").min(3,"user name must be at least 3 characters").max(30,"user name must be at most 30 characters"),
    password: z.string().min(1,"password is required").min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, ' password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'password must contain at least one number'),
    confirmPassword: z.string().min(1,"confirm password is required"),
    email: z.email("invalid email address"),
    phoneNumber: z.string().min(1, 'phone number is required').regex(/^01[0125][0-9]{8}$/, 'Invalid phone number')
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
})

const clientSignupSchema = baseSchema.extend({
  address:z.string()
    .min(1,"address is required")
    .min(10, 'Address too short')
    .max(255, 'Address too long'),
    activityType: z.enum(["Wedding hall","Restaurant","Cafe","Club"],
        {message:"activity type must be one of the following: Wedding hall, Restaurant, Cafe, Club"}),
    activityName: z.string().max(50,"activity name is too long").min(1,"activity name is required"),
})
const loginSchema = z.object({
    identifier: z.string().min(1,"identifier is required")  ,
    password: z.string().min(1,"password is required")
})
export {clientSignupSchema ,loginSchema}