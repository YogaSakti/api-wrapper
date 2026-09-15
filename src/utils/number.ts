export const toAmount = (value: unknown): number => {
    const amount = Number.parseFloat(String(value))
    return Number.isNaN(amount) ? 0 : amount
}
