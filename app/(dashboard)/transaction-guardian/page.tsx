import type { Metadata } from "next";
import { TransactionGuardianClient } from "./TransactionGuardianClient";

export const metadata: Metadata = { title: "Transaction Guardian" };

export default function TransactionGuardianPage() {
  return <TransactionGuardianClient />;
}
