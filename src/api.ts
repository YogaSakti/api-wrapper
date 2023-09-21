import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

export const app = express()

app.use(cors({ origin: true }))

// app.use(morgan(':remote-addr - :remote-user [:date] [:method] :url => :status | :res[content-length] | :response-time'))
app.use(morgan('[:method] :url => :status | :res[content-length] | :response-time ms'))

app.use(express.json())
app.use(express.raw({ type: 'application/vnd.custom-type' }))
app.use(express.text({ type: 'text/html' }))

// Healthcheck endpoint
app.get('/', (req, res) => res.status(200).send({ status: 'ok' }))

const api = express.Router()

api.get('/hello', (req, res) => res.status(200).send({ message: 'hello world' }))


// import routes
import route from './routes/index'

// Version the api  
app.use('/api/v1', route)