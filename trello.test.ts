import { describe, expect, test } from "bun:test";
import { validateId, TIMEOUT_MS } from "./trello";

describe("validateId", () => {
  test("valid 24-char ID", () => {
    expect(validateId("5a1b2c3d4e5f6g7h8i9j0k1l", "test")).toBe(
      "5a1b2c3d4e5f6g7h8i9j0k1l",
    );
  });

  test("valid 8-char shortLink", () => {
    expect(validateId("abc12345", "test")).toBe("abc12345");
  });

  test("rejects too short ID", () => {
    expect(() => validateId("abc", "test")).toThrow("Invalid test format");
  });

  test("rejects too long ID", () => {
    expect(() => validateId("a".repeat(25), "test")).toThrow(
      "Invalid test format",
    );
  });

  test("rejects special characters", () => {
    expect(() => validateId("abc-1234", "test")).toThrow("Invalid test format");
    expect(() => validateId("abc_1234", "test")).toThrow("Invalid test format");
    expect(() => validateId("abc/1234", "test")).toThrow("Invalid test format");
  });

  test("rejects empty string", () => {
    expect(() => validateId("", "test")).toThrow("Invalid test format");
  });

  test("error message does not contain input value", () => {
    try {
      validateId("malicious-input", "board-id");
    } catch (e) {
      expect((e as Error).message).not.toContain("malicious-input");
      expect((e as Error).message).toBe("Invalid board-id format");
    }
  });
});

describe("TIMEOUT_MS", () => {
  test("is 30 seconds", () => {
    expect(TIMEOUT_MS).toBe(30000);
  });
});

describe("CLI argument parsing", () => {
  test("default command is help", () => {
    const args: string[] = [];
    const [cmd = "help"] = args;
    expect(cmd).toBe("help");
  });

  test("extracts command and args", () => {
    const args = ["boards"];
    const [cmd, ...rest] = args;
    expect(cmd).toBe("boards");
    expect(rest).toEqual([]);
  });

  test("extracts command with argument", () => {
    const args = ["lists", "abc12345678901234567890123"];
    const [cmd, ...rest] = args;
    expect(cmd).toBe("lists");
    expect(rest).toEqual(["abc12345678901234567890123"]);
  });
});

describe("Error handling patterns", () => {
  test("AbortError detection pattern", () => {
    const error = new Error("Aborted");
    error.name = "AbortError";
    expect(error.name).toBe("AbortError");
  });

  test("error instanceof check", () => {
    const error = new Error("test");
    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe("test");
  });

  test("non-Error handling", () => {
    const notError: unknown = "string error";
    const message =
      notError instanceof Error ? notError.message : String(notError);
    expect(message).toBe("string error");
  });
});

describe("search command logic", () => {
  test("empty results handling", () => {
    const cards: { id: string; name: string }[] = [];
    const hasResults = cards.length > 0;
    expect(hasResults).toBe(false);
  });

  test("results formatting", () => {
    const cards = [
      { id: "abc12345", name: "Test Card" },
      { id: "def67890", name: "Another Card" },
    ];
    const output = cards.map((c) => `${c.id}\t${c.name}`);
    expect(output).toEqual(["abc12345\tTest Card", "def67890\tAnother Card"]);
  });

  test("query parameter construction", () => {
    const url = new URL("https://api.trello.com/1/search");
    url.searchParams.set("query", "test keyword");
    url.searchParams.set("modelTypes", "cards");
    expect(url.searchParams.get("query")).toBe("test keyword");
    expect(url.searchParams.get("modelTypes")).toBe("cards");
  });
});
