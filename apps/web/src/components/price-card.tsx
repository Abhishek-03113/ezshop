import { availabilityTone, type ProductSnapshot, formatCaptureTime } from "@ezshop/catalog";
import { PriceBlock } from "./price-block.tsx";

type PriceCardSnapshot = Pick<ProductSnapshot, "price" | "listPrice" | "availability" | "capturedAt">;

/** Price, stock state and the capture-time caveat; every part tolerates missing data. */
export function PriceCard({ snapshot }: { snapshot: PriceCardSnapshot }) {
  return (
    <div className="card price-card">
      <PriceBlock price={snapshot.price} listPrice={snapshot.listPrice} />
      {snapshot.availability !== null && (
        <span className="availability">
          <span className={`availability-dot ${availabilityTone(snapshot.availability)}`} aria-hidden="true" />
          <strong>{snapshot.availability}</strong>
        </span>
      )}
      <span className="price-card-note">
        {`Captured ${formatCaptureTime(snapshot.capturedAt)} · Prices change often — capture again to refresh.`}
      </span>
    </div>
  );
}
