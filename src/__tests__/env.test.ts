import { z } from "zod";
import { validateEnv } from "../lib/env";

describe("Environment Variables", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("NEXTAUTH_SECRET validation", () => {
    test("should accept valid base64 encoded string", () => {
      process.env.NODE_ENV = "development";
      process.env.NEXTAUTH_SECRET =
        "dGVzdC1zZWNyZXQta2V5LWZvci1kZXZlbG9wbWVudC1lbnZpcm9ubWVudA=="; // 32文字以上の有効なbase64
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.GOOGLE_CLIENT_ID =
        "123456789-abcdef.apps.googleusercontent.com";
      process.env.GOOGLE_CLIENT_SECRET = "test-secret-key-for-development";
      process.env.NEXTAUTH_URL = "http://localhost:3000";

      expect(() => validateEnv()).not.toThrow();
    });

    test("should reject invalid base64 string", () => {
      process.env.NODE_ENV = "development";
      process.env.NEXTAUTH_SECRET = "invalid-base64-string!@#";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.GOOGLE_CLIENT_ID =
        "123456789-abcdef.apps.googleusercontent.com";
      process.env.GOOGLE_CLIENT_SECRET = "test-secret-key-for-development";
      process.env.NEXTAUTH_URL = "http://localhost:3000";

      expect(() => validateEnv()).toThrow(
        "NEXTAUTH_SECRET must be a valid base64 encoded string"
      );
    });

    test("should reject too short base64 string", () => {
      process.env.NODE_ENV = "development";
      process.env.NEXTAUTH_SECRET = "dGVzdA=="; // "test" (4バイト、24バイト未満)
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.GOOGLE_CLIENT_ID =
        "123456789-abcdef.apps.googleusercontent.com";
      process.env.GOOGLE_CLIENT_SECRET = "test-secret-key-for-development";
      process.env.NEXTAUTH_URL = "http://localhost:3000";

      expect(() => validateEnv()).toThrow(
        "NEXTAUTH_SECRET must be a valid base64 encoded string"
      );
    });

    test("should require longer secret in production", () => {
      process.env.NODE_ENV = "production";
      process.env.NEXTAUTH_SECRET =
        "dGVzdC1zZWNyZXQta2V5LWZvci1kZXZlbG9wbWVudC1lbnZpcm9ubWVudA=="; // 32文字（64文字未満）
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.GOOGLE_CLIENT_ID =
        "123456789-abcdef.apps.googleusercontent.com";
      process.env.GOOGLE_CLIENT_SECRET = "test-secret-key-for-development";
      process.env.NEXTAUTH_URL = "https://localhost:3000";
      process.env.ADMIN_SECURITY_TOKEN =
        "test-admin-security-token-32-chars-long";

      expect(() => validateEnv()).toThrow(
        "NEXTAUTH_SECRET should be at least 64 characters long in production"
      );
    });

    test("should accept long enough secret in production", () => {
      process.env.NODE_ENV = "production";
      process.env.NEXTAUTH_SECRET =
        "dGVzdC1zZWNyZXQta2V5LWZvci1wcm9kdWN0aW9uLWVudmlyb25tZW50LXdpdGgtbG9uZy1zZWNyZXQta2V5"; // 64文字以上の有効なbase64
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.GOOGLE_CLIENT_ID =
        "123456789-abcdef.apps.googleusercontent.com";
      process.env.GOOGLE_CLIENT_SECRET = "test-secret-key-for-development";
      process.env.NEXTAUTH_URL = "https://localhost:3000";
      process.env.ADMIN_SECURITY_TOKEN =
        "test-admin-security-token-32-chars-long";

      expect(() => validateEnv()).not.toThrow();
    });
  });

  describe("Production environment requirements", () => {
    test("should require HTTPS URL in production", () => {
      process.env.NODE_ENV = "production";
      process.env.NEXTAUTH_SECRET =
        "dGVzdC1zZWNyZXQta2V5LWZvci1wcm9kdWN0aW9uLWVudmlyb25tZW50LXdpdGgtbG9uZy1zZWNyZXQta2V5";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.GOOGLE_CLIENT_ID =
        "123456789-abcdef.apps.googleusercontent.com";
      process.env.GOOGLE_CLIENT_SECRET = "test-secret-key-for-development";
      process.env.NEXTAUTH_URL = "http://localhost:3000"; // HTTP instead of HTTPS
      process.env.ADMIN_SECURITY_TOKEN =
        "test-admin-security-token-32-chars-long";

      expect(() => validateEnv()).toThrow(
        "NEXTAUTH_URL must use HTTPS in production"
      );
    });

    test("should require ADMIN_SECURITY_TOKEN in production", () => {
      process.env.NODE_ENV = "production";
      process.env.NEXTAUTH_SECRET =
        "dGVzdC1zZWNyZXQta2V5LWZvci1wcm9kdWN0aW9uLWVudmlyb25tZW50LXdpdGgtbG9uZy1zZWNyZXQta2V5";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.GOOGLE_CLIENT_ID =
        "123456789-abcdef.apps.googleusercontent.com";
      process.env.GOOGLE_CLIENT_SECRET = "test-secret-key-for-development";
      process.env.NEXTAUTH_URL = "https://localhost:3000";
      // ADMIN_SECURITY_TOKEN is missing
      delete process.env.ADMIN_SECURITY_TOKEN;

      expect(() => validateEnv()).toThrow("ADMIN_SECURITY_TOKEN: Required");
    });
  });
});
