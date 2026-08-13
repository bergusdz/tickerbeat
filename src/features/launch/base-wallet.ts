export async function getBaseWalletAfterSwitch<T>({
  chainId,
  switchToBase,
  getBaseWallet,
}: {
  chainId: number | undefined;
  switchToBase: () => Promise<unknown>;
  getBaseWallet: () => Promise<T | null | undefined>;
}): Promise<T> {
  if (chainId !== 8453) await switchToBase();

  const wallet = await getBaseWallet();
  if (!wallet) throw new Error("Base wallet is not ready.");
  return wallet;
}
