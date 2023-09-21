import { Request, Response, NextFunction } from 'express'

// eslint-disable-next-line @typescript-eslint/ban-types
export function runAsync(callback: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
        callback(req, res, next).catch(next)
    }
}
