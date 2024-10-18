require('dotenv').config()
// call after config() to access the env variables
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
export const app = express()

app.use(cors({ origin: true }))

// app.use(morgan(':remote-addr - :remote-user [:date] [:method] :url => :status | :res[content-length] | :response-time'))
app.use(morgan('[:method] :url => :status | :res[content-length] | :response-time ms'))


app.use(express.json())

// Healthcheck endpoint
app.get('/', (req, res) => res.status(200).json({ status: 'ok' }))

import route from './route'
import season from './season'
import artatix from './artatix'
// import solana from './solana'

// Version the api
app.use('/api/v1', route)
app.use('/api/season', season)
app.use('/api/artatix', artatix)
// app.use('/api/solana', solana)

const port = process.env.PORT || 3333

app.listen(port, () =>console.log(`API available on http://localhost:${port}`))
