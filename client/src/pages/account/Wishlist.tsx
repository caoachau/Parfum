import { useEffect, useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { toast } from "../../store/toast.store";

type WishlistProduct = {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  image?: string | null;
  images?: string[];
};

const PLACEHOLDER = "https://placehold.co/400x500?text=Chua+co+anh";

export default function Wishlist() {
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api
      .get<WishlistProduct[]>("/account/wishlist")
      .then(({ data }) => {
        if (mounted) setProducts(data);
      })
      .catch(() => {
        if (mounted) setProducts([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function remove(productId: string) {
    try {
      const { data } = await api.delete<WishlistProduct[]>(`/account/wishlist/${productId}`);
      setProducts(data);
      toast.success("Đã xóa khỏi danh sách yêu thích");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể xóa khỏi danh sách yêu thích");
    }
  }

  return (
    <div className="min-h-screen bg-[#FCF9F4] text-[#2D2925]">
      <section className="border-b border-[#E7E0D7] px-6 pb-7 pt-12 lg:px-12">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#9B9288]">
          Cổng thông tin cá nhân
        </p>

        <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Danh sách yêu thích</h1>
      </section>

      <main className="px-6 py-10 lg:px-12">
        {loading ? (
          <p className="text-sm text-[#7C746C]">Đang tải danh sách yêu thích...</p>
        ) : products.length === 0 ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center border border-[#E2DBD2] bg-[#FFFDF9] text-center">
            <Heart size={38} className="text-[#8B7200]" />
            <h2 className="mt-5 font-serif text-3xl">Danh sách yêu thích trống</h2>
            <p className="mt-2 max-w-md text-sm text-[#7C746C]">
              Những sản phẩm bạn yêu thích sẽ xuất hiện tại đây.
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-flex items-center gap-2 border border-[#8B7200] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6F5C00] transition hover:bg-[#8B7200] hover:text-white"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const image = product.images?.[0] || product.image || PLACEHOLDER;
              const href = `/products/${product.slug || product.id}`;

              return (
                <article
                  key={product.id}
                  className="group border border-[#E2DBD2] bg-[#FFFDF9] transition hover:border-[#C9B77A]"
                >
                  <Link to={href} className="block overflow-hidden">
                    <img
                      loading="lazy"
                      src={image}
                      alt={product.name}
                      className="aspect-[4/5] w-full bg-[#F0ECE7] object-cover transition duration-700 group-hover:scale-[1.04]"
                      onError={(event) => {
                        event.currentTarget.src = PLACEHOLDER;
                      }}
                    />
                  </Link>

                  <div className="p-5">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-[#9A7D00]">
                      {product.brand || product.category || "Nước hoa"}
                    </p>
                    <Link to={href}>
                      <h2 className="mt-2 font-serif text-xl transition hover:text-[#8B7200]">
                        {product.name}
                      </h2>
                    </Link>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6F6861]">
                      {product.description || "Mùi hương tinh tế, sang trọng."}
                    </p>

                    <div className="mt-5 flex items-center justify-between">
                      <Link
                        to={href}
                        className="inline-flex items-center gap-1 border-b border-[#A8944B] pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6F5C00] transition hover:text-[#8B7200]"
                      >
                        Xem chi tiết
                      </Link>

                      <button
                        type="button"
                        onClick={() => remove(product.id)}
                        className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-[#8D8379] transition hover:text-red-700"
                      >
                        <Trash2 size={13} />
                        Xóa
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
