import HeroSection from "../components/Hero";
import { useSeo } from "../hooks/useSeo";
import BrandSection from "../components/BrandSection";
import FeaturedProducts from "../components/FeaturedProducts";
import SeasonSection from "../components/SeasonSection";
import BannerSection from "../components/Banner";
import WhyChoose from "../components/WhyChoose";
import Newsletter from "../components/Newsletter";
import Footer from "../components/Footer";

export default function Home() {
  useSeo({
    title: "L'Essence Noire | Nước hoa cao cấp chính hãng",
    description:
      "Khám phá bộ sưu tập nước hoa cao cấp chính hãng tại L'Essence Noire — mùi hương niệm, thiết kế và các thương hiệu tuyển chọn.",
  });
  return (
    <>
      <HeroSection />

      <BrandSection />

      <FeaturedProducts />

      <SeasonSection />

      <BannerSection />

      <WhyChoose />

      <Newsletter />

      <Footer />
    </>
  );
}
