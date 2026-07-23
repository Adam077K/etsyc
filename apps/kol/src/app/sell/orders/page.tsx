/**
 * SELL / ORDERS — fulfilment from the maker's side.
 *
 * MODE: Operate — the mirror of the buyer's maker-voice order status. Each order
 *   is work-to-do in the maker's own words; the status she sets here is literally
 *   what her buyer reads on their order page (the connection is made visible).
 * STORY: Lena sees the £137 carafe-and-wrap order as "glaze & pack the carafe,
 *   promised by Aug 14", sets where it's at, and sees her words travel to the
 *   buyer. KOL's fixed chrome; maker brand stays out of the queue.
 * STATES: new · in-progress (making) · shipped per order · empty (?state=empty —
 *   "The kiln rests today.") · loading · error (?state=error).
 */

import { SellWorkspaceNav } from "@/components/sell-workspace-nav";
import { SellOrders } from "@/components/sell-orders";

export default function SellOrdersPage() {
  return (
    <>
      <SellWorkspaceNav active="orders" />
      <main className="min-h-screen bg-ink">
        <SellOrders />
      </main>
    </>
  );
}
