import { sdkBuilder, SdkBuilderConfig,  ContextConfig, FetchContext, RedisCacheProvider, CacheProvider } from '@nuecms/sdk-builder';
import { createVerify, randomUUID } from 'crypto';
import { Buffer } from 'buffer';
import { debuglog } from 'util';
const debug = debuglog('paypal-sdk');

export type PayPalSdkSignType = 'RSA2' | 'RSA';

interface PayPalSDKConfig {
  clientId: string;
  clientSecret: string;
  endpoint?: string;
  timeout?: number;
  maxRetries?: number;
  cacheProvider?: CacheProvider;
  customResponseTransformer?: (response: any) => any;
  authCheckStatus?: (status: number, response: any) => boolean;
}

export {
  RedisCacheProvider,
  type CacheProvider,
  type PayPalSDKConfig,
}

export type PayPalSDK = ReturnType<typeof sdkBuilder>


export type ContextConfig = {
  [key: string]: any;
  clientId: string;
  clientSecret: string;
  timeout: number;
  endpoint: string;
  access_token?: string;
}

const sdkName = '@nuecms/paypal-sdk';
const defaultEndpoint = 'https://api.paypal.com';

const createRequestId = () => {
  return randomUUID().replace(/-/g, '');
}

const customResponseTransformer = (responseData: any, context: FetchContext, response: Response) => {
  debug('customResponseTransformer', responseData, context, '\n Response headers: \n', Object.fromEntries(response.headers.entries()));
  return responseData;
}

export function paypalSdk(config: PayPalSDKConfig): PayPalSDK {
  const sdkConfig: SdkBuilderConfig = {
    baseUrl: config.endpoint || defaultEndpoint,
    cacheProvider: config.cacheProvider,
    maxRetries: config.maxRetries ?? 0,
    config: {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      timeout: config.timeout || 10000,
      endpoint: config.endpoint || defaultEndpoint,
    } as ContextConfig,
    customResponseTransformer: config.customResponseTransformer || customResponseTransformer,
    authCheckStatus: config.authCheckStatus || ((status, response, context) => {
      return status === 401;
    }),
    validateStatus: (status: number) => {
      return status >= 200 && status < 500;
    }
  };
  const sdk: PayPalSDK = sdkBuilder(sdkConfig);

  sdk.rx('authenticate', async (config) => {
    const cacheKey = `paypal_access_token_${config.clientId}`;
    const cached = await sdk.cacheProvider?.get(cacheKey);
    if (cached?.value) {
      sdk.enhanceConfig({ access_token: cached?.value?.access_token });
      return cached.value;
    }
    const response: any = await sdk.post('/v1/oauth2/token', {
      body: {
        grant_type: 'client_credentials',
      },
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    const expiresIn = response.expires_in || 3600;
    await sdk.cacheProvider?.set(cacheKey, response, 'json', expiresIn);
    sdk.enhanceConfig({ access_token: response.access_token });
    return {
      access_token: response.access_token,
    };
  });

  sdk.rx('reqInterceptor', async (config: ContextConfig, options: any = {}) => {
    const requestId = createRequestId();
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${config.access_token}`,
      'PayPal-Request-Id': requestId,
      'Content-Type': 'application/json'
    };
    return options;
  });

  // Tracking
  sdk.r('addTracking', '/v1/shipping/trackers', 'POST');
  sdk.r('getTracking', '/v1/shipping/trackers/{tracking_id}', 'GET');

  // Catalog Products
  sdk.r('createProduct', '/v1/catalogs/products', 'POST');
  sdk.r('getProduct', '/v1/catalogs/products/{product_id}', 'GET');

  // Disputes
  sdk.r('getDisputes', '/v1/customer/disputes', 'GET');
  sdk.r('getDispute', '/v1/customer/disputes/{dispute_id}', 'GET');

  // Identity
  sdk.r('getUserInfo', '/v1/identity/oauth2/userinfo', 'GET');

  // Invoicing
  sdk.r('createInvoice', '/v2/invoicing/invoices', 'POST');
  sdk.r('getInvoice', '/v2/invoicing/invoices/{invoice_id}', 'GET');

  // Orders

  sdk.r('createOrder', '/v2/checkout/orders', 'POST');
  sdk.r('getOrder', '/v2/checkout/orders/{order_id}', 'GET');
  sdk.r('captureOrder', '/v2/checkout/orders/{order_id}/capture', 'POST');

  // Partner Referrals
  sdk.r('createPartnerReferral', '/v2/customer/partner-referrals', 'POST');

  // Payment Experience
  sdk.r('createWebExperienceProfile', '/v1/payment-experience/web-profiles', 'POST');

  // Payments
  sdk.r('authorizePayment', '/v2/payments/authorizations/{authorization_id}/capture', 'POST');
  sdk.r('refundPayment', '/v2/payments/captures/{capture_id}/refund', 'POST');

  // Payouts
  sdk.r('createPayout', '/v1/payments/payouts', 'POST');
  sdk.r('getPayout', '/v1/payments/payouts/{payout_batch_id}', 'GET');

  // Referenced Payouts
  sdk.r('createReferencedPayout', '/v1/payments/referenced-payouts', 'POST');

  // Subscriptions
  sdk.r('createSubscription', '/v1/billing/subscriptions', 'POST');
  sdk.r('getSubscription', '/v1/billing/subscriptions/{subscription_id}', 'GET');

  // Transaction Search
  sdk.r('searchTransactions', '/v1/reporting/transactions', 'GET');

  // Webhooks
  sdk.r('createWebhook', '/v1/notifications/webhooks', 'POST');
  sdk.r('getWebhook', '/v1/notifications/webhooks/{webhook_id}', 'GET');

  return sdk;
}