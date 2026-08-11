import { useEffect } from 'react';
import { startSmoothScroll, ScrollTrigger } from './lib/motion';
import Curtain from './components/Curtain';
import SiteNav from './components/SiteNav';
import Hero from './sections/Hero';
import Marquee from './sections/Marquee';
import Manifesto from './sections/Manifesto';
import Services from './sections/Services';
import Work from './sections/Work';
import Process from './sections/Process';
import Why from './sections/Why';
import Audience from './sections/Audience';
import Contact from './sections/Contact';
import Footer from './sections/Footer';

export default function App() {
  useEffect(() => {
    const stop = startSmoothScroll();
    // Sections mount with fonts still swapping and a canvas still sizing, both
    // of which change the page height. One refresh after that settles keeps
    // every pin's start and end where it belongs.
    const settle = setTimeout(() => ScrollTrigger.refresh(), 900);
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    return () => {
      clearTimeout(settle);
      window.removeEventListener('load', onLoad);
      stop();
    };
  }, []);

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Curtain />
      <div className="grain" aria-hidden="true" />
      <SiteNav />

      {/* Pacing: heavy and calm alternate the whole way down. Hero pin (heavy),
          marquee (calm), manifesto (calm), services wipe (heavy), work
          (moderate), process draw (moderate), why and audience (calm), contact
          (moderate), footer (calm). No two pinned sections touch. */}
      <main id="main">
        <Hero />
        <Marquee />
        <Manifesto />
        <Services />
        <Work />
        <Process />

        <div className="region-paper">
          <Why />
          <Audience />
        </div>

        <Contact />
      </main>

      <Footer />
    </>
  );
}
