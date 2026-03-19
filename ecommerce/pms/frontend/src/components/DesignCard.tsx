import { useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge, TypeBadge } from "./StatusBadge.tsx";
import { swatchUrl, type Design } from "../lib/api.ts";

interface DesignCardProps {
  design: Design;
}

export function DesignCard({ design }: DesignCardProps) {
  const [imgError, setImgError] = useState(false);
  const firstVariant = design.variants[0];
  const imgUrl = swatchUrl(firstVariant?.swatch);
  const shopifyStatus = design.shopify.product_id ? design.shopify.status : "MISSING";

  return (
    <Link to={`/design/${design.id}`} className="design-card">
      <div className="design-card-image">
        {imgUrl && !imgError ? (
          <img
            src={imgUrl}
            alt={`${design.design} swatch`}
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="design-card-no-image">
            <span>Görsel yok</span>
          </div>
        )}
      </div>

      <div className="design-card-body">
        <div className="design-card-header">
          <span className="design-card-name">{design.design}</span>
          <TypeBadge type={design.curtain_type} />
        </div>

        <div className="design-card-meta">
          <span className="design-card-price">{design.price} TL/m</span>
          <StatusBadge status={shopifyStatus} />
        </div>

        <div className="design-card-footer">
          <span className="design-card-variants">
            {design.variants.length} renk
          </span>
          <span className="design-card-width">{design.width_cm} cm en</span>
        </div>
      </div>
    </Link>
  );
}
