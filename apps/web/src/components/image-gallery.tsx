import { useState } from "react";
import { BoxIcon } from "./icons.tsx";

interface ImageGalleryProps {
  images: readonly string[];
  alt: string;
}

function Thumbnails({
  images,
  selected,
  onSelect,
}: {
  images: readonly string[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div role="group" aria-label="Product images" className="gallery-thumbs">
      {images.map((src, index) => (
        <button
          key={src}
          type="button"
          aria-label={`Image ${index + 1}`}
          aria-pressed={index === selected}
          onClick={() => onSelect(index)}
        >
          <img src={src} alt="" loading="lazy" />
        </button>
      ))}
    </div>
  );
}

/** Main product image with thumbnail buttons that switch it. */
export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [selected, setSelected] = useState(0);
  const main = images[selected] ?? images[0];
  if (main === undefined) {
    return (
      <div className="gallery">
        <div className="gallery-main gallery-empty" role="img" aria-label="No product image">
          <BoxIcon size={120} />
        </div>
      </div>
    );
  }
  return (
    <div className="gallery">
      <div className="gallery-main">
        <img src={main} alt={alt} />
      </div>
      {images.length > 1 && <Thumbnails images={images} selected={selected} onSelect={setSelected} />}
    </div>
  );
}
