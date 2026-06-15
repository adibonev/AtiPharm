export type ProductType =
  | "otc_drug"
  | "supplement"
  | "cosmetic"
  | "medical_device"
  | "other";

export type PriceUnit = "per_pack" | "per_piece";

/** A product as it appears on a brochure card (issue-specific pricing folded in). */
export interface CardProduct {
  name: string;
  sub?: string;
  img: string;
  type: ProductType;
  oldEur?: number;
  newEur?: number;
  percentOnly?: boolean;
  percent?: number;
}

export interface FeaturedProduct extends CardProduct {
  tag?: string;
  unitNote?: string;
}

export interface IssueData {
  no: string;
  period: string;
  slogan: string;
  contacts: {
    address: string;
    phone: string;
    facebook: string;
    hours: string;
  };
}
