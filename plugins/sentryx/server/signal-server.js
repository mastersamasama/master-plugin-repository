#!/usr/bin/env node

/**
 * SentryX Signal Server
 *
 * An x402 payment-gated HTTP server that serves alpha signals.
 * - GET /signals/latest → single latest signal (0.1 USDG)
 * - GET /signals/history?limit=N → last N signals (0.5 USDG per 10)
 * - GET /health → server status (free)
 *
 * Unauthenticated requests receive HTTP 402 with x402 payment requirements.
 * Requests with valid PAYMENT-SIGNATURE header receive the signal data.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Configuration
const PORT = parseInt(process.env.SHIELDX_PORT || '8402', 10);
const SIGNALS_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE,
  '.sentryx',
  'signals'
);
const SELLER_ADDRESS = process.env.SHIELDX_SELLER_ADDRESS || '0x0000000000000000000000000000000000000000';

// x402 payment configuration (X Layer, USDG)
const PAYMENT_CONFIG = {
  network: 'eip155:196',
  asset: '0x4ae46a509f6b1d9056937ba4500cb143933d2dc8', // USDG on X Layer
  singlePrice: '100000',   // 0.1 USDG (6 decimals)
  batchPrice: '500000',    // 0.5 USDG for 10 signals
  maxTimeoutSeconds: 300,
  extra: { name: 'USDG', version: '1' }
};

function buildPaymentRequired(resource, amount) {
  const payload = {
    x402Version: 2,
    error: 'PAYMENT-SIGNATURE header is required',
    resource: {
      url: resource,
      description: 'SentryX Alpha Signal',
      mimeType: 'application/json'
    },
    accepts: [
      {
        scheme: 'aggr_deferred',
        network: PAYMENT_CONFIG.network,
        amount: amount,
        payTo: SELLER_ADDRESS,
        asset: PAYMENT_CONFIG.asset,
        maxTimeoutSeconds: PAYMENT_CONFIG.maxTimeoutSeconds,
        extra: PAYMENT_CONFIG.extra
      },
      {
        scheme: 'exact',
        network: PAYMENT_CONFIG.network,
        amount: amount,
        payTo: SELLER_ADDRESS,
        asset: PAYMENT_CONFIG.asset,
        maxTimeoutSeconds: PAYMENT_CONFIG.maxTimeoutSeconds,
        extra: PAYMENT_CONFIG.extra
      }
    ]
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function readLatestSignal() {
  const filePath = path.join(SIGNALS_DIR, 'latest.json');
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function readSignalHistory(limit) {
  const historyDir = path.join(SIGNALS_DIR, 'history');
  try {
    if (!fs.existsSync(historyDir)) return [];
    const files = fs.readdirSync(historyDir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();

    const signals = [];
    for (const file of files) {
      if (signals.length >= limit) break;
      try {
        const data = JSON.parse(fs.readFileSync(path.join(historyDir, file), 'utf-8'));
        if (Array.isArray(data)) {
          signals.push(...data);
        } else {
          signals.push(data);
        }
      } catch {
        // skip corrupted files
      }
    }
    return signals.slice(0, limit);
  } catch {
    return [];
  }
}

function hasPaymentHeader(req) {
  return !!(req.headers['payment-signature'] || req.headers['x-payment']);
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  // CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'PAYMENT-SIGNATURE, X-PAYMENT, Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check (free)
  if (pathname === '/health') {
    sendJson(res, 200, {
      status: 'ok',
      server: 'sentryx-signal-server',
      version: '1.0.0',
      seller: SELLER_ADDRESS,
      signalsAvailable: readLatestSignal() !== null
    });
    return;
  }

  // GET /signals/latest
  if (pathname === '/signals/latest') {
    if (!hasPaymentHeader(req)) {
      const resourceUrl = `http://localhost:${PORT}/signals/latest`;
      const encoded = buildPaymentRequired(resourceUrl, PAYMENT_CONFIG.singlePrice);
      res.writeHead(402, {
        'Content-Type': 'application/json',
        'PAYMENT-REQUIRED': encoded
      });
      res.end('{}');
      return;
    }

    // Payment header present — serve signal
    // NOTE: In a production system, the server would verify the payment signature
    // against the x402 facilitator contract. For the hackathon demo, we trust
    // the presence of the header (the CLI already validated and signed it).
    const signal = readLatestSignal();
    if (!signal) {
      sendJson(res, 404, { error: 'No signals available yet. Alpha Hunt has not produced any signals.' });
      return;
    }
    sendJson(res, 200, signal);
    return;
  }

  // GET /signals/history?limit=N
  if (pathname === '/signals/history') {
    if (!hasPaymentHeader(req)) {
      const resourceUrl = `http://localhost:${PORT}/signals/history`;
      const encoded = buildPaymentRequired(resourceUrl, PAYMENT_CONFIG.batchPrice);
      res.writeHead(402, {
        'Content-Type': 'application/json',
        'PAYMENT-REQUIRED': encoded
      });
      res.end('{}');
      return;
    }

    const limit = parseInt(parsedUrl.searchParams.get('limit') || '10', 10);
    const clamped = Math.min(Math.max(limit, 1), 50);
    const signals = readSignalHistory(clamped);
    sendJson(res, 200, { count: signals.length, signals });
    return;
  }

  // 404 for everything else
  sendJson(res, 404, { error: 'Not found. Available endpoints: /signals/latest, /signals/history, /health' });
});

server.listen(PORT, () => {
  console.log(`SentryX Signal Server running on http://localhost:${PORT}`);
  console.log(`Seller address: ${SELLER_ADDRESS}`);
  console.log(`Signals directory: ${SIGNALS_DIR}`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  GET http://localhost:${PORT}/signals/latest   (0.1 USDG per signal)`);
  console.log(`  GET http://localhost:${PORT}/signals/history  (0.5 USDG per 10 signals)`);
  console.log(`  GET http://localhost:${PORT}/health           (free)`);
});
