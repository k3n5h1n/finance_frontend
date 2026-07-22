// src/validation/personSchema.js
import { z } from "zod";

const currentYear = new Date().getFullYear();

export const personSchema = z.object({
  name: z.string().min(1, "Name is required"),
  birth_year: z
    .union([z.string(), z.number()])
    .transform((val) => (val === "" ? null : Number(val)))
    .nullable()
    .refine(
      (val) => val === null || 
      (!isNaN(val) && val >= (currentYear - 120) && val <= currentYear), 
    { message: "Birth year must be a number between " + (currentYear-120) + " and " + currentYear,}
  ),
});
