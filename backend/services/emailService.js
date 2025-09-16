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
exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../config");
// Create reusable transporter
const transporter = nodemailer_1.default.createTransport({
    host: config_1.config.email.host,
    port: config_1.config.email.port,
    secure: config_1.config.email.secure,
    auth: {
        user: config_1.config.email.user,
        pass: config_1.config.email.password,
    },
});
const sendVerificationEmail = (email, code) => __awaiter(void 0, void 0, void 0, function* () {
    const mailOptions = {
        from: `"WAY Esports" <${config_1.config.email.user}>`,
        to: email,
        subject: 'Verify Your Device for Valorant Mobile',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF4655;">Verify Your Device</h2>
        <p>Thank you for registering your device for Valorant Mobile tournaments on WAY Esports.</p>
        <p>Your verification code is:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #FF4655; letter-spacing: 5px; font-size: 32px;">${code}</h1>
        </div>
        <p>This code will expire in 30 minutes.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated message from WAY Esports. Please do not reply to this email.
        </p>
      </div>
    `,
    };
    try {
        yield transporter.sendMail(mailOptions);
    }
    catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
});
exports.sendVerificationEmail = sendVerificationEmail;
