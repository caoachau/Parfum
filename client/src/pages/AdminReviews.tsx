import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { toast } from "../store/toast.store";

type AdminReview = {
  id: string;
  productName?: string;
  userName: string;
  rating: number;
  comment: string;
  images: string[];
  approved: boolean;
  createdAt?: string;
};

export default function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");

  async function loadReviews(nextStatus = status) {
    try {
      setLoading(true);
      const { data } = await api.get<AdminReview[]>("/reviews/admin", {
        params: { status: nextStatus },
      });
      setReviews(data);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Không tải được review admin");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews(status);
  }, [status]);

  async function setApproval(reviewId: string, approved: boolean) {
    try {
      await api.patch(`/reviews/admin/${reviewId}/${approved ? "approve" : "reject"}`);
      toast.success(approved ? "Đã duyệt review" : "Đã ẩn review");
      loadReviews();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Không cập nhật được review");
    }
  }

  return (
    <main className="min-h-screen bg-[#faf7f2] px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <p className="text-[10px] uppercase tracking-[3px] text-[#8b7100]">Admin</p>
        <h1 className="mt-3 font-serif text-4xl">Duyệt review sản phẩm</h1>

        <div className="mt-8 flex gap-3">
          {["pending", "approved", "all"].map((item) => (
            <button
              key={item}
              onClick={() => setStatus(item)}
              className={`border px-4 py-2 text-xs uppercase tracking-[2px] ${
                status === item ? "border-[#8b7100] bg-[#8b7100] text-white" : "border-[#d9d4cb]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-5">
          {loading ? (
            <p>Đang tải review...</p>
          ) : reviews.length === 0 ? (
            <p className="text-[#6e6a63]">Không có review nào.</p>
          ) : (
            reviews.map((review) => (
              <article key={review.id} className="border border-[#e4ddd2] bg-white p-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row">
                  <div>
                    <p className="text-xs uppercase tracking-[2px] text-[#8b7100]">
                      {review.productName || "Sản phẩm"}
                    </p>
                    <h2 className="mt-2 font-serif text-2xl">{review.userName}</h2>
                    <p className="mt-2 text-[#8b7100]">{"★".repeat(review.rating)}</p>
                  </div>
                  <span className="h-fit bg-[#f3efe8] px-3 py-1 text-xs uppercase">
                    {review.approved ? "Approved" : "Pending"}
                  </span>
                </div>

                <p className="mt-5 text-sm leading-7 text-[#4a463f]">{review.comment}</p>

                {review.images.length > 0 && (
                  <div className="mt-5 flex gap-3">
                    {review.images.map((image) => (
                      <img
                        loading="lazy"
                        key={image}
                        src={image}
                        alt="Review"
                        className="h-24 w-24 object-cover"
                      />
                    ))}
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setApproval(review.id, true)}
                    className="bg-[#8b7100] px-5 py-2 text-xs uppercase tracking-[2px] text-white"
                  >
                    Duyệt
                  </button>
                  <button
                    onClick={() => setApproval(review.id, false)}
                    className="border border-[#d9d4cb] px-5 py-2 text-xs uppercase tracking-[2px]"
                  >
                    Ẩn
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
