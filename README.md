# Goldenia Platform

Fintech platform for gold and silver trading.

## Requirements
- Node.js (LTS)
- npm
- Docker Desktop

## Getting Started

### 0) Setup environment variables
Create `.env` from the example:

1. Copy environment variables:
```bash
cp .env.example .env
```

2. Start database:
```bash
docker-compose up -d
```

3. Install dependencies:
```bash
npm install
```

4. Run database migrations:
```bash
npm run db:migrate
```

5. Start development servers:
```bash
TO RUN THE APP:
# Terminal 1 
cd d:\goldenia-platform docker-compose up -d 
# Terminal 2 
cd d:\goldenia-platform\apps\api npm run dev 
# Terminal 3 
cd d:\goldenia-platform\apps\web npm run dev
```

- API: http://localhost:4000
- Web: http://localhost:3000


## Note Payments (Stripe):
```bash
Stripe is wired but disabled by default (placeholder keys).

To test payments:
1. Create a free Stripe account
2. Get your **test** keys from the Stripe dashboard
3. Put them in `.env` as `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`
```

## Note:
```bash
# Admin Account (for admin portal access)
Admin Email: admin@goldenia.com
Password: admin@123

# Test User Accounts (each has $1000 pre-loaded)
User 1: test2@gmail.com / test2@123
User 2: test3@gmail.com / test3@123
User 3: test4@gmail.com / test4@123

To create these test users automatically, run:
cd apps/api
npx ts-node scripts/create-test-users.ts
```
