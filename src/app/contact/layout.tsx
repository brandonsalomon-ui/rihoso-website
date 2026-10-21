import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Rhode Island Horological Society about membership, events, or sponsorship.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
