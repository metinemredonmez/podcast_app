module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(t|j)s$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
            dynamicImport: true,
          },
          transform: {
            decoratorMetadata: true,
          },
          target: 'es2021',
        },
        module: {
          type: 'commonjs',
        },
      },
    ],
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/**/*.module.ts'],
  coverageDirectory: '../coverage',
  watchman: false,
  moduleNameMapper: {
    '^@podcast-app/shared-types$': '<rootDir>/../../packages/shared-types/src',
    '^@podcast-app/shared-types/(.*)$': '<rootDir>/../../packages/shared-types/src/$1',
  },
};
