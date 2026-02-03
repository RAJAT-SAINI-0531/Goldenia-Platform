import Stripe from 'stripe';
import prisma from '../../config/database';

// Initialize Stripe with our secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia'
});

// Simple payment service
// Just handles creating checkout sessions and adding money to wallet

export const paymentService = {
  // Create a Stripe checkout session for adding money
  async createCheckoutSession(userId: string, amount: number) {
    // Amount must be at least $10
    if (amount < 10) {
      throw new Error('Minimum deposit is $10');
    }

    // Get user's fiat wallet
    const wallet = await prisma.wallet.findFirst({
      where: {
        userId: userId,
        type: 'fiat'
      }
    });

    if (!wallet) {
      throw new Error('Fiat wallet not found');
    }

    // Create Stripe checkout session
    // This generates a payment page URL
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Add Money to Wallet',
              description: `Deposit $${amount} to your Goldenia wallet`
            },
            unit_amount: Math.round(amount * 100) // Stripe uses cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/dashboard/deposit/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/deposit`,
      metadata: {
        userId: userId,
        walletId: wallet.id,
        amount: amount.toString()
      }
    });

    return {
      sessionId: session.id,
      url: session.url
    };
  },

  // Handle successful payment from Stripe webhook
  async handleSuccessfulPayment(sessionId: string) {
    // Get session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    const userId = session.metadata?.userId;
    const walletId = session.metadata?.walletId;
    const amount = parseFloat(session.metadata?.amount || '0');

    if (!userId || !walletId || !amount) {
      throw new Error('Invalid session metadata');
    }

    // Check if we already processed this payment
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        reference: sessionId
      }
    });

    if (existingTransaction) {
      // Already processed, don't add money twice
      return { message: 'Payment already processed' };
    }

    // Add money to wallet
    const wallet = await prisma.wallet.update({
      where: { id: walletId },
      data: {
        balance: {
          increment: amount
        }
      }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        fromWalletId: walletId, // same wallet for deposits
        toWalletId: walletId,
        amount: amount,
        currency: 'USD',
        type: 'deposit',
        status: 'completed',
        reference: sessionId,
        description: `Stripe deposit: $${amount}`
      }
    });

    return {
      message: 'Payment processed successfully',
      newBalance: wallet.balance
    };
  },

  // Get payment session details
  async getSessionDetails(sessionId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    return {
      id: session.id,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      status: session.payment_status,
      customerEmail: session.customer_email
    };
  }
};
