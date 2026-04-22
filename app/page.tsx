import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import CtaSection from '@/components/CtaSection';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
    </div>
  );
}
