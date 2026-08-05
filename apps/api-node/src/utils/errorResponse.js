export const sendError = (res, statusCode, message, details) => {
  const error = details ? { message, details } : { message };
  return res.status(statusCode).json({ error });
};
