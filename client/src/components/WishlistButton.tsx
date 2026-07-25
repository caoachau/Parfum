import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth.store';
import { useWishlist } from '../store/wishlist.store';

export default function WishlistButton({ productId }: { productId: string }) {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Đồng bộ tên hàm theo đúng store (has, loading, toggle)
  const isFav = useWishlist((s) => s.has(productId));
  const isPending = useWishlist((s) => s.loading);
  const toggle = useWishlist((s) => s.toggle);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (isPending) return;
    try {
      await toggle(productId);
    } catch {
      // handled in store
    }
  };

  return (
    <button
      type="button"
      aria-label={isFav ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
      aria-pressed={isFav}
      onClick={onClick}
      disabled={isPending}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100"
    >
      <span className={isFav ? 'text-rose-600 text-lg' : 'text-slate-400 text-lg'}>
        {isFav ? '♥' : '♡'}
      </span>
    </button>
  );
}
