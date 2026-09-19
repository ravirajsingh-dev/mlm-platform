# MLM Platform

Multi-level marketing platform built for 100K+ users, covering registration, genealogy trees, commission distribution, and multiple income streams.

## Stack

- React.js (member portal + admin dashboard)
- Node.js, Express.js
- MongoDB
- Redis + BullMQ for async commission and payout work
- Docker Compose for local and production deploys

## Highlights

- User registration with sponsor/upline placement
- Multi-level tree structures and payout rules
- Wallet, commission, and withdrawal flows
- Admin dashboard for members, settings, and reports
- Redis/BullMQ workers so heavy commission jobs stay off the request path

## Local setup

1. Copy `.env.example` to `.env` and fill in MongoDB, Redis, JWT, email, and object-storage values.
2. `docker compose up --build`
3. Member portal: `http://localhost:3000`
4. Admin panel: `http://localhost:3001`

Do not commit real environment files. Production hosts, registry credentials, and API keys stay in local env files.

## License

MIT. See [LICENSE](LICENSE).
