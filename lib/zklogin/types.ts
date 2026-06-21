export interface ZkLoginProof {
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

export interface ZkLoginSession {
  address: string;
  ephemeralPrivateKey: string; // bech32 from Ed25519Keypair.getSecretKey()
  zkProof: ZkLoginProof;
  addressSeed: string; // BigInt as decimal string
  maxEpoch: number;
  salt: string;
  /** Google id_token — needed to refresh ZK proof before signing transactions. */
  jwt: string;
  /** Nonce randomness from sign-in; must match the ephemeral key in zkProof. */
  randomness: string;
  /** Sui network the nonce/maxEpoch were computed for — must match app network. */
  network: "testnet" | "devnet" | "mainnet";
  expiresAt: number; // ms timestamp
}

export interface ZkLoginPendingState {
  ephemeralPrivateKey: string;
  maxEpoch: number;
  randomness: string; // BigInt as decimal string from generateRandomness()
  /** Epoch captured at sign-in start — used to compute session expiry without an extra RPC call. */
  epochAtSignIn: number;
  network: "testnet" | "devnet" | "mainnet";
}
