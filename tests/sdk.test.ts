import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { paypalSdk } from '../src/lib/sdk';
import { RedisCacheProvider } from '@nuecms/sdk-builder';
import Redis from 'ioredis';

describe('PayPal SDK Tests', () => {
  const mockConfig = {
    clientId: process.env.VITE_PAYPAL_CLIENT_ID || 'mockClientId',
    clientSecret: process.env.VITE_PAYPAL_CLIENT_SECRET || 'mockClientSecret',
    cacheProvider: new RedisCacheProvider(new Redis()),
  };

  let sdk: ReturnType<typeof paypalSdk>;

  beforeEach(() => {
    sdk = paypalSdk(mockConfig);
    // Mock API Response for getAccessToken
    const mockAccessTokenResponse = {
      access_token: 'mockAccessToken123',
      expires_in: 7200,
    };

    // Mock HTTP request
    vi.spyOn(sdk, 'getAccessToken').mockResolvedValue(mockAccessTokenResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize SDK correctly', () => {
    expect(sdk).toBeDefined();
    expect(typeof sdk.r).toBe('function');
  });

  it('should get an access token', async () => {
    const response = await sdk.getAccessToken({
      client_id: mockConfig.clientId,
      client_secret: mockConfig.clientSecret,
      grant_type: 'client_credentials',
    });
    expect(response.access_token).toBe('mockAccessToken123');
    expect(response.expires_in).toBe(7200);
  });

  it('should cache the access token', async () => {
    vi.spyOn(mockConfig.cacheProvider, 'get').mockResolvedValue({
      value: {
        access_token: 'mockAccessToken123',
      }
    });
    const cachedToken = await mockConfig.cacheProvider.get(`paypal_access_token_${mockConfig.clientId}`);
    expect(cachedToken.value).toBeDefined();
    expect(cachedToken.value.access_token).toBe('mockAccessToken123');
  });

  it('should create an order', async () => {
    const mockOrderResponse = {
      id: 'mockOrderId',
      status: 'CREATED',
    };

    vi.spyOn(sdk, 'createOrder').mockResolvedValue(mockOrderResponse);

    const response = await sdk.createOrder({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: '100.00'
        }
      }]
    });

    expect(response.id).toBe('mockOrderId');
    expect(response.status).toBe('CREATED');
  });

  it('should get an order', async () => {
    const mockOrderResponse = {
      id: 'mockOrderId',
      status: 'COMPLETED',
    };

    vi.spyOn(sdk, 'getOrder').mockResolvedValue(mockOrderResponse);

    const response = await sdk.getOrder({ order_id: 'mockOrderId' });

    expect(response.id).toBe('mockOrderId');
    expect(response.status).toBe('COMPLETED');
  });

  it('should capture an order', async () => {
    const mockCaptureResponse = {
      id: 'mockCaptureId',
      status: 'COMPLETED',
    };

    vi.spyOn(sdk, 'captureOrder').mockResolvedValue(mockCaptureResponse);

    const response = await sdk.captureOrder({ order_id: 'mockOrderId' });

    expect(response.id).toBe('mockCaptureId');
    expect(response.status).toBe('COMPLETED');
  });

  it('should refund a capture', async () => {
    const mockRefundResponse = {
      id: 'mockRefundId',
      status: 'COMPLETED',
    };

    vi.spyOn(sdk, 'refundOrder').mockResolvedValue(mockRefundResponse);

    const response = await sdk.refundOrder({ capture_id: 'mockCaptureId' });

    expect(response.id).toBe('mockRefundId');
    expect(response.status).toBe('COMPLETED');
  });
});
