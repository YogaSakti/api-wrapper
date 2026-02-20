
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

### Routes Overview

All routes are prefixed with `/api/v1`.

#### Artatix Routes
- **GET /api/v1/artatix**: Health check for Artatix service.
- **GET /api/v1/artatix/events**: Retrieves event data from the Artatix platform.
- **GET /api/v1/artatix/tickets/:slug**: Fetches ticket details for a given event.

#### Stable APIs (Stablecoin APR Rates)
- **GET /api/v1/stable**: Welcome message and available endpoints.
- **GET /api/v1/stable/okx**: Retrieves USDT/USDC APR data from OKX.
- **GET /api/v1/stable/bybit**: Fetches USDT/USDC APR data from Bybit.
- **GET /api/v1/stable/bybit-usde**: Fetches Bybit USDe airdrop rates.
- **GET /api/v1/stable/binance**: Fetches FDUSD APR data from Binance.
- **GET /api/v1/stable/binance-stable**: Fetches FDUSD/USDT/USDC APR data from Binance.
- **GET /api/v1/stable/bitget**: Fetches combined USDT/USDC APR data from Bitget.
- **GET /api/v1/stable/pintu**: Fetches USDT-IDR price data from Pintu.

#### CoinMarketCap Price APIs
- **GET /api/v1/cmc/:slug?convert=USD**: Fetches token prices from CoinMarketCap. Tries slug first, falls back to symbol. Optional `?convert=` param for fiat currency (default: USD).

For detailed logic and route handling, explore the `src/routes` directory.

## 🛠️ Development Notes

### File Structure

- **`src/api.ts`**: Main API configuration, middleware setup, and global error handler.
- **`src/routes/`**: Organized route definitions.
  - `index.ts`: Main router.
  - `cmc.ts`: CoinMarketCap price route.
  - `artatix.ts`: Handles Artatix event and ticket data.
  - `stable.ts`: Provides stablecoin APR rate APIs.
  - `earn/`: Modular exchange data fetching functions.
- **`src/utils/`**: Utility functions.
  - `cache.service.ts`: In-memory caching implementation using node-cache.
- **`src/index.ts`**: Entry point for starting the server.

### Scripts
- **`yarn dev`**: Starts the server in development mode with live reloading using `nodemon`.
- **`yarn build`**: Compiles TypeScript into JavaScript.
- **`yarn start`**: Runs the server in production mode.

## 📝 Notes

- The default server listens on `PORT` specified in the `.env` file (default: 3333).
- All API routes are versioned under `/api/v1`.
- Middleware includes:
  - **CORS**: Allows cross-origin requests.
  - **Morgan**: Logs HTTP requests for monitoring.
  - **node-cache**: Implements caching for improved performance (TTL varies by route).
  - **Error Handler**: Global middleware prevents stack trace leakage in production.
- Environment variables are required for external API integrations (CoinMarketCap, exchanges, proxies).
- Caching TTL:
  - Artatix events: 5 minutes
  - Stable APR rates: 30 seconds
  - Exchange: 15 minutes
  - CMC prices: 60 seconds

## 🚀 Deployment

Deploy the application to Railway:
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/n_2mnn?referralCode=matt)

## 👏 Acknowledgements

- [Faraz Patankar](https://github.com/FarazPatankar) and the Railway team for the [original template](https://github.com/railwayapp-templates/expressjs).
