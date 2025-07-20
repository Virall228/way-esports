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
exports.teamCaptainAuth = exports.adminAuth = exports.admin = exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const auth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (!token) {
            throw new Error();
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = yield User_1.User.findOne({ _id: decoded._id, 'tokens.token': token });
        if (!user) {
            throw new Error();
        }
        req.token = token;
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).send({ error: 'Please authenticate.' });
    }
});
exports.auth = auth;
const admin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'developer')) {
        next();
    }
    else {
        res.status(403).send({ error: 'Access denied.' });
    }
};
exports.admin = admin;
const adminAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, exports.auth)(req, res, () => { });
        if (!req.user.isAdmin) {
            throw new Error();
        }
        next();
    }
    catch (error) {
        res.status(403).json({ message: 'Access denied' });
    }
});
exports.adminAuth = adminAuth;
const teamCaptainAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, exports.auth)(req, res, () => { });
        const team = yield req.user.getTeam();
        if (!team || !team.captain.equals(req.user._id)) {
            throw new Error();
        }
        req.team = team;
        next();
    }
    catch (error) {
        res.status(403).json({ message: 'Must be team captain' });
    }
});
exports.teamCaptainAuth = teamCaptainAuth;
