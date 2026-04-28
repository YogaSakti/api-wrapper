module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/test'],
    setupFiles: ['<rootDir>/test/setup.ts'],
    clearMocks: true,
    resetMocks: false,
    restoreMocks: true,
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/index.ts',
    ],
}
