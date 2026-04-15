import * as https from 'https';
import * as http from 'http';
import { MCP_URL, MCP_API_KEY } from '../config';

interface McpResponse {
  jsonrpc: string;
  id: number;
  result?: { content: Array<{ type: string; text: string }> };
  error?: { code: number; message: string };
}

export class McpClient {
  private apiKey: string;
  private url: string;
  private requestId = 0;

  constructor(apiKey: string = MCP_API_KEY, url: string = MCP_URL) {
    this.apiKey = apiKey;
    this.url = url;
    if (!this.apiKey) {
      console.warn('[MCP] OKX_API_KEY not set — MCP calls will fail. Set env var OKX_API_KEY or use DEMO=true mode.');
    }
  }

  async callTool(toolName: string, params: Record<string, any>): Promise<any> {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name: toolName, arguments: params },
      id: ++this.requestId,
    });

    const parsed = new URL(this.url);
    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'OK-ACCESS-KEY': this.apiKey,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    return new Promise((resolve, reject) => {
      const transport = parsed.protocol === 'https:' ? https : http;
      const req = transport.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json: McpResponse = JSON.parse(data);
            if (json.error) {
              reject(new Error(`MCP error [${json.error.code}]: ${json.error.message}`));
              return;
            }
            if (json.result?.content?.[0]?.text) {
              try {
                resolve(JSON.parse(json.result.content[0].text));
              } catch {
                resolve(json.result.content[0].text);
              }
            } else {
              resolve(json.result);
            }
          } catch {
            reject(new Error(`Failed to parse MCP response: ${data.slice(0, 200)}`));
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(30000, () => { req.destroy(new Error('MCP request timeout')); });
      req.write(body);
      req.end();
    });
  }

  // ─── Signal Methods ─────────────────────────────────────

  async getSmartMoneySignals(chain: string, limit: number = 20): Promise<any[]> {
    try {
      const result = await this.callTool('getSmartMoneyActivity', { chainIndex: chain, limit: String(limit) });
      return Array.isArray(result?.data) ? result.data : result?.data ? [result.data] : [];
    } catch (e) {
      console.error(`[MCP] getSmartMoneySignals error: ${e}`);
      return [];
    }
  }

  async getTrendingTokens(chain: string, limit: number = 20): Promise<any[]> {
    try {
      const result = await this.callTool('getTrendingTokens', { chainIndex: chain, limit: String(limit) });
      return Array.isArray(result?.data) ? result.data : result?.data ? [result.data] : [];
    } catch (e) {
      console.error(`[MCP] getTrendingTokens error: ${e}`);
      return [];
    }
  }

  async getNewPairs(chain: string, limit: number = 20): Promise<any[]> {
    try {
      const result = await this.callTool('getNewPairs', { chainIndex: chain, limit: String(limit) });
      return Array.isArray(result?.data) ? result.data : result?.data ? [result.data] : [];
    } catch (e) {
      console.error(`[MCP] getNewPairs error: ${e}`);
      return [];
    }
  }

  // ─── Market Methods ─────────────────────────────────────

  async getTokenPrice(chain: string, address: string): Promise<any> {
    try {
      return await this.callTool('getTokenPrice', { chainIndex: chain, tokenAddress: address });
    } catch (e) {
      console.error(`[MCP] getTokenPrice error: ${e}`);
      return null;
    }
  }

  async getTokenDetail(chain: string, address: string): Promise<any> {
    try {
      return await this.callTool('getTokenDetail', { chainIndex: chain, tokenAddress: address });
    } catch (e) {
      console.error(`[MCP] getTokenDetail error: ${e}`);
      return null;
    }
  }

  async getHolderDistribution(chain: string, address: string): Promise<any> {
    try {
      return await this.callTool('getHolderDistribution', { chainIndex: chain, tokenAddress: address });
    } catch (e) {
      console.error(`[MCP] getHolderDistribution error: ${e}`);
      return null;
    }
  }

  async checkDevReputation(chain: string, devAddress: string): Promise<any> {
    try {
      return await this.callTool('getDevInfo', { chainIndex: chain, address: devAddress });
    } catch (e) {
      console.error(`[MCP] checkDevReputation error: ${e}`);
      return null;
    }
  }
}
