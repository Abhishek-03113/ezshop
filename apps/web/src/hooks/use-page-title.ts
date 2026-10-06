import { useEffect } from "react";
import { pageTitle } from "../format/page-title.ts";

/** Sets the browser-tab title while the calling page is mounted. */
export function usePageTitle(pageName: string): void {
  useEffect(() => {
    document.title = pageTitle(pageName);
  }, [pageName]);
}
