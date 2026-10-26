import type { Metadata } from "next";
import PolicyDocument from "@/components/PolicyDocument";
import { POLICIES } from "@/lib/policies";

export const metadata: Metadata = { title: POLICIES.seller.title };

export default function Page() {
  return <PolicyDocument policy="seller" file="seller-agreement.md" />;
}
