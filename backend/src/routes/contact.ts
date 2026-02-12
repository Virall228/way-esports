import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate';
import ContactMessage from '../models/ContactMessage';

const router = express.Router();

const contactValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('message').trim().isLength({ min: 1, max: 4000 }).withMessage('Message is required')
];

router.post('/', contactValidators, validateRequest, async (req: Request, res: Response) => {
  try {
    const { name, email, message } = req.body || {};
    const userId = (req as any).user?._id;

    const record = await ContactMessage.create({
      name,
      email,
      message,
      userId: userId || undefined
    });

    res.status(201).json({
      success: true,
      data: {
        id: record._id.toString()
      }
    });
  } catch (error: any) {
    console.error('Error saving contact message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

export default router;
