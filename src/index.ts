import { config } from 'dotenv'

if (process.env.NODE_ENV !== 'production') config()

// call after config() to access the env variables
import { app } from './api'

const port = process.env.PORT || 3333

try {
    app.listen(port, () => console.log(`API available on http://localhost:${port}`))
} catch (error) {
    console.error('Error starting server:', error)
    process.exit(1)
}