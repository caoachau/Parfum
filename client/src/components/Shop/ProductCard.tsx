import ProductCardBase, { ProductCardBaseData } from "../ProductCardBase";

interface ProductCardProps {
  product: ProductCardBaseData;
}

export default function ProductCard({ product }: ProductCardProps) {
  return <ProductCardBase product={product} cartMode="hover" showDescription />;
}
