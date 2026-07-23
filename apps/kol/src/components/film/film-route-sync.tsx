"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useFilm } from "./film-context";

/** Buyer surfaces that carry the continuous film. Everything else clears it. */
const FILM_ROUTE = /^\/(m\/|checkout|thank-you)/;

/**
 * FilmRouteSync — mounted once in the app shell. When the pathname leaves the
 * film-bearing routes (back to the feed, browse, journal, sell, account…), it
 * retires the persistent film. On film routes it does nothing; the route
 * component owns what plays there. Keeping this central means non-film pages
 * never have to know the film layer exists.
 */
export function FilmRouteSync() {
  const pathname = usePathname();
  const { clear } = useFilm();
  useEffect(() => {
    if (!FILM_ROUTE.test(pathname ?? "")) clear();
  }, [pathname, clear]);
  return null;
}
