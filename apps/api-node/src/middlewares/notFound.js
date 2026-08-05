export const notFound = (req, res) =>
    res.status(404).json({ error: { message: "Route doesn't exist!" } });
