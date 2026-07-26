import ProductCard from "./ProductCard";

interface Product {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price?: number | null;
  priceText?: string;
  image?: string | null;
  brand?: string;
  images?: string[];
  slug?: string;
  variantId?: string | null;
  volume?: string;
  sizes?: string[];
  stock?: number;
  variants?: {
    variantId?: string | null;
    size?: string;
    volume?: string;
    price?: number | null;
    stock?: number;
  }[];
}

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
}

export default function ProductGrid({ products, loading = false }: ProductGridProps) {
  if (loading) {
    return (
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-4 lg:grid-cols-4 lg:gap-6 xl:gap-8">
        {Array.from({ length: 16 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="aspect-[4/5] rounded bg-gray-200" />
            <div className="mt-5 h-6 rounded bg-gray-200" />
            <div className="mt-3 h-4 rounded bg-gray-200" />
            <div className="mt-2 h-4 w-2/3 rounded bg-gray-200" />
            <div className="mt-5 h-5 w-1/3 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-3xl font-semibold">Không tìm thấy sản phẩm</h2>
        <p className="mt-3 text-gray-500">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-4 lg:grid-cols-4 lg:gap-6 xl:gap-8">
      {products.map((product) => (
        <ProductCard key={product._id || product.id} product={product} />
      ))}
    </div>
  );
}
