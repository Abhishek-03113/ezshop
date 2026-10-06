import type { CatalogComparisonDetail, CatalogComparisonSummary } from "@picky/catalog";
import { describe, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { comparisonQueryKeys, forgetDeletedComparison } from "../src/api/comparison-queries.ts";

const summary = (id: string): CatalogComparisonSummary => ({ id, name: id, productIds: [], updatedAt: "u" });
const detail = (id: string): CatalogComparisonDetail => ({ id, name: id, products: [], updatedAt: "u" });

describe("forgetDeletedComparison", () => {
  // Regression: a deleted comparison's detail query was refetched after delete and its 404 took over the page.
  test("drops the comparison from the list and removes its detail query, leaving others alone", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(comparisonQueryKeys.list, [summary("c1"), summary("c2")]);
    queryClient.setQueryData(comparisonQueryKeys.detail("c1"), detail("c1"));
    queryClient.setQueryData(comparisonQueryKeys.detail("c2"), detail("c2"));

    forgetDeletedComparison(queryClient, "c1");

    expect(queryClient.getQueryData<CatalogComparisonSummary[]>(comparisonQueryKeys.list)).toEqual([summary("c2")]);
    expect(queryClient.getQueryState(comparisonQueryKeys.detail("c1"))).toBeUndefined();
    expect(queryClient.getQueryData<CatalogComparisonDetail>(comparisonQueryKeys.detail("c2"))).toEqual(detail("c2"));
  });

  test("leaves an unloaded list unloaded", () => {
    const queryClient = new QueryClient();
    forgetDeletedComparison(queryClient, "c1");
    expect(queryClient.getQueryData(comparisonQueryKeys.list)).toBeUndefined();
  });
});
