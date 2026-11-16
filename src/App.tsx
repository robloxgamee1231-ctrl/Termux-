import React, { useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CoreFeaturesGrid } from './components/CoreFeaturesGrid';
import { GatewayArchitecture } from './components/GatewayArchitecture';
import { ModeComparison } from './components/ModeComparison';
import { ModelCatalog } from './components/ModelCatalog';
import { InstallAndDocs } from './components/InstallAndDocs';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  // Smooth in-page scrolling that respects reduced-motion preferences.
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#') return;

      const element = document.querySelector(hash);
      if (!element) return;

      event.preventDefault();
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', hash);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="min-h-screen bg-[#090B0A] text-[#ECF2EE] antialiased selection:bg-[#10E88A]/25 selection:text-[#ECF2EE]">
      <Navbar />
      <main>
        <Hero />
        <CoreFeaturesGrid />
        <GatewayArchitecture />
        <ModeComparison />
        <ModelCatalog />
        <InstallAndDocs />
      </main>
      <Footer />
    </div>
  );
};

export default App;
