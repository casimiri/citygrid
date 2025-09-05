import { Controller, Post, Req, Res, Headers, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { StripeService } from './stripe.service';

@ApiTags('Stripe')
@Controller('webhooks/stripe')
export class StripeController {
  constructor(private stripeService: StripeService) {}

  @Post()
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    try {
      const result = await this.stripeService.handleWebhook(signature, req.rawBody);
      res.status(200).json(result);
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}