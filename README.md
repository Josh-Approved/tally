# Tally

A simple expense tracker. Free. No ads. No tracking. No accounts. Your data stays on your device.

## What it does

Tap +/− to add an expense or income, pick a category, see your month at a glance. Tally shows a category breakdown chart for whichever period you pick (day / week / month / year), totals for income / expenses / net, and a chronological list of every transaction. You can keep multiple accounts (cash, checking, a specific card), set up recurring transactions for things like rent and subscriptions, and export everything as CSV or as a JSON archive whenever you want.

On supported devices, Tally can read receipts with on-device AI — point the camera at a receipt and the amount, merchant, date, and a suggested category come back ready to confirm.

## Who it's for

Anyone who's tired of expense trackers that paywall the feature you used to have, lose your data when you reset your phone, or hand your spending history to ad networks. If you've used Monefy, Wallet, Mint, or YNAB and bounced off the price, the upsells, or the data harvesting, this is the same shape of tool with none of that.

## How to get it

Coming soon to the App Store and Play Store.

In the meantime, run it locally — see below.

## Run it locally

You'll need [Node.js](https://nodejs.org/) and the Expo Go app on your phone, or an iOS simulator / Android emulator.

```bash
git clone https://github.com/Josh-Approved/tally.git
cd tally
npm install
npm start
```

Then scan the QR code with Expo Go (or press `i` for iOS simulator, `a` for Android emulator).

## Privacy

Your data stays on your device. There are no accounts, no analytics, no servers. See [PRIVACY.md](PRIVACY.md).

## License

GPL-3.0 — see [LICENSE](LICENSE).

## Feedback

Email [feedback@joshapproved.com](mailto:feedback@joshapproved.com) with bugs, feature requests, or anything else.
