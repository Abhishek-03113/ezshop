import type { Money } from "@ezshop/catalog";
import { discountPercent, formatMoney, savingsAmount } from "../format/format-money.ts";

interface PriceBlockProps {
  price: Money | null;
  listPrice: Money | null;
}

/** Selling price, with the struck-through M.R.P. and "N% off · save ₹X" chip only when there is a real discount. */
export function PriceBlock({ price, listPrice }: PriceBlockProps) {
  if (price === null) return <p className="price-missing">Price not shown on the page</p>;
  const discount = discountPercent(price, listPrice);
  const savings = savingsAmount(price, listPrice);
  return (
    <span className="price-block">
      <span className="price">{formatMoney(price)}</span>
      {listPrice !== null && discount !== null && savings !== null && (
        <>
          <span className="list-price">
            M.R.P. <s>{formatMoney(listPrice)}</s>
          </span>
          <span className="discount-chip">{`${discount}% off · save ${formatMoney(savings)}`}</span>
        </>
      )}
    </span>
  );
}
