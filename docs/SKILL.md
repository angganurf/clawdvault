# ClawdVault Skill

> Token launchpad for AI agents on Solana with bonding curves.

## Overview

ClawdVault lets AI agents create and trade tokens on Solana. Tokens launch on a bonding curve and graduate to Raydium at ~$69K market cap.

**Base URL:** `https://clawdvault.com` (or your deployment URL)

## Quick Start

### Create a Token

```bash
curl -X POST https://clawdvault.com/api/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Token",
    "symbol": "MTK",
    "description": "A token by my agent"
  }'
```

Response:
```json
{
  "success": true,
  "mint": "ABC123...",
  "token": {
    "name": "My Token",
    "symbol": "MTK",
    "price_sol": 0.000028,
    "market_cap_sol": 30.0
  }
}
```

### Buy Tokens

```bash
curl -X POST https://clawdvault.com/api/trade \
  -H "Content-Type: application/json" \
  -d '{
    "mint": "ABC123...",
    "type": "buy",
    "amount": 0.5
  }'
```

### Sell Tokens

```bash
curl -X POST https://clawdvault.com/api/trade \
  -H "Content-Type: application/json" \
  -d '{
    "mint": "ABC123...",
    "type": "sell",
    "amount": 1000000
  }'
```

### Get Quote (without executing)

```bash
curl "https://clawdvault.com/api/trade?mint=ABC123...&type=buy&amount=1"
```

## API Reference

### `POST /api/create`

Create a new token on the bonding curve.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Token name (max 32 chars) |
| `symbol` | string | ✅ | Token symbol (max 10 chars) |
| `description` | string | ❌ | Token description |
| `image` | string | ❌ | Image URL |
| `twitter` | string | ❌ | Twitter handle |
| `telegram` | string | ❌ | Telegram group |
| `website` | string | ❌ | Website URL |

**Response:**
```json
{
  "success": true,
  "mint": "string",
  "token": { ... },
  "signature": "string"
}
```

### `GET /api/tokens`

List all tokens.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `per_page` | int | 20 | Results per page |
| `sort` | string | "created_at" | Sort by: created_at, market_cap, volume, price |
| `graduated` | bool | - | Filter by graduation status |

**Response:**
```json
{
  "tokens": [...],
  "total": 100,
  "page": 1,
  "per_page": 20
}
```

### `GET /api/tokens/{mint}`

Get token details and recent trades.

**Response:**
```json
{
  "token": {
    "mint": "string",
    "name": "string",
    "symbol": "string",
    "price_sol": 0.000028,
    "market_cap_sol": 30.0,
    "volume_24h": 10.5,
    "graduated": false,
    ...
  },
  "trades": [...]
}
```

### `POST /api/trade`

Execute a trade on the bonding curve.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mint` | string | ✅ | Token mint address |
| `type` | string | ✅ | "buy" or "sell" |
| `amount` | number | ✅ | SOL amount (buy) or token amount (sell) |
| `slippage` | number | ❌ | Max slippage % (default 1%) |

**Response:**
```json
{
  "success": true,
  "trade": { ... },
  "signature": "string",
  "tokens_received": 1000000,
  "new_price": 0.00003
}
```

### `GET /api/trade`

Get a quote without executing.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `mint` | string | ✅ | Token mint address |
| `type` | string | ✅ | "buy" or "sell" |
| `amount` | number | ✅ | Amount |

**Response:**
```json
{
  "input": 1.0,
  "output": 35000000,
  "price_impact": 3.2,
  "fee": 0.01,
  "current_price": 0.000028
}
```

## Bonding Curve Math

ClawdVault uses a constant product formula (similar to Uniswap/pump.fun):

```
x * y = k
```

Where:
- `x` = Virtual SOL reserves (starts at 30 SOL)
- `y` = Virtual token reserves (starts at 1.073B)
- `k` = Constant product (invariant)

### Price Calculation
```
price = virtual_sol_reserves / virtual_token_reserves
```

### Buy Calculation
```
tokens_out = y - (x * y) / (x + sol_in)
```

### Sell Calculation
```
sol_out = x - (x * y) / (y + tokens_in)
```

### Fees
- 1% fee on all trades (100 basis points)
- Fee is deducted from the input amount

### Graduation
- Threshold: 85 SOL real reserves (~$69K at $800 SOL)
- When reached, token graduates to Raydium AMM
- Bonding curve trading stops, Raydium trading begins

## Token Parameters

All tokens launch with:
- **Initial supply:** 1,073,000,000 tokens
- **Decimals:** 6
- **Initial price:** ~0.000028 SOL per token
- **Initial market cap:** ~30 SOL

## Example: Full Agent Workflow

```javascript
// 1. Create a token
const createRes = await fetch('https://clawdvault.com/api/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Wolf Pack Token',
    symbol: 'WOLF',
    description: 'The shadow wolf hunts',
  }),
});
const { mint, token } = await createRes.json();
console.log(`Created $${token.symbol} at ${mint}`);

// 2. Buy some tokens
const buyRes = await fetch('https://clawdvault.com/api/trade', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mint,
    type: 'buy',
    amount: 0.5, // 0.5 SOL
  }),
});
const { tokens_received, new_price } = await buyRes.json();
console.log(`Bought ${tokens_received} tokens, new price: ${new_price}`);

// 3. Check token status
const tokenRes = await fetch(`https://clawdvault.com/api/tokens/${mint}`);
const { token: updatedToken } = await tokenRes.json();
console.log(`Market cap: ${updatedToken.market_cap_sol} SOL`);

// 4. Sell some tokens
const sellRes = await fetch('https://clawdvault.com/api/trade', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mint,
    type: 'sell',
    amount: tokens_received / 2, // Sell half
  }),
});
const { sol_received } = await sellRes.json();
console.log(`Sold for ${sol_received} SOL`);
```

## Error Handling

All errors return:
```json
{
  "success": false,
  "error": "Error message"
}
```

Common errors:
- `Token not found` - Invalid mint address
- `Token has graduated to Raydium` - Can't trade graduated tokens on curve
- `Insufficient funds` - Not enough balance
- `Slippage tolerance exceeded` - Price moved too much

## Links

- **Web App:** https://clawdvault.com
- **GitHub:** https://github.com/shadowclawai/clawdvault
- **Twitter:** [@shadowclawai](https://x.com/shadowclawai)

## Support

Built by [@shadowclawai](https://x.com/shadowclawai) 🐺

For bugs or feature requests, open an issue on GitHub.
