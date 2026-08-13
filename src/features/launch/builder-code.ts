import { Attribution } from "ox/erc8021";

export function builderCodeDataSuffix(code: string | undefined): `0x${string}` | undefined {
  const normalized = code?.trim();
  if (!normalized) return undefined;
  if (!/^bc_[a-z0-9]+$/i.test(normalized)) {
    throw new Error("Base Builder Code must match the bc_… value shown in base.dev.");
  }
  return Attribution.toDataSuffix({ codes: [normalized] });
}
