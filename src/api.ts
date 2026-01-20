import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

export const app = express()

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.length === 0) {
                return callback(null, true)
            }
            return callback(null, allowedOrigins.includes(origin))
        }
    })
)

const sanitizeUrl = (url: string) => url.replace(/(\/balances\/)([^/]+)/gi, '$1[REDACTED]')

app.use(
    morgan((tokens, req, res) => {
        const method = tokens.method(req, res)
        const url = tokens.url(req, res) || ''
        const status = tokens.status(req, res)
        const contentLength = tokens.res(req, res, 'content-length')
        const responseTime = tokens['response-time'](req, res)
        return `[${method}] ${sanitizeUrl(url)} => ${status} | ${contentLength} | ${responseTime} ms`
    })
)

app.use(express.json())
app.use(express.raw({ type: 'application/vnd.custom-type' }))
app.use(express.text({ type: 'text/html' }))

// Healthcheck endpoint
app.get('/', (req, res) => res.status(200).send({ status: 'ok', message: 'Hello world' }))

// import routes
import route from './routes/index'

// Version the api  
app.use('/api/v1', route)

// Error handling middleware (must be last)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err)
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV !== 'production'
    
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: isDevelopment ? err.message : 'An error occurred processing your request',
        ...(isDevelopment && { stack: err.stack })
    })
})