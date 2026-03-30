import { DatabaseError } from "pg";

// Based on true or false, function determines if the err is a database error or not
export function isDatabaseError(err: unknown): err is DatabaseError {
    /*
     Unique Constraint Violation -> a database error
     Email column is unique -> email already exists
    */
    return err instanceof DatabaseError && 'code' in err; // returns true or false;
}