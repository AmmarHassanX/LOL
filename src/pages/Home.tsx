import Hero from '@/components/home/Hero';
import DeliveryRibbon from '@/components/home/DeliveryRibbon';
import CategoryGrid from '@/components/home/CategoryGrid';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import DeliveryNetwork from '@/components/home/DeliveryNetwork';
import HowItWorks from '@/components/home/HowItWorks';
import BrandMarquee from '@/components/home/BrandMarquee';
import Testimonials from '@/components/home/Testimonials';
import MissionStrip from '@/components/home/MissionStrip';

export default function Home() {
  return (
    <>
      <Hero />
      <DeliveryRibbon />
      <CategoryGrid />
      <FeaturedProducts />
      <DeliveryNetwork />
      <HowItWorks />
      <BrandMarquee />
      <Testimonials />
      <MissionStrip />
      {/* Section 10 — shared CTA band + Footer rendered by Layout */}
    </>
  );
}
