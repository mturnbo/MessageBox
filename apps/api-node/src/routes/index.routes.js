import express from 'express';
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

/* GET Index Page */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'User Messaging API' });
});

export default router;
