class AppError extends Error {
    status: number
    data?: unknown

    constructor(status: number, message: string, data?: unknown) {
        super(message)
        this.name = 'AppError'
        this.status = status
        this.data = data
    }
}

export default AppError