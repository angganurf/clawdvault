# Upgrading ClawdVault Program

This guide covers how to upgrade the ClawdVault Solana program with verified builds.

## Prerequisites

- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) installed
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) v0.32.1+
- [Docker](https://docs.docker.com/get-docker/) running
- `solana-verify` CLI v0.4.11+:
  ```bash
  cargo install solana-verify --version 0.4.11
  ```
- Program upgrade authority keypair

## Program Info

- **Program ID:** `GUyF2TVe32Cid4iGVt2F6wPYDhLSVmTUZBj2974outYM`
- **Upgrade Authority:** `7b9191rMLP8yZaKYudWiFtFZwtaEYX5Tyy2hZeEKDyWq`

## Step 1: Make Your Changes

Edit the program code in `programs/clawdvault/src/lib.rs` and test locally:

```bash
anchor build
anchor test
```

## Step 2: Build Verifiable Binary

Build a deterministic, verifiable binary using Docker:

```bash
anchor build --verifiable
```

This creates `target/verifiable/clawdvault.so` - a reproducible build that anyone can verify.

**Note:** The Cargo.lock must be version 3 format. If you get errors, regenerate it:
```bash
rm Cargo.lock
cargo +1.75.0 generate-lockfile
```

## Step 3: Verify Build Hash

Check the hash of your verifiable build:

```bash
solana-verify get-executable-hash target/verifiable/clawdvault.so
```

## Step 4: Deploy to Mainnet

Deploy the verifiable binary:

```bash
solana program deploy target/verifiable/clawdvault.so \
  --program-id GUyF2TVe32Cid4iGVt2F6wPYDhLSVmTUZBj2974outYM \
  --url mainnet-beta \
  --upgrade-authority /path/to/authority-keypair.json \
  --fee-payer /path/to/authority-keypair.json \
  --with-compute-unit-price 50000
```

Verify the on-chain hash matches:

```bash
solana-verify get-program-hash GUyF2TVe32Cid4iGVt2F6wPYDhLSVmTUZBj2974outYM -u mainnet
```

## Step 5: Commit and Push

Commit your changes including the updated Cargo.lock:

```bash
git add -A
git commit -m "feat: your upgrade description"
git push
```

## Step 6: Verify Against Repository

Run verification against the public GitHub repo:

```bash
solana-verify verify-from-repo \
  --program-id GUyF2TVe32Cid4iGVt2F6wPYDhLSVmTUZBj2974outYM \
  https://github.com/shadowclawai/clawdvault \
  -u mainnet \
  --library-name clawdvault \
  --base-image solanafoundation/solana-verifiable-build:2.3.0
```

When prompted, type `y` to upload verification data on-chain.

## Step 7: Submit to OtterSec

Submit for remote verification by OtterSec:

```bash
solana-verify remote submit-job \
  --program-id GUyF2TVe32Cid4iGVt2F6wPYDhLSVmTUZBj2974outYM \
  --uploader 7b9191rMLP8yZaKYudWiFtFZwtaEYX5Tyy2hZeEKDyWq
```

## Verification Status

Check verification status at:
- [OtterSec API](https://verify.osec.io/status/GUyF2TVe32Cid4iGVt2F6wPYDhLSVmTUZBj2974outYM)
- [Solana Explorer](https://solscan.io/account/GUyF2TVe32Cid4iGVt2F6wPYDhLSVmTUZBj2974outYM)
- [SolanaFM](https://solana.fm/address/GUyF2TVe32Cid4iGVt2F6wPYDhLSVmTUZBj2974outYM)

## Troubleshooting

### Docker Image Issues
If `solana-verify` picks the wrong Docker image, specify it manually:
```bash
--base-image solanafoundation/solana-verifiable-build:2.3.0
```

### Cargo.lock Version
Solana verifiable builds require Cargo.lock v3. Downgrade if needed:
```bash
cargo +1.75.0 generate-lockfile
```

### Build Reproducibility
Always use `anchor build --verifiable` or `solana-verify build` for deployments. Regular `anchor build` produces non-deterministic binaries that won't verify.

## Security Notes

- Keep your upgrade authority keypair secure and backed up
- Never commit keypairs to the repository
- Consider using a multisig for upgrade authority in production
- Test upgrades on devnet before mainnet
