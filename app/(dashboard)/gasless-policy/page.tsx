import type { Metadata } from "next";
import { GaslessPolicyClient } from "./GaslessPolicyClient";

export const metadata: Metadata = { title: "Gasless Policy" };

export default function GaslessPolicyPage() {
  return <GaslessPolicyClient />;
}
