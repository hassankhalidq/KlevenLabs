import Curtain from './components/Curtain';
import SiteNav from './components/SiteNav';
import Hero from './sections/Hero';
import Manifesto from './sections/Manifesto';
import Services from './sections/Services';
import Work from './sections/Work';
import Process from './sections/Process';
import Why from './sections/Why';
import Audience from './sections/Audience';
import Contact from './sections/Contact';
import Footer from './sections/Footer';

export default function App() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Curtain />
      <div className="grain" aria-hidden="true" />
      <SiteNav />

      <main id="main">
        <Hero />
        <Manifesto />
        <Services />
        <Work />
        <Process />

        {/* The page is dark. This is the single deliberate colour-block flip
            the brief asks for, and it flips back once, rather than alternating
            light and dark down the page. */}
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
