import { Router } from 'express';
import { addToWaitlist } from '../modules/waitlist/waitlist.service';

const router = Router();

// POST /api/v1/waitlist - Join the waitlist
router.post('/', async (req, res) => {
  try {
    const { email, name } = req.body;

    // Basic validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Add to waitlist
    const result = await addToWaitlist(email, name);

    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }

  } catch (error) {
    console.error('Waitlist error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
});

export default router;
