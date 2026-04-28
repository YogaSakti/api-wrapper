
# API Wrapper

This repository is My Personal project to support other projects.

## ✨ Features

- **ExpressJS**: Robust web framework for building APIs.
- **TypeScript**: Type-safe JavaScript for better maintainability.
- **Modular Structure**: Organized routes and utilities for scalable development.
- **Modular Exchange Integration**: Separated earn function modules for better maintainability.
- **Caching**: In-memory caching using `node-cache` for improved performance.
- **Error Handling**: Global error handler middleware to prevent information leakage.
- **Security**: Constant-time key comparison, input validation, and sanitization to prevent injection attacks.
- **Third-Party Integrations**: Fetches data from external APIs.
- **Proxy Support**: SOCKS5 and HTTPS proxy agent support for restricted APIs.

## 💻 Setup Instructions

### Prerequisites

1. Install [Node.js](https://nodejs.org/) (v16 or later).
2. Install [Yarn](https://yarnpkg.com/) (preferred package manager).

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/api-wrapper.git
   cd api-wrapper
   ```

2. Install dependencies:
   ```bash
   yarn
   ```

3. Set up environment variables:
   - Create a `.env` file by copying `.env.example`:
     ```bash
     cp .env.example .env
     ```
   - Update `.env` with your specific configuration:
     - Exchange keys
     - Optional: Proxy settings for restricted APIs

4. Start the development server:
   ```bash
   yarn dev
   ```

5. For production:
   - Build the project:
     ```bash
     yarn build
     ```
   - Start the server:
     ```bash
     yarn start
     ```

## 📚 API Documentation

### Health Check
- **GET /**: Returns a health check response.
  ```json
  { "status": "ok", "message": "Hello world" }
  ```
- **GET /api/v1**: Returns API v1 health status.
  ```json
  { "status": "ok" }
  ```

### Routes Overview

All routes are prefixed with `/api/v1`.

#### Artatix Routes
- **GET /api/v1/artatix**: Health check for Artatix service.
- **GET /api/v1/artatix/events**: Retrieves cached event data from the Artatix platform.
- **GET /api/v1/artatix/tickets/:slug**: Fetches ticket details for a given event.

#### Earn APIs (Stablecoin APR Rates)
- **GET /api/v1/earn**: Welcome message and available earn endpoints.
- **GET /api/v1/earn/okx**: Retrieves USDT/USDC APR data from OKX.
- **GET /api/v1/earn/bybit**: Fetches USDT/USDC APR data from Bybit.
- **GET /api/v1/earn/bybit-usde**: Fetches Bybit USDe airdrop rates.
- **GET /api/v1/earn/bybit-byusdt?tier=1**: Fetches Bybit BYUSDT airdrop rates. `tier` is optional; default behavior uses tier 1.
- **GET /api/v1/earn/bybit-onchain**: Fetches Bybit on-chain earn rates.
- **GET /api/v1/earn/binance**: Fetches Binance earn APR data.
- **GET /api/v1/earn/binance-stable?noLimit=true**: Fetches Binance stablecoin APR data. `noLimit` is optional.
- **GET /api/v1/earn/bitget**: Fetches combined USDT/USDC APR data from Bitget.
- **GET /api/v1/earn/bitget?filter=1,2**: Fetches selected Bitget rows by 1-based index. Current index order: `1` USDT, `2` USDT-VIP, `3` USDT-VIP-14, `4` USDC, `5` USDC-VIP.
- **GET /api/v1/earn/kamino/:vault/:address**: Fetches Kamino earn data for a vault and wallet address.

Example earn response:
```json
[
  { "name": "USDT", "APR": 0.05 },
  { "name": "USDC", "APR": 0.04 }
]
```

#### CoinMarketCap APIs
- **GET /api/v1/cmc/:slug?convert=USD**: Fetches token price from CoinMarketCap by slug, with symbol fallback. `convert` is optional and defaults to `USD`.
- **GET /api/v1/cmc/dex/:platform/:address**: Fetches DEX token price data by platform and contract address.

Example CMC response:
```json
{
  "bitcoin": {
    "usd": 65000
  }
}
```

#### Price APIs
- **GET /api/v1/price/pintu**: Fetches USDT-IDR price data from Pintu.
- **GET /api/v1/price/binance?symbol=USD1USDC&limit=10**: Fetches midpoint price from Binance order book. `symbol` defaults to `USD1USDC`; `limit` defaults to `10`.

Example price response:
```json
{ "price": 1.0001 }
```

For detailed logic and route handling, explore the `src/routes` directory.

## 🛠️ Development Notes

### File Structure

- **`src/api.ts`**: Main API configuration, middleware setup, and global error handler.
- **`src/routes/`**: Organized route definitions.
  - `index.ts`: Main router.
  - `cmc.ts`: CoinMarketCap price routes (Standard + DEX).
  - `artatix.ts`: Handles Artatix event and ticket data.
  - `earn.ts`: Provides stablecoin APR and earn rate APIs.
  - `price.ts`: Provides Pintu and Binance price APIs.
- **`src/services/`**: External API integrations and business logic.
  - `earn/`: Modular exchange earn data fetching functions.
- **`src/utils/`**: Utility functions.
  - `cache.service.ts`: In-memory caching implementation using node-cache.
- **`src/index.ts`**: Entry point for starting the server.

### Scripts
- **`yarn dev`**: Starts the server in development mode with live reloading using `nodemon`.
- **`yarn build`**: Compiles TypeScript into JavaScript.
- **`yarn test`**: Runs mocked endpoint tests without calling external APIs.
- **`yarn test:live`**: Runs live endpoint tests against real external APIs. Requires `RUN_LIVE_TESTS=true` and relevant `.env` credentials.
- **`yarn test:coverage`**: Runs mocked tests with coverage output.
- **`yarn start`**: Runs the server in production mode.

### Testing

Default tests are mocked endpoint tests. They exercise Express routes, validation, middleware, cache behavior, auth checks, and response shapes without making live external API calls.

Live tests are stored in `test/live` and are skipped during normal `yarn test`. Run them only when real network calls are intended:

```bash
yarn test:live
```

Useful optional live-test variables:
- `LIVE_CMC_DEX_PLATFORM`
- `LIVE_CMC_DEX_ADDRESS`
- `LIVE_ARTATIX_TICKET_SLUG`
- `LIVE_KAMINO_VAULT`
- `LIVE_KAMINO_ADDRESS`

## 📝 Notes

- The default server listens on `PORT` specified in the `.env` file (default: 3333).
- All API routes are versioned under `/api/v1`.
- Middleware includes:
  - **CORS**: Allows cross-origin requests.
  - **Morgan**: Logs HTTP requests for monitoring.
  - **node-cache**: Implements caching for improved performance (TTL varies by route).
  - **Error Handler**: Global middleware prevents stack trace leakage in production.
- Environment variables are required for external API integrations (CoinMarketCap, exchanges, proxies).
- Important environment variables include:
  - `PORT`: Server port. Defaults to `3333`.
  - `ALLOWED_ORIGINS`: Optional comma-separated CORS allowlist.
  - `CMC_API_KEY`: CoinMarketCap API key for standard price endpoints.
  - `CMC_DEX_API_KEY`: CoinMarketCap API key for DEX price endpoints.
  - Exchange API credentials and optional proxy variables as required by individual exchange services.
- Caching TTL:
  - Artatix events: 5 minutes
  - Earn APR rates: 30 seconds
  - CMC prices: 60 seconds

## 🚀 Deployment

Deploy the application to Railway:
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/n_2mnn?referralCode=matt)

## 👏 Acknowledgements

- [Faraz Patankar](https://github.com/FarazPatankar) and the Railway team for the [original template](https://github.com/railwayapp-templates/expressjs).
