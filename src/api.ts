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

const sanitizeHeaders = (headers: express.Request['headers']) => {
    const sanitized = { ...headers }

    if (sanitized.authorization) {
        sanitized.authorization = '[REDACTED]'
    }
    if (sanitized['x-api-key']) {
        sanitized['x-api-key'] = '[REDACTED]'
    }

    return sanitized
}

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
    console.error('Error:', {
        error: err,
        method: req.method,
        url: sanitizeUrl(req.originalUrl || req.url),
        headers: sanitizeHeaders(req.headers),
    })
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV !== 'production'
    
    const status = err.status || 500

    res.status(status).json({
        error: status >= 500 ? 'Internal Server Error' : err.name || 'Request Error',
        message: isDevelopment ? err.message : 'An error occurred processing your request',
        ...(isDevelopment && err.data && { data: err.data }),
        ...(isDevelopment && { stack: err.stack })
    })
})