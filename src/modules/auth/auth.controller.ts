import type { Request, Response } from "express";
import { validate } from "../../utils/validate.js";
import { createUser, loginUser, removeUser } from "./auth.service.js";
import { loginUserSchema, userSchema } from "../../zod/schema.js";

export const signup = async (req: Request, res: Response) => {
    const validatedInput = validate(userSchema, req.body);
    const data = await createUser(validatedInput);
    res.status(201).json({ status: 'success', data });
};

export const login = async (req: Request, res: Response) => {
    const validatedInput = validate(loginUserSchema, req.body);
    const token = await loginUser(validatedInput);
    res.status(200).json({ status: 'success', token })
};

export const remove = async (req: Request, res: Response) => {
    const id = req.user?.id as string;
    const data = await removeUser(id);
    res.status(204).json({ status: 'success', data });
}