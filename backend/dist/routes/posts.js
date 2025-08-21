"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const router = express_1.default.Router();
// Get all posts
router.get('/', async (req, res) => {
    try {
        const posts = await db_1.prisma.post.findMany({
            include: {
                author: true,
            },
        });
        res.json(posts);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});
// Get post by ID
router.get('/:id', async (req, res) => {
    try {
        const post = await db_1.prisma.post.findUnique({
            where: { id: req.params.id },
            include: {
                author: true,
            },
        });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json(post);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});
// Create new post
router.post('/', async (req, res) => {
    try {
        const { title, content, authorId, published } = req.body;
        const post = await db_1.prisma.post.create({
            data: {
                title,
                content,
                authorId,
                published: published || false,
            },
            include: {
                author: true,
            },
        });
        res.status(201).json(post);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create post' });
    }
});
exports.default = router;
//# sourceMappingURL=posts.js.map