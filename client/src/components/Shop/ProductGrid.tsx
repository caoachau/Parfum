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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-10">
        {Array.from({ length: 16 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="aspect-[4/5] bg-gray-200 rounded" />

            <div className="h-6 bg-gray-200 rounded mt-5" />

            <div className="h-4 bg-gray-200 rounded mt-3" />

            <div className="h-4 bg-gray-200 rounded mt-2 w-2/3" />

            <div className="h-5 bg-gray-200 rounded mt-5 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-3xl font-semibold">Không tìm thấy sản phẩm</h2>

        <p className="text-gray-500 mt-3">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-10">
      {products.map((product) => (
        <ProductCard key={product._id || product.id} product={product} />
      ))}
    </div>
  );
}
