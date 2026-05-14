export class DatabaseError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

export const createDatabaseError = (message, statusCode) => {
    return new DatabaseError(message, statusCode);
};
