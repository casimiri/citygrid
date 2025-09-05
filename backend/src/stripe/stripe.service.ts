import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { OrgService } from '../org/org.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private orgService: OrgService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const endpointSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancellation(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailure(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  }

  private async handleSubscriptionChange(subscription: Stripe.Subscription) {
    const orgId = subscription.metadata.org_id;
    if (!orgId) return;

    let status: string;
    switch (subscription.status) {
      case 'active':
        status = 'active';
        break;
      case 'trialing':
        status = 'trialing';
        break;
      case 'past_due':
        status = 'past_due';
        break;
      default:
        status = 'inactive';
    }

    await this.orgService.updateSubscriptionStatus(orgId, status);
  }

  private async handleSubscriptionCancellation(subscription: Stripe.Subscription) {
    const orgId = subscription.metadata.org_id;
    if (!orgId) return;

    await this.orgService.updateSubscriptionStatus(orgId, 'cancelled');
  }

  private async handlePaymentSuccess(invoice: Stripe.Invoice) {
    console.log('Payment succeeded for invoice:', invoice.id);
  }

  private async handlePaymentFailure(invoice: Stripe.Invoice) {
    console.log('Payment failed for invoice:', invoice.id);
  }
}