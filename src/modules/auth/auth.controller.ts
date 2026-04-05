import type { Request, Response } from "express";
import { validate } from "@src/utils/validate";
import { sendSuccess } from "@src/utils/helpers";
import { createUser, loginUser, removeUser } from "./auth.service";
import { loginUserSchema, userSchema } from "./auth.schema";

export const signup = async (req: Request, res: Response) => {
    const validatedInput = validate(userSchema, req.body);
    const data = await createUser(validatedInput);
    return sendSuccess(res, data, 201);
};

export const login = async (req: Request, res: Response) => {
    const validatedInput = validate(loginUserSchema, req.body);
    const token = await loginUser(validatedInput);
    return sendSuccess(res, { token }, 200);
};

export const remove = async (req: Request, res: Response) => {
    const id = req.user?.id as string;
    const data = await removeUser(id);
    return sendSuccess(res, data, 200);
}
