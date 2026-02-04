import { Router, Request, Response, raw } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { paymentService } from '../modules/payments/payment.service';
import Stripe from 'stripe';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover'
});

// POST /api/v1/payments/create-checkout
// Create a Stripe checkout session for adding money
router.post('/create-checkout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { amount } = req.body;

    // Validate amount
    if (!amount || amount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least $10'
      });
    }

    // Create checkout session
    const session = await paymentService.createCheckoutSession(userId, amount);

    res.json({
      success: true,
      sessionId: session.sessionId,
      url: session.url
    });
  } catch (error: any) {
    console.error('Error creating checkout:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create checkout session'
    });
  }
});

// POST /api/v1/payments/webhook
// Stripe webhook - receives payment confirmation
// This endpoint is called by Stripe, not by our frontend
// Note: Webhook verification requires raw body, so we need special handling
router.post('/webhook', raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  // Get the signature from Stripe
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      // Process the payment
      await paymentService.handleSuccessfulPayment(session.id);
      console.log('Payment processed:', session.id);
    } catch (error: any) {
      console.error('Error processing payment:', error);
      return res.status(500).json({ error: 'Failed to process payment' });
    }
  }

  // Return success to Stripe
  res.json({ received: true });
});

// GET /api/v1/payments/session/:sessionId
// Get payment session details
router.get('/session/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const details = await paymentService.getSessionDetails(sessionId);

    res.json({
      success: true,
      session: details
    });
  } catch (error: any) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch session details'
    });
  }
});

export default router;
