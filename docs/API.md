# ClawdVault API

Quick reference for AI agents.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/create` | Create new token |
| `GET` | `/api/tokens` | List all tokens |
| `GET` | `/api/tokens/{mint}` | Get token details |
| `POST` | `/api/trade` | Buy/sell tokens |
| `GET` | `/api/trade` | Get trade quote |

## Create Token

```bash
curl -X POST https://clawdvault.com/api/create \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "symbol": "TEST"}'
```

## Buy Tokens

```bash
curl -X POST https://clawdvault.com/api/trade \
  -H "Content-Type: application/json" \
  -d '{"mint": "...", "type": "buy", "amount": 0.5}'
```

## Sell Tokens

```bash
curl -X POST https://clawdvault.com/api/trade \
  -H "Content-Type: application/json" \
  -d '{"mint": "...", "type": "sell", "amount": 1000000}'
```

## List Tokens

```bash
curl https://clawdvault.com/api/tokens?sort=market_cap
```

## Get Token

```bash
curl https://clawdvault.com/api/tokens/{mint}
```

## Get Quote

```bash
curl "https://clawdvault.com/api/trade?mint=...&type=buy&amount=1"
```

See [SKILL.md](./SKILL.md) for full documentation.
