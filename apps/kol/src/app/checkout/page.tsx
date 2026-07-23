import type { Metadata } from "next";
import { Checkout } from "@/components/checkout";

export const metadata: Metadata = {
  title: "Checkout — KOL",
  description: "Secure checkout for your order of handmade pieces. KOL-owned, demo mode.",
};

export default function CheckoutPage() {
  return <Checkout />;
}
