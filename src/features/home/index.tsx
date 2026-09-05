/**
 * Home Feature — Page Assembly
 * Assembles all home sections in order.
 */

import { HeroSection }             from './components/HeroSection';
import { StatsSection }            from './components/StatsSection';
import { DoctorCard }              from './components/DoctorCard';
import { ServicesList }            from './components/ServicesList';
import { TestimonialsCarousel }    from './components/TestimonialsCarousel';
import { FAQSection }              from './components/FAQSection';

export const HomePage = () => (
  <>
    <HeroSection />
    <StatsSection />
    <DoctorCard />
    <ServicesList />
    <TestimonialsCarousel />
    <FAQSection />
  </>
);
