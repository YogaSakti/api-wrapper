require(`dotenv`).config()
// call after config() to access the env variables
import express from 'express';
import cors from 'cors';

export const app = express();

app.use(cors({ origin: true }));

app.use(express.json());
app.use(express.raw({ type: 'application/vnd.custom-type' }));
app.use(express.text({ type: 'text/html' }));

// Healthcheck endpoint
app.get('/', (req, res) => {
  res.status(200).send({ status: 'ok' });
});

import route from './route';
import season from './season';
import solana from './solana';

// Version the api
app.use('/api/v1', route);
app.use('/api/season', season);
app.use('/api/solana', solana);

const port = process.env.PORT || 3333;

app.listen(port, () =>
  console.log(`API available on http://localhost:${port}`)
);
