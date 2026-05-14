import { CustomError } from './customError.js';
import { DatabaseError } from './databaseError.js';
import { IsApiError } from '#utils/ApiErrors.js';

export const handleDatabaseError = (error, operation) => {
    console.error(`Database error during ${operation}:`, error);

    const errorMap = {
        'ECONNREFUSED': {
            message: 'Unable to connect to database. Please check if MySQL server is running.',
            userMessage: 'Database connection error. Please try again later.'
        },
        'ER_ACCESS_DENIED_ERROR': {
            message: 'Database access denied. Check credentials.',
            userMessage: 'Database configuration error. Please contact support.'
        },
        'ER_BAD_DB_ERROR': {
            message: 'Database does not exist.',
            userMessage: 'Database configuration error. Please contact support.'
        },
        'ETIMEDOUT': {
            message: 'Database connection timeout.',
            userMessage: 'Database is taking too long to respond. Please try again.'
        },
        'PROTOCOL_CONNECTION_LOST': {
            message: 'Database connection was lost.',
            userMessage: 'Lost connection to database. Please try again.'
        },
        'ER_DUP_ENTRY': {
            message: 'Duplicate entry detected.',
            userMessage: 'This record already exists.'
        }
    };

    const errorInfo = errorMap[error.code] || {
        message: error.message,
        userMessage: 'An unexpected database error occurred.'
    };

    throw new DatabaseError(errorInfo.userMessage, error);
};

export const handleError = (error, req, res, next) => {
    if (error instanceof CustomError || IsApiError(error)) {
        return res.status(error.statusCode).json({ message: error.message });
    }
    return res
        .status(500)
        .json({
          status: "Something went wrong, please try again!",
          error: error.message,
        });
};
