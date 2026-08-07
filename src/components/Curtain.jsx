import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * Load curtain. Purpose: state transition. It hides the first paint of the
 * canvas and the font swap, both of which are ugly for ~200ms.
 *
 * It never gates content. The page renders underneath immediately and the
 * panel lifts off it, so perceived load is not delayed. Waits on fonts but
 * with a hard 700ms cap, so a slow font fetch cannot hold the page hostage.
 */
export default function Curtain() {
  const [lifted, setLifted] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      setLifted(true);
      return undefined;
    }
    let done = false;
    const lift = () => {
      if (!done) {
        done = true;
        setLifted(true);
      }
    };
    const cap = setTimeout(lift, 700);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => setTimeout(lift, 90));
    } else {
      lift();
    }
    return () => clearTimeout(cap);
  }, [reduce]);

  return (
    <AnimatePresence>
      {!lifted && (
        <motion.div
          className="curtain"
          initial={{ transform: 'translateY(0%)' }}
          exit={{ transform: 'translateY(-100%)' }}
          transition={{ duration: 0.62, ease: [0.77, 0, 0.175, 1] }}
          aria-hidden="true"
        >
          <span className="curtain-mark mono">Klevon Labs</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
