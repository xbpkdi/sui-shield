import type { Metadata } from "next";
import { RpcHealthClient } from "./RpcHealthClient";

export const metadata: Metadata = { title: "RPC Health" };

export default function RpcHealthPage() {
  return <RpcHealthClient />;
}
