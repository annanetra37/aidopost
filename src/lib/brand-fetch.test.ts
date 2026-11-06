import { describe, expect, it } from "vitest";
import { assertPublicUrl, classifyInput } from "./brand-fetch";

describe("classifyInput", () => {
  it("detects websites, social links and names", () => {
    expect(classifyInput("https://example.com").type).toBe("website");
    expect(classifyInput("example.am/shop").type).toBe("website");
    expect(classifyInput("instagram.com/aidopost").type).toBe("social");
    expect(classifyInput("https://www.tiktok.com/@shop").type).toBe("social");
    expect(classifyInput("@mybrand").type).toBe("social");
    expect(classifyInput("Yerevan Silver Studio").type).toBe("name");
  });
});

describe("assertPublicUrl", () => {
  it("blocks private and loopback hosts", async () => {
    await expect(assertPublicUrl(new URL("http://127.0.0.1/"))).rejects.toThrow();
    await expect(assertPublicUrl(new URL("http://10.0.0.5/"))).rejects.toThrow();
    await expect(assertPublicUrl(new URL("http://169.254.169.254/latest"))).rejects.toThrow();
    await expect(assertPublicUrl(new URL("file:///etc/passwd"))).rejects.toThrow();
  });
});
