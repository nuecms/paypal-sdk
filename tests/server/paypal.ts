import http, { IncomingMessage as HttpIncomingMessage, ServerResponse } from 'http';

interface IncomingMessage extends HttpIncomingMessage {
  body?: any;
}
import { URL } from 'url';
import querystring from 'querystring';

import { paypalSdk } from '../../src/lib/sdk';

const sdk = paypalSdk({
  endpoint: 'https://api.sandbox.paypal.com',
  clientId: process.env.VITE_PAYPAL_CLIENT_ID || '',
  clientSecret: process.env.VITE_PAYPAL_CLIENT_SECRET || '',
});

const routes = {
  'POST /notify/paypal': async (req, res) => {
    // log notification parameters
    const params = req.body;
    console.log(params);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('success');
  },
  'GET /return/paypal': async (req, res) => {
    // log notification parameters
    const url = new URL(req.url, 'http://localhost:3000');
    const params = Object.fromEntries(url.searchParams);
    console.log(params);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(JSON.stringify(params));
  },
  'GET /create-order': async (req, res) => {
    try {
      const response = await sdk.createOrder({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: '100.00'
          }
        }]
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } catch (error) {
      console.log(error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(error.message);
    }
  },
  'GET /get-order': async (req, res) => {
    try {
      const response = await sdk.getOrder({ order_id: 'mockOrderId' });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } catch (error) {
      console.log(error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(error.message);
    }
  },
  'GET /capture-order': async (req, res) => {
    try {
      const response = await sdk.captureOrder({ order_id: 'mockOrderId' });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } catch (error) {
      console.log(error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(error.message);
    }
  },
  'GET /refund-order': async (req, res) => {
    try {
      const response = await sdk.refundOrder({ capture_id: 'mockCaptureId' });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } catch (error) {
      console.log(error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(error.message);
    }
  }
};

// Handle incoming requests
function handleRequest(req: IncomingMessage, res: ServerResponse): void {
  if (req.method === 'POST') {
    let body = '';

    // Listen for data
    req.on('data', (chunk) => {
      body += chunk.toString(); // Convert Buffer to string
    });

    // Listen for end of data
    req.on('end', async () => {
      try {
        // Parse data based on Content-Type
        const contentType = req.headers['content-type'];

        let parsedData;
        if (contentType === 'application/json') {
          parsedData = JSON.parse(body);
        } else if (contentType === 'application/x-www-form-urlencoded') {
          parsedData = querystring.parse(body);
        } else {
          parsedData = body; // Return raw string for other types
        }

        // Attach parsed data to req.body
        req.body = parsedData;

        // Route the request
        for (const [key, value] of Object.entries(routes)) {
          const [method, path] = key.split(' ');
          if (req.method === method && req.url?.startsWith(path)) {
            return value(req, res);
          }
        }

        // Handle not found
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      } catch (error) {
        // Handle parsing error
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid data format' }));
      }
    });
  } else {
    // Route the request
    for (const [key, value] of Object.entries(routes)) {
      const [method, path] = key.split(' ');
      if (req.method === method && req.url?.startsWith(path)) {
        value(req, res);
        return;
      }
    }

    // Handle not found
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
}

// Create and start the server
const PORT: number = Number(process.env.PORT) || 3000;
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
