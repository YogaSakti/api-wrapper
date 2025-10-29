
# dari.asia API Wrapper

This repository is My Personal project to support other projects.

## ✨ Features

- **ExpressJS**: Robust web framework for building APIs.
- **TypeScript**: Type-safe JavaScript for better maintainability.
- **Modular Structure**: Organized routes and utilities for scalable development.
- **Caching**: In-memory caching using `node-cache` for improved performance.
- **Error Handling**: Global error handler middleware to prevent information leakage.
- **Security**: Constant-time key comparison and input validation.
- **Third-Party Integrations**: Fetches data from external APIs (CoinGecko, Artatix, OKX, Bybit, Binance, and more).
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
   - Update `.env` with your specific configuration.

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
- **GET /api/v1/stable/okx**: Retrieves stablecoin APR data from OKX.
- **GET /api/v1/stable/bybit**: Fetches stablecoin APR data from Bybit.
- **GET /api/v1/stable/binance**: Fetches stablecoin APR data from Binance.
- **GET /api/v1/stable/flipster**: Fetches stablecoin APR data from Flipster.
- **GET /api/v1/stable/bitget**: Fetches stablecoin APR data from Bitget.
- **GET /api/v1/stable/bybit-usde**: Fetches Bybit USDe rates.
- **GET /api/v1/stable/pintu**: Fetches Pintu price data.

#### CoinGecko Price APIs
- **GET /api/v1/gecko/:slug**: Fetches token prices from CoinGecko.
- **GET /api/v1/geckoFiltered/:slug**: Fetches filtered token price data by market and trust score.

For detailed logic and route handling, explore the `src/routes` directory.

## 🛠️ Development Notes

### File Structure

- **`src/api.ts`**: Main API configuration, middleware setup, and global error handler.
- **`src/routes/`**: Organized route definitions.
  - `index.ts`: Main router with CoinGecko price endpoints.
  - `artatix.ts`: Handles Artatix event and ticket data.
  - `stable.ts`: Provides stablecoin APR rate APIs.
  - `balances/`: Exchange balance checking routes (protected).
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
- Environment variables are required for external API integrations (CoinGecko, exchanges, proxies).
- Caching TTL:
  - Artatix events: 5 minutes
  - Stable APR rates: 1 minute

## 🚀 Deployment

Deploy the application to Railway:
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/n_2mnn?referralCode=matt)

## 👏 Acknowledgements

- [Faraz Patankar](https://github.com/FarazPatankar) and the Railway team for the [original template](https://github.com/railwayapp-templates/expressjs).
