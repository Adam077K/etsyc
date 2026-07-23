import type { Metadata } from "next";
import { ThankYou } from "@/components/thank-you";

export const metadata: Metadata = {
  title: "Thank you — KOL",
  description: "Your order is being made. A personal note from the makers, and your order summary.",
};

export default function ThankYouPage() {
  return <ThankYou />;
}
