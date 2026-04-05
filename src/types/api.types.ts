type ApiError = {
    code: string;
    message: string;
};

export type PaginationMeta = {
    nextCursor: string | null;
    hasMore: boolean;
};

export type ApiResponse<T> = {
    status: "success" | "fail" | "error";
    data: T | null;
    error: ApiError | null;
    message?: string;
    pagination?: PaginationMeta;
};
