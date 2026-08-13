export function assertReviewedLaunch(
  reviewedConfig: string,
  currentConfig: string,
  expectedAddress: `0x${string}`,
): `0x${string}` {
  if (reviewedConfig !== currentConfig) {
    throw new Error("Launch details changed. Check the launch again.");
  }
  return expectedAddress;
}
