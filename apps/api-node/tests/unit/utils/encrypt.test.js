import { jest } from '@jest/globals';

jest.unstable_mockModule('bcrypt', () => ({
  default: {
    genSalt: jest.fn(),
    hash: jest.fn(),
    compare: jest.fn(),
  }
}));

const { default: bcrypt } = await import('bcrypt');
const {
  generateHashedPassword,
  comparePassword,
  encryptMessage,
} = await import("#utils/encrypt.js");

describe("encrypt utils", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("generateHashedPassword", () => {
    it("should generate a hashed password", async () => {
      const password = "testPassword123";
      const mockSalt = "$2b$10$mockSalt";
      const mockHash = "$2b$10$mockSalt.mockHashedPassword";

      bcrypt.genSalt.mockResolvedValue(mockSalt);
      bcrypt.hash.mockResolvedValue(mockHash);

      const result = await generateHashedPassword(password);

      expect(bcrypt.genSalt).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, mockSalt);
      expect(result).toBe(mockHash);
    });

    it("should handle empty password", async () => {
      const password = "";
      const mockSalt = "$2b$10$mockSalt";
      const mockHash = "$2b$10$mockSalt.mockHashedPassword";

      bcrypt.genSalt.mockResolvedValue(mockSalt);
      bcrypt.hash.mockResolvedValue(mockHash);

      const result = await generateHashedPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, mockSalt);
      expect(result).toBe(mockHash);
    });

    it("should reject if bcrypt.genSalt fails", async () => {
      const password = "testPassword123";
      const error = new Error("Salt generation failed");

      bcrypt.genSalt.mockRejectedValue(error);

      await expect(generateHashedPassword(password)).rejects.toThrow(
        "Salt generation failed"
      );
    });

    it("should reject if bcrypt.hash fails", async () => {
      const password = "testPassword123";
      const mockSalt = "$2b$10$mockSalt";
      const error = new Error("Hash failed");

      bcrypt.genSalt.mockResolvedValue(mockSalt);
      bcrypt.hash.mockRejectedValue(error);

      await expect(generateHashedPassword(password)).rejects.toThrow(
        "Hash failed"
      );
    });
  });

  describe("comparePassword", () => {
    it("should return true when passwords match", async () => {
      const inputPassword = "testPassword123";
      const savedHash = "$2b$10$mockSalt.mockHashedPassword";

      bcrypt.compare.mockResolvedValue(true);

      const result = await comparePassword(inputPassword, savedHash);

      expect(bcrypt.compare).toHaveBeenCalledWith(inputPassword, savedHash);
      expect(result).toBe(true);
    });

    it("should return false when passwords do not match", async () => {
      const inputPassword = "wrongPassword";
      const savedHash = "$2b$10$mockSalt.mockHashedPassword";

      bcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword(inputPassword, savedHash);

      expect(bcrypt.compare).toHaveBeenCalledWith(inputPassword, savedHash);
      expect(result).toBe(false);
    });

    it("should reject if bcrypt.compare fails", async () => {
      const inputPassword = "testPassword123";
      const savedHash = "$2b$10$mockSalt.mockHashedPassword";
      const error = new Error("Comparison failed");

      bcrypt.compare.mockRejectedValue(error);

      await expect(
        comparePassword(inputPassword, savedHash)
      ).rejects.toThrow("Comparison failed");
    });
  });

  describe("encryptMessage", () => {
    it("should encrypt a message", async () => {
      const message = "Hello, World!";
      const mockSalt = "$2b$10$mockSalt";
      const mockHash = "$2b$10$mockSalt.mockEncryptedMessage";

      bcrypt.genSalt.mockResolvedValue(mockSalt);
      bcrypt.hash.mockResolvedValue(mockHash);

      const result = await encryptMessage(message);

      expect(bcrypt.genSalt).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).toHaveBeenCalledWith(message, mockSalt);
      expect(result).toBe(mockHash);
    });

    it("should encrypt an empty message", async () => {
      const message = "";
      const mockSalt = "$2b$10$mockSalt";
      const mockHash = "$2b$10$mockSalt.mockEncryptedMessage";

      bcrypt.genSalt.mockResolvedValue(mockSalt);
      bcrypt.hash.mockResolvedValue(mockHash);

      const result = await encryptMessage(message);

      expect(bcrypt.hash).toHaveBeenCalledWith(message, mockSalt);
      expect(result).toBe(mockHash);
    });

    it("should reject if bcrypt.genSalt fails", async () => {
      const message = "Hello, World!";
      const error = new Error("Salt generation failed");

      bcrypt.genSalt.mockRejectedValue(error);

      await expect(encryptMessage(message)).rejects.toThrow(
        "Salt generation failed"
      );
    });

    it("should reject if bcrypt.hash fails", async () => {
      const message = "Hello, World!";
      const mockSalt = "$2b$10$mockSalt";
      const error = new Error("Hash failed");

      bcrypt.genSalt.mockResolvedValue(mockSalt);
      bcrypt.hash.mockRejectedValue(error);

      await expect(encryptMessage(message)).rejects.toThrow("Hash failed");
    });

    it("should generate different hashes for the same message", async () => {
      const message = "Hello, World!";
      const mockSalt1 = "$2b$10$mockSalt1";
      const mockSalt2 = "$2b$10$mockSalt2";
      const mockHash1 = "$2b$10$mockSalt1.mockEncryptedMessage1";
      const mockHash2 = "$2b$10$mockSalt2.mockEncryptedMessage2";

      bcrypt.genSalt.mockResolvedValueOnce(mockSalt1);
      bcrypt.hash.mockResolvedValueOnce(mockHash1);

      const result1 = await encryptMessage(message);

      bcrypt.genSalt.mockResolvedValueOnce(mockSalt2);
      bcrypt.hash.mockResolvedValueOnce(mockHash2);

      const result2 = await encryptMessage(message);

      expect(result1).not.toBe(result2);
    });
  });
});
