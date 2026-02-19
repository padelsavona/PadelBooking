import Stripe from 'stripe';
import prisma from '../db.js';
import { AppError } from '../errors.js';
import { getBookingById } from './booking.service.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

export const createCheckoutSession = async (bookingId: string, userId: string) => {
  const booking = await getBookingById(bookingId);

  // Verify ownership
  if (booking.userId !== userId) {
    throw new AppError(403, 'Not authorized', 'FORBIDDEN');
  }

  // Check if already has payment
  const existingPayment = await prisma.payment.findUnique({
    where: { bookingId },
  });

  if (existingPayment && existingPayment.status === 'completed') {
    throw new AppError(400, 'Booking already paid', 'ALREADY_PAID');
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Court Booking - ${booking.court.name}`,
            description: `${booking.startTime.toLocaleString()} - ${booking.endTime.toLocaleString()}`,
          },
          unit_amount: Math.round(Number(booking.totalPrice) * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL}/bookings/${bookingId}?payment=success`,
    cancel_url: `${process.env.FRONTEND_URL}/bookings/${bookingId}?payment=cancelled`,
    metadata: {
      bookingId,
      userId,
    },
  });

  // Create or update payment record
  await prisma.payment.upsert({
    where: { bookingId },
    update: {
      stripeSessionId: session.id,
      status: 'pending',
    },
    create: {
      bookingId,
      userId,
      amount: booking.totalPrice,
      stripeSessionId: session.id,
      status: 'pending',
    },
  });

  return { sessionUrl: session.url, sessionId: session.id };
};

export const handleWebhook = async (body: Buffer, signature: string) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('Webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const error = err as Error;
    throw new AppError(400, `Webhook Error: ${error.message}`, 'WEBHOOK_ERROR');
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;

      if (bookingId) {
        await prisma.$transaction([
          prisma.payment.update({
            where: { bookingId },
            data: {
              status: 'completed',
              stripePaymentId: session.payment_intent as string,
            },
          }),
          prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CONFIRMED' },
          }),
        ]);
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      // Handle failed payment
      console.error('Payment failed:', paymentIntent.id);
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return { received: true };
};
