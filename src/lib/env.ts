type EnvironmentSource = Record<string, string | undefined>;

export class EnvironmentConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvironmentConfigurationError";
  }
}

function required(source: EnvironmentSource, key: string): string {
  const value = source[key]?.trim();
  if (!value) throw new EnvironmentConfigurationError(`${key} is not configured.`);
  return value;
}

function httpsUrl(source: EnvironmentSource, key: string, requiredValue: boolean): string | null {
  const raw = source[key]?.trim();
  if (!raw) {
    if (requiredValue) throw new EnvironmentConfigurationError(`${key} is not configured.`);
    return null;
  }

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") throw new Error("HTTPS is required");
    return url.toString().replace(/\/$/, "");
  } catch {
    throw new EnvironmentConfigurationError(`${key} must be a valid HTTPS URL.`);
  }
}

export function readPublicationEnv(source: EnvironmentSource = process.env) {
  return {
    pinataJwt: required(source, "PINATA_JWT"),
    gatewayUrl: httpsUrl(source, "NEXT_PUBLIC_GATEWAY_URL", true) as string,
    appUrl: httpsUrl(source, "NEXT_PUBLIC_APP_URL", false),
  };
}

