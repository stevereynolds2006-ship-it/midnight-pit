# Midnight Pit

Your Rare Friend stands a night market. Spend 1 simulated $RAREFRIENDS to deploy a seal, a weighted roll lands one of six asset types, and you sell that asset back to a fixed RF book or keep it on the Friend.

**Builder:** Steven Reynolds · [@Sharpbigred](https://x.com/Sharpbigred) · **Category:** Economy Potential · **SDK:** FriendSDK v0.1.4

**Playable preview:** https://stevereynolds2006-ship-it.github.io/midnight-pit/

The preview is the FriendSDK host. It stays simulated: no live RF moves and nothing is signed beyond wallet connection. You need a browser wallet holding a Rare Friends Generations NFT, generation 1 or higher, on Robinhood mainnet (chain 4663).

## Run it

Node.js 22+.

```sh
git clone https://github.com/stevereynolds2006-ship-it/midnight-pit.git
cd midnight-pit
npm ci
npm run dev
```

Open the printed URL (normally `http://127.0.0.1:4173`). Connect your wallet and select your Friend. The SDK checks ownership before play. No RF funding is required. Omit a deployment file so the economy stays simulated.

`npm run check` validates the odds table. `npm run build` writes a static preview to `preview/`.

## Play

1. Read the market. Six asset types are already quoted in RF.
2. Press **Deploy seal** or the D key. It costs 1 RF and reserves up to 10 RF until the roll settles.
3. The crack is only a reveal. The outcome was already committed.
4. **Sell to market** to redeem the book value, or **Keep on Friend**. Kept assets do not expire.
5. Open **Desk** to mute, reduce motion, or turn off shake.

Touch and keyboard both work. The stage stays inside the SDK 960 × 640 container.

## Rules and rewards

**All balances, purchases, and rewards are simulated.** One seal costs 1 RF. Weights total 10,000 basis points. Expected redemption is 0.893 RF, so the pit keeps about 0.107 RF per seal if you always sell.

| Asset | Chance | Book |
| --- | ---: | ---: |
| Ash Chip | 42% | 0.15 RF |
| Alley Rumor | 25% | 0.40 RF |
| Brass Marker | 18% | 1.00 RF |
| Velvet Badge | 10% | 2.50 RF |
| Oracle Lens | 4% | 5.00 RF |
| Genesis Spark | 1% | 10.00 RF |

A purchase reserves the 10 RF maximum until that seal settles. Kept rewards stay reserved until you sell them. New seals pause when free backing cannot cover the next maximum prize.

## Checks, credits, and limitations

`npm run check` passed against FriendSDK v0.1.4 (expected reward 0.893 RF, maximum 10 RF). The static preview build succeeds. A real-wallet playthrough is still outstanding. Browser checks on the development desk covered desktop and mobile simulated play; those checks are not part of this SDK package.

Asset glyphs are original. Chance rules, the preview ledger, sound cues, and Generations pixels are FriendSDK. See [NOTICE.md](NOTICE.md).

No secondary order book, creator fee, wearable slot, or live contract is included. Official mainnet publication still needs a reviewed deployment. The signed-in session leaderboard from the development desk is not part of this SDK host.
