import type { Money } from "@ezshop/catalog";
import { discountPercent, formatMoney } from "../format/format-money.ts";

interface PriceBlockProps {
  price: Money | null;
  listPrice: Money | null;
}

/** Selling price, with the struck-through M.R.P. and discount only when there is one. */
export function PriceBlock({ price, listPrice }: PriceBlockProps) {
  if (price === null) return <p className="price-missing">Price not shown on the page</p>;
  const discount = discountPercent(price, listPrice);
  return (
    <div className="price-block">
      <span className="price">{formatMoney(price)}</span>
      {discount !== null && listPrice !== null && (
        <>
          <s className="list-price">M.R.P. {formatMoney(listPrice)}</s>
          <span className="discount">−{discount}%</span>
        </>
      )}
    </div>
  );
}
