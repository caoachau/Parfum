interface HeroProps {
  title?: string;
  subtitle?: string;
  image?: string;
}

export default function Hero({
  title = "Tuyển tập theo mùa",
  subtitle = "Bộ sưu tập trải nghiệm mùi hương được tuyển chọn, từ gỗ khói phương Đông đến sắc cam chanh thanh sạch của Địa Trung Hải.",
  image = "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200",
}: HeroProps) {
  return (
    <section className="max-w-[1536px] mx-auto px-6 lg:px-10 pt-24 pb-16">
      <div className="grid lg:grid-cols-2 gap-20 items-center">
        <div>
          <h1 className="font-heading text-5xl lg:text-7xl xl:text-[88px] leading-none text-[#1C1C19]">
            {title.split(" ")[0]} {title.split(" ")[1]}
            <br />
            {title.split(" ").slice(2).join(" ")}
          </h1>

          <p className="mt-8 max-w-md text-[#666] leading-8">{subtitle}</p>
        </div>

        <div className="overflow-hidden bg-[#F3EEE7] aspect-[16/9]">
          <img loading="lazy" src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      </div>
    </section>
  );
}
