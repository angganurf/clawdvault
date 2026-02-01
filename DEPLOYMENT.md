# ClawdVault Deployment Guide 🐺

Deploy the ClawdVault Anchor program to Solana devnet/mainnet.

## Prerequisites

### 1. Install Solana CLI
```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
```

### 2. Install Anchor CLI
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.30.1
avm use 0.30.1
```

### 3. Create/Import Wallet
```bash
# Create new wallet
solana-keygen new

# Or import existing
solana-keygen recover
```

### 4. Get Devnet SOL
```bash
solana config set --url devnet
solana airdrop 5
```

## Quick Deploy

```bash
cd clawdvault
chmod +x scripts/deploy.sh
./scripts/deploy.sh devnet
```

## Manual Deploy

### 1. Build
```bash
anchor build
```

This creates:
- `target/deploy/clawdvault-keypair.json` - Program keypair
- `target/deploy/clawdvault.so` - Compiled program

### 2. Get Program ID
```bash
solana-keygen pubkey target/deploy/clawdvault-keypair.json
```

### 3. Update Program ID

Update the ID in these files:
- `programs/clawdvault/src/lib.rs` - `declare_id!("...")`
- `app/src/lib/anchor/client.ts` - `PROGRAM_ID`
- `Anchor.toml` - `[programs.devnet]`

### 4. Rebuild
```bash
anchor build
```

### 5. Deploy
```bash
# Devnet
anchor deploy --provider.cluster devnet

# Mainnet (careful!)
anchor deploy --provider.cluster mainnet
```

### 6. Initialize Protocol
```bash
npx ts-node scripts/initialize.ts devnet
```

## Verify Deployment

```bash
# Check program exists
solana program show <PROGRAM_ID>

# Check config account
solana account <CONFIG_PDA>
```

## Program Architecture

```
┌─────────────────────────────────────────┐
│           ClawdVault Program            │
├─────────────────────────────────────────┤
│                                         │
│  Config PDA                             │
│  └─ authority (can update fees)         │
│  └─ feeRecipient (protocol fees)        │
│                                         │
│  For each token:                        │
│  ┌─────────────────────────────────┐    │
│  │ BondingCurve PDA                │    │
│  │ ├─ creator                      │    │
│  │ ├─ mint                         │    │
│  │ ├─ virtualSolReserves           │    │
│  │ ├─ virtualTokenReserves         │    │
│  │ ├─ realSolReserves              │    │
│  │ ├─ realTokenReserves            │    │
│  │ └─ graduated                    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  SOL Vault PDA (holds liquidity)        │
│  Token Vault (ATA of bonding curve)     │
│                                         │
└─────────────────────────────────────────┘
```

## Fee Structure

| Fee | Recipient | BPS |
|-----|-----------|-----|
| Protocol | feeRecipient | 50 (0.5%) |
| Creator | token creator | 50 (0.5%) |
| **Total** | | **100 (1%)** |

Fees are deducted on every trade and distributed atomically in the same transaction.

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| TOTAL_SUPPLY | 1,000,000,000 | 1B tokens (6 decimals) |
| INITIAL_VIRTUAL_SOL | 30 SOL | Starting virtual liquidity |
| GRADUATION_THRESHOLD | 120 SOL | When token graduates to Raydium |
| PROTOCOL_FEE_BPS | 50 | 0.5% to protocol |
| CREATOR_FEE_BPS | 50 | 0.5% to creator |

## Frontend Integration

After deployment, update `app/.env.local`:
```
NEXT_PUBLIC_PROGRAM_ID=<your-program-id>
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

The TypeScript client at `app/src/lib/anchor/client.ts` handles:
- Building buy/sell transactions
- Fetching bonding curve state
- Price/market cap calculations

## Upgrading

The program is currently **not upgradeable** (no upgrade authority set). To make it upgradeable:

```bash
# Deploy with upgrade authority
solana program deploy target/deploy/clawdvault.so --upgrade-authority ~/.config/solana/id.json
```

## Troubleshooting

### "Insufficient funds"
Get more devnet SOL: `solana airdrop 2`

### "Program failed to complete"
Check logs: `solana logs <PROGRAM_ID>`

### "Account not found"
Protocol not initialized. Run: `npx ts-node scripts/initialize.ts`

### Build errors
Make sure you're using:
- Rust 1.79.0 or compatible
- Anchor 0.30.1
- Solana CLI 1.18.x

---

🐺 Questions? Open an issue or ping @shadowclawai
