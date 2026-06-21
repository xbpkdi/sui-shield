/**
 * Server-side zkLogin helpers — prover proxied so the browser never calls
 * third-party endpoints directly (avoids Safari "Load failed").
 * Salt is derived locally (see salt-server.ts), not Mysten's whitelisted service.
 *
 * Devnet uses a different Groth16 zkey than testnet/mainnet. Using the dev prover
 * on testnet produces proofs that fail on-chain with "Groth16 proof verify failed".
 */

const PROVER_BY_NETWORK: Record<string, string> = {
  devnet: "https://prover-dev.mystenlabs.com/v1",
  testnet: "https://prover.mystenlabs.com/v1",
  mainnet: "https://prover.mystenlabs.com/v1",
};

function resolveProverUrl(): string {
  const override = process.env.SUI_ZKLOGIN_PROVER_URL;
  if (override) return override;

  const network =
    process.env.NEXT_PUBLIC_SUI_NETWORK ?? process.env.SUI_NETWORK ?? "testnet";
  return PROVER_BY_NETWORK[network] ?? PROVER_BY_NETWORK.testnet;
}

export interface ZkLoginProofResponse {
  proofPoints: {
    a: string[];
    b: string[][];
    c: string[];
  };
  issBase64Details: {
    value: string;
    indexMod4: number;
  };
  headerBase64: string;
}

export interface ZkLoginProveInput {
  jwt: string;
  extendedEphemeralPublicKey: string;
  maxEpoch: number;
  jwtRandomness: string;
  salt: string;
  keyClaimName?: string;
}

export async function fetchZkLoginProof(
  input: ZkLoginProveInput
): Promise<ZkLoginProofResponse> {
  const res = await fetch(resolveProverUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jwt: input.jwt,
      extendedEphemeralPublicKey: input.extendedEphemeralPublicKey,
      maxEpoch: String(input.maxEpoch),
      jwtRandomness: input.jwtRandomness,
      salt: input.salt,
      keyClaimName: input.keyClaimName ?? "sub",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (text.includes("audience") && text.includes("not supported")) {
      throw new Error(
        "Google Client ID is not whitelisted on Mysten's testnet prover. " +
          "Set NEXT_PUBLIC_SUI_NETWORK=devnet in .env.local (zkLogin uses the open dev prover), " +
          "or connect Slush Wallet instead of Google sign-in."
      );
    }
    throw new Error(`ZK prover error ${res.status}: ${text}`);
  }

  return (await res.json()) as ZkLoginProofResponse;
}