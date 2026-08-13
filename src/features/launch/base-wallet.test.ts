import { describe, expect, it, vi } from "vitest";

import { getBaseWalletAfterSwitch } from "./base-wallet";

describe("Base launch wallet preparation", () => {
  it("gets a fresh Base wallet client after an awaited network switch", async () => {
    const calls: string[] = [];
    const wallet = { account: "fresh-base-wallet" };

    const result = await getBaseWalletAfterSwitch({
      chainId: 1,
      switchToBase: async () => {
        calls.push("switch");
      },
      getBaseWallet: async () => {
        calls.push("wallet");
        return wallet;
      },
    });

    expect(result).toBe(wallet);
    expect(calls).toEqual(["switch", "wallet"]);
  });

  it("does not request a network switch when already on Base", async () => {
    const switchToBase = vi.fn();
    const wallet = { account: "base-wallet" };

    await expect(
      getBaseWalletAfterSwitch({
        chainId: 8453,
        switchToBase,
        getBaseWallet: async () => wallet,
      }),
    ).resolves.toBe(wallet);
    expect(switchToBase).not.toHaveBeenCalled();
  });

  it("fails closed when no Base wallet client is available", async () => {
    await expect(
      getBaseWalletAfterSwitch({
        chainId: 8453,
        switchToBase: async () => undefined,
        getBaseWallet: async () => undefined,
      }),
    ).rejects.toThrow("Base wallet is not ready.");
  });
});
