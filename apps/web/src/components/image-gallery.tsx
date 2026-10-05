import { useState } from "react";

interface ImageGalleryProps {
  images: readonly string[];
  alt: string;
}

/** Main product image with clickable thumbnails. */
export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [selected, setSelected] = useState(0);
  const main = images[selected] ?? images[0];
  if (main === undefined) return <div className="gallery-empty">No image</div>;
  return (
    <div className="gallery">
      <img className="gallery-main" src={main} alt={alt} />
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((src, index) => (
            <button key={src} type="button" aria-pressed={index === selected} onClick={() => setSelected(index)}>
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
