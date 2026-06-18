import type { Metadata } from "next";
import { DemoLabClient } from "./DemoLabClient";

export const metadata: Metadata = { title: "Demo Lab" };

export default function DemoLabPage() {
  return <DemoLabClient />;
}
