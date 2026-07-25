import SearchBox from "./SearchBox";
import BrandFilter from "./BrandFilter";
import GenderFilter from "./GenderFilter";
import PriceFilter from "./PriceFilter";
import ScentFilter from "./ScentFilter";
import SizeFilter from "./SizeFilter";
import OccasionFilter from "./OccasionFilter";
import ConcentrationFilter from "./ConcentrationFilter";
import NoteFilter from "./NoteFilter";

interface Props {
  scents: string[];
  selectedSizes: string[];
  sizes: string[];
  toggleSize: (size: string) => void;

  selectedOccasions: string[];
  occasions: string[];
  toggleOccasion: (item: string) => void;

  selectedConcentrations: string[];
  concentrations: string[];
  toggleConcentration: (item: string) => void;
  selectedScents: string[];
  toggleScent: (value: string) => void;
  notes: string[];
  selectedNotes: string[];
  toggleNote: (value: string) => void;
  search: string;
  setSearch: (v: string) => void;

  brands: string[];
  selectedBrands: string[];
  toggleBrand: (brand: string) => void;

  genders: string[];
  selectedGenders: string[];
  toggleGender: (gender: string) => void;
  clearGender: () => void;

  priceMin: number;
  priceMax: number;
  minPrice: number;
  maxPrice: number;
  setPriceRange: (min: number, max: number) => void;

  brandCounts?: Record<string, number>;
  priceBuckets?: number[];
  noteCounts?: Record<string, number>;
}

// Anh banner o sidebar - THAY ANH CUA BAN TAI DAY
const SIDEBAR_IMAGE = "/images/shop/sidebar-banner.jpg";
const SIDEBAR_IMAGE_FALLBACK =
  "https://placehold.co/500x680/1C1C19/E8E3D8?text=Your+Image+Here";

export default function ShopSidebar(props: Props) {
  return (
    <aside className="w-full shrink-0 self-start lg:sticky lg:top-28 lg:w-64">
      <SearchBox value={props.search} onChange={props.setSearch} />

      <BrandFilter
        brands={props.brands}
        counts={props.brandCounts}
        selected={props.selectedBrands}
        onToggle={props.toggleBrand}
      />

      <GenderFilter
        genders={props.genders}
        selected={props.selectedGenders}
        onToggle={props.toggleGender}
        onClear={props.clearGender}
      />

      <PriceFilter
        min={props.minPrice}
        max={props.maxPrice || 500}
        valueMin={props.priceMin}
        valueMax={props.priceMax}
        buckets={props.priceBuckets}
        onChange={props.setPriceRange}
      />

      {/* Scent */}
      <ScentFilter
        scents={props.scents}
        selected={props.selectedScents}
        onToggle={props.toggleScent}
        initialVisible={8}
      />

      <NoteFilter
        notes={props.notes}
        selected={props.selectedNotes}
        onToggle={props.toggleNote}
        counts={props.noteCounts}
      />

      {/* Size */}
      <SizeFilter
        sizes={props.sizes}
        selected={props.selectedSizes}
        onToggle={props.toggleSize}
      />
      {/* Occasion */}
      <OccasionFilter
        occasions={props.occasions}
        selected={props.selectedOccasions}
        onToggle={props.toggleOccasion}
      />
      <ConcentrationFilter
        concentrations={props.concentrations}
        selected={props.selectedConcentrations}
        onToggle={props.toggleConcentration}
      />

      {/* =========================================================
          SECTION ANH TUY CHINH - chen anh cua ban vao day.
          Doi bien SIDEBAR_IMAGE o tren, hoac thay src ben duoi.
          ========================================================= */}
            <div className="mt-10 border-t border-[#e8deca] pt-8">
        <h3 className="uppercase tracking-[2px] text-[11px] font-semibold text-[#735C00] mb-4">
          
        </h3>
        <div className="relative overflow-hidden rounded-sm bg-[#EFECE7]">
          <video
            src="https://res.cloudinary.com/dwj2trmn0/video/upload/v1784863574/video_kh%C3%A1c_li%C3%AAn_quan_%C4%91%E1%BA%BFn_ch%E1%BB%A7_y95cmx.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="aspect-[3/4] w-full object-cover"
          />
        </div>
      </div>
    </aside>
  );
}
