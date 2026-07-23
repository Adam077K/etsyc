import type { Metadata } from "next";
import { Masthead } from "@/components/masthead";
import { SiteFooter } from "@/components/site-footer";
import { Account } from "@/components/account";

export const metadata: Metadata = {
  title: "Your account — KOL",
  description:
    "Your order in progress, the pieces you saved, and the makers you follow. KOL-owned, demo mode.",
};

export default function AccountPage() {
  return (
    <>
      <Masthead variant="solid" active="Account" />
      <Account />
      <SiteFooter />
    </>
  );
}
