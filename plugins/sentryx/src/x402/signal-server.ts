import * as http from 'http';
import { FileStore } from '../store';
import { X402_PORT, X402_NETWORK, X402_ASSET, X402_SINGLE_PRICE, X402_BATCH_PRICE } from '../config';

let server: http.Server | null = null;

function buildPaymentRequired(resource: string, amount: string, sellerAddress: string): string {
  const payload = {
    x402Version: 2,
    error: 'PAYMENT-SIGNATURE header is required',
    resource: { url: resource, description: 'SentryX Alpha Signal', mimeType: 'application/json' },
    accepts: [
      {
        scheme: 'aggr_deferred',
        network: X402_NETWORK,
        amount,
        payTo: sellerAddress,
        asset: X402_ASSET,
        maxTimeoutSeconds: 300,
        extra: { name: 'USDG', version: '1' },
      },
      {
        scheme: 'exact',
        network: X402_NETWORK,
        amount,
        payTo: sellerAddress,
        asset: X402_ASSET,
        maxTimeoutSeconds: 300,
        extra: { name: 'USDG', version: '1' },
      },
    ],
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Validate the x402 payment proof structure.
 * Decodes the base64 header, checks required fields (x402Version, payload.signature,
 * payload.authorization), and verifies the payTo matches the seller address.
 * Returns null on success or an error string on failure.
 */
function validatePaymentProof(headerValue: string, sellerAddress: string): string | null {
  try {
    const decoded = JSON.parse(Buffer.from(headerValue, 'base64').toString());

    if (!decoded.x402Version || decoded.x402Version < 1) {
      return 'Missing or invalid x402Version';
    }
    if (!decoded.payload?.signature || typeof decoded.payload.signature !== 'string' || decoded.payload.signature.length < 10) {
      return 'Missing or invalid payload.signature';
    }
    if (!decoded.payload?.authorization || typeof decoded.payload.authorization !== 'object') {
      return 'Missing or invalid payload.authorization';
    }
    if (!decoded.accepted?.payTo) {
      return 'Missing accepted.payTo';
    }
    if (decoded.accepted.payTo.toLowerCase() !== sellerAddress.toLowerCase()) {
      return `payTo mismatch: expected ${sellerAddress}`;
    }
    return null;
  } catch {
    return 'Failed to decode payment proof (invalid base64 or JSON)';
  }
}

export function startSignalServer(store: FileStore, sellerAddress: string, port: number = X402_PORT): Promise<void> {
  return new Promise((resolve, reject) => {
    if (server) {
      reject(new Error('Signal server already running'));
      return;
    }

    server = http.createServer((req, res) => {
      const url = new URL(req.url || '/', `http://localhost:${port}`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'PAYMENT-SIGNATURE, X-PAYMENT, Content-Type');

      if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

      const sendJson = (code: number, data: any) => {
        res.writeHead(code, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      };

      // Validate payment proof: decode base64, check structure & payTo
      const payHeader = (req.headers['payment-signature'] || req.headers['x-payment']) as string | undefined;
      let paymentValid = false;
      if (payHeader) {
        const err = validatePaymentProof(payHeader, sellerAddress);
        if (err) {
          console.warn(`[x402] Payment rejected: ${err}`);
        } else {
          paymentValid = true;
        }
      }

      if (url.pathname === '/health') {
        sendJson(200, { status: 'ok', server: 'sentryx-signal-server', seller: sellerAddress, signalsAvailable: store.getLatestSignal() !== null });
        return;
      }

      if (url.pathname === '/signals/latest') {
        if (!paymentValid) {
          const encoded = buildPaymentRequired(`http://localhost:${port}/signals/latest`, X402_SINGLE_PRICE, sellerAddress);
          res.writeHead(402, { 'Content-Type': 'application/json', 'PAYMENT-REQUIRED': encoded });
          res.end('{}');
          return;
        }
        const signal = store.getLatestSignal();
        if (!signal) { sendJson(404, { error: 'No signals available' }); return; }
        sendJson(200, signal);
        return;
      }

      if (url.pathname === '/signals/history') {
        if (!paymentValid) {
          const encoded = buildPaymentRequired(`http://localhost:${port}/signals/history`, X402_BATCH_PRICE, sellerAddress);
          res.writeHead(402, { 'Content-Type': 'application/json', 'PAYMENT-REQUIRED': encoded });
          res.end('{}');
          return;
        }
        const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '10'), 1), 50);
        const signals = store.getSignalHistory(limit);
        sendJson(200, { count: signals.length, signals });
        return;
      }

      sendJson(404, { error: 'Not found. Endpoints: /signals/latest, /signals/history, /health' });
    });

    server.listen(port, () => {
      console.log(`[x402] Signal server running on http://localhost:${port}`);
      resolve();
    });

    server.on('error', reject);
  });
}

export function stopSignalServer(): void {
  if (server) {
    server.close();
    server = null;
    console.log('[x402] Signal server stopped');
  }
}

export function isSignalServerRunning(): boolean {
  return server !== null;
}
