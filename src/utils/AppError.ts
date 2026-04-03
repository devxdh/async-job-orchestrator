export default class AppError extends Error {
    statusCode: number;
    status: string;
    code: string;

    constructor(message: string, statusCode: number, code: string = "INTERNAL_ERROR") {
        super(message)
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.code = code;

        Error.captureStackTrace(this, this.constructor);
    }
}