/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  testMatch: ["<rootDir>/src/**/*.{test,spec}.{ts,tsx}"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      tsconfig: {
        jsx: "react-jsx",
        module: "commonjs",
        moduleResolution: "node",
        esModuleInterop: true,
        allowJs: true,
        strict: false,
      },
    }],
  },
  transformIgnorePatterns: ["/node_modules/(?!(@testing-library)/)"],
  coverageProvider: "v8",
  collectCoverageFrom: [
    "src/lib/**/*.{ts,tsx}",
    "src/components/**/*.{ts,tsx}",
    "src/hooks/**/*.{ts,tsx}",
    "!src/__tests__/**",
  ],
};
