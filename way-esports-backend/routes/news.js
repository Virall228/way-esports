"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const News_1 = require("../models/News");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Create news article (Admin)
router.post('/news', auth_1.auth, auth_1.admin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const news = new News_1.News(Object.assign(Object.assign({}, req.body), { author: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id }));
        yield news.save();
        res.status(201).send(news);
    }
    catch (error) {
        res.status(400).send(error);
    }
}));
// Get all news articles
router.get('/news', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const news = yield News_1.News.find({}).populate('author', 'username');
        res.send(news);
    }
    catch (error) {
        res.status(500).send(error);
    }
}));
// Get news article by ID
router.get('/news/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const news = yield News_1.News.findById(req.params.id).populate('author', 'username');
        if (!news) {
            return res.status(404).send();
        }
        res.send(news);
    }
    catch (error) {
        res.status(500).send(error);
    }
}));
// Update news article (Admin)
router.patch('/news/:id', auth_1.auth, auth_1.admin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['title', 'content', 'game', 'tags', 'imageUrl'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }
    try {
        const news = yield News_1.News.findById(req.params.id);
        if (!news) {
            return res.status(404).send();
        }
        updates.forEach((update) => (news[update] = req.body[update]));
        yield news.save();
        res.send(news);
    }
    catch (error) {
        res.status(400).send(error);
    }
}));
// Delete news article (Admin)
router.delete('/news/:id', auth_1.auth, auth_1.admin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const news = yield News_1.News.findByIdAndDelete(req.params.id);
        if (!news) {
            return res.status(404).send();
        }
        res.send(news);
    }
    catch (error) {
        res.status(500).send(error);
    }
}));
exports.default = router;
