# PayPal SDK

>> WIP

A flexible and lightweight SDK for building PayPal integrations with dynamic endpoints, caching, and response transformations.

[![npm](https://img.shields.io/npm/v/@nuecms/paypal-sdk)](https://www.npmjs.com/package/@nuecms/paypal-sdk)
[![GitHub](https://img.shields.io/github/license/nuecms/paypal-sdk)](https://www.github.com/nuecms/paypal-sdk)
[![GitHub issues](https://img.shields.io/github/issues/nuecms/paypal-sdk)](https://www.github.com/nuecms/paypal-sdk/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/nuecms/paypal-sdk)](https://www.github.com/nuecms/paypal-sdk/pulls)

---

## Introduction

PayPal SDK for Node.js provides the ability to call PayPal REST API from a Node.js server.
It includes making API requests to PayPal servers, generating order information, and supporting authentication and caching capabilities.

Based on the [PayPal REST API](https://developer.paypal.com/docs/api/overview/).

## Requirements

- Node.js >= 18.0.0

---

## Features

- Pre-configured API endpoints for PayPal's platform
- Support for Redis and in-memory caching
- Easy extensibility

---

## Table of Contents

- [PayPal SDK](#paypal-sdk)
  - [Introduction](#introduction)
  - [Requirements](#requirements)
  - [Features](#features)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
    - [1. Import and Initialize the SDK](#1-import-and-initialize-the-sdk)
    - [2. Register API Endpoints](#2-register-api-endpoints)
    - [3. Make API Calls](#3-make-api-calls)
    - [More](#more)
  - [Usage Examples](#usage-examples)
    - [Registering Endpoints](#registering-endpoints)
    - [Making API Calls](#making-api-calls)
  - [Contributing](#contributing)
  - [License](#license)

---

## Installation

Install the SDK using `pnpm` or `yarn`:

```bash
pnpm add @nuecms/paypal-sdk
# or
yarn add @nuecms/paypal-sdk
```

---

## Quick Start

### 1. Import and Initialize the SDK

```typescript
import { paypalSdk } from '@nuecms/paypal-sdk';

const sdk = paypalSdk({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
});
```

### 2. Register API Endpoints

```typescript
sdk.r('getOrder', '/v2/checkout/orders/{order_id}', 'GET');
sdk.r('createOrder', '/v2/checkout/orders', 'POST');
```

### 3. Make API Calls

```typescript
const order = await sdk.getOrder({ order_id: '12345' });
console.log(order);
```

### More

See the testing code in the `tests` folder.

Example:

- [tests/server/paypal.ts](tests/server/paypal.ts)

---

## Usage Examples

### Registering Endpoints

Register endpoints with their HTTP method, path, and dynamic placeholders (e.g., `{order_id}`):

```typescript
sdk.r('getOrder', '/v2/checkout/orders/{order_id}', 'GET');
sdk.r('captureOrder', '/v2/checkout/orders/{order_id}/capture', 'POST');
sdk.r('refundOrder', '/v2/payments/captures/{capture_id}/refund', 'POST');
```

### Making API Calls

Call the registered endpoints dynamically with placeholders and additional options:

```typescript
const orderDetails = await sdk.getOrder({ order_id: '12345' });

console.log(orderDetails);
```


---


## Contributing

We welcome contributions to improve this SDK! To get started:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-name`).
3. Commit your changes (`git commit -m "Add feature X"`).
4. Push to the branch (`git push origin feature-name`).
5. Open a pull request.

---

## License

This SDK is released under the **MIT License**. You’re free to use, modify, and distribute this project. See the `LICENSE` file for more details.

