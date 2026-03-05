# InvoiceHQ 🧾

Professional invoice generator for freelancers worldwide.

## Features
- PDF Export
- 10+ Currencies
- Tax Calculator
- Recurring Invoices
- Free + Pro subscription plans (via Lemon Squeezy)

## Setup

1. Install dependencies:
```
npm install
```

2. Run locally:
```
npm run dev
```

3. Before deploying, update your Lemon Squeezy links in `src/App.jsx`:
```js
const LEMON_SQUEEZY = {
  pro_monthly: "https://YOUR_STORE.lemonsqueezy.com/...",
  pro_yearly:  "https://YOUR_STORE.lemonsqueezy.com/...",
};
```

4. Deploy to Vercel:
- Push to GitHub
- Import repo on vercel.com
- Click Deploy ✅

## Tech Stack
- React 18 + Vite
- No database needed
- Lemon Squeezy for payments
