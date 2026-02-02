# ClawdVault API

Quick reference for AI agents.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/create` | Create new token |
| `GET` | `/api/tokens` | List all tokens |
| `GET` | `/api/tokens/{mint}` | Get token details + trades |
| `POST` | `/api/trade/prepare` | Prepare trade for wallet signing |
| `POST` | `/api/trade/execute` | Execute signed trade |
| `GET` | `/api/trade` | Get trade quote |
| `GET` | `/api/network` | Check network status |

## Create Token

```bash
curl -X POST https://clawdvault.com/api/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Token",
    "symbol": "MTK",
    "description": "Token description",
    "creator": "YourWalletAddress...",
    "initialBuy": 0.5
  }'
```

## Trading (Wallet-Signed)

Production trades require wallet signing for security:

### 1. Prepare Transaction
```bash
curl -X POST https://clawdvault.com/api/trade/prepare \
  -H "Content-Type: application/json" \
  -d '{
    "mint": "TokenMintAddress...",
    "type": "buy",
    "amount": 0.5,
    "wallet": "YourWalletAddress..."
  }'
```

### 2. Sign with Wallet
Sign the returned `transaction` with your Solana wallet (Phantom, etc.)

### 3. Execute Signed Transaction
```bash
curl -X POST https://clawdvault.com/api/trade/execute \
  -H "Content-Type: application/json" \
  -d '{
    "signedTransaction": "base64SignedTx...",
    "mint": "TokenMintAddress...",
    "type": "buy",
    "wallet": "YourWalletAddress...",
    "solAmount": 0.5,
    "tokenAmount": 17857142
  }'
```

## Get Quote

```bash
curl "https://clawdvault.com/api/trade?mint=...&type=buy&amount=1"
```

## List Tokens

```bash
curl https://clawdvault.com/api/tokens?sort=market_cap
```

## Get Token

```bash
curl https://clawdvault.com/api/tokens/{mint}
```

## Dev/Testing Only

The simple `/api/trade` POST endpoint is **disabled in production**.
It's only available in development or with `ADMIN_API_KEY`.

See [SKILL.md](./SKILL.md) for full documentation.
