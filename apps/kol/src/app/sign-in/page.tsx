import type { Metadata } from "next";
import { SignIn } from "@/components/sign-in";

export const metadata: Metadata = {
  title: "Sign in — KOL",
  description:
    "Come in. No passwords — we send a signed note. KOL-owned, demo mode: no real authentication.",
};

export default function SignInPage() {
  return <SignIn />;
}
