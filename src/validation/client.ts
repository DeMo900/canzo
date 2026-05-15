import {z} from "zod"

const addBasketSchema = z.object({
    content_type: z.enum(["Plastic","Canz"]),
    content_weight: z.number().positive().max(15),
})
const arrayBasketsSchema = z.array(addBasketSchema)

export {arrayBasketsSchema}
