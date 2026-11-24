import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

/* Yellow lightning strike in the background.
   - First strike lands right after the intro screen, then it strikes again every 5 seconds.
   - Between strikes the bolt and its glow keep breathing.
   - The bolt drifts with the page when you scroll.
   Decorative only: it never captures clicks. */

const BOLT = '#FFE600';       // lightning yellow — change this one value to retheme the bolt
const BOLT_CORE = '#FFFBCC';  // hot centre of the bolt
const START = 1.25;           // seconds — right after the 1s intro
const CYCLE = 5;              // seconds between strikes

const MAIN = 'M250 -10 L214 120 L268 142 L190 300 L246 322 L150 520 L204 542 L118 760 L166 778 L92 1010';
const BRANCHES = [
  'M190 300 L122 372 L148 386 L84 472',
  'M204 542 L272 622 L248 634 L302 726'
];

// one full cycle, repeated forever
const loop = (times, extra = {}) => ({ duration: CYCLE, delay: START, repeat: Infinity, ease: 'easeOut', times, ...extra });

function Bolt({ d, from, width }) {
  // `from` = fraction of the cycle at which this segment starts drawing
  const t = [0, from, Math.min(from + .05, .99), 1];
  const draw = { pathLength: [0, 0, 1, 1] };
  return <>
    <motion.path d={d} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={width * 4} filter="url(#np-bolt-glow)" stroke={BOLT}
      initial={{ pathLength: 0 }} animate={draw} transition={loop(t)} />
    <motion.path d={d} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={width} stroke={BOLT_CORE}
      initial={{ pathLength: 0 }} animate={draw} transition={loop(t)} />
  </>;
}

export default function LightningBackdrop() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const drift = useTransform(scrollY, v => -v * .7); // the bolt moves with the page as you scroll

  const layer = { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50, overflow: 'hidden' };
  const glowCss = `radial-gradient(circle, ${BOLT} 0, transparent 66%)`;

  if (reduce) {
    return <div aria-hidden="true" style={layer}>
      <motion.div style={{ y: drift, position: 'absolute', top: '-12%', right: '-6%', width: '60vmin', height: '60vmin', borderRadius: '50%', opacity: .2, background: glowCss }} />
    </div>;
  }

  return <div aria-hidden="true" style={layer}>
    {/* screen flash on every strike */}
    <motion.div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 78% 20%, ${BOLT} 0, transparent 62%)` }}
      initial={{ opacity: 0 }} animate={{ opacity: [0, .32, .05, .2, 0, 0] }} transition={loop([0, .02, .06, .1, .18, 1])} />

    <motion.div style={{ y: drift, position: 'absolute', inset: 0 }}>
      {/* breathing glow */}
      <motion.div style={{ position: 'absolute', top: '-14%', right: '-8%', width: '70vmin', height: '70vmin', borderRadius: '50%', background: glowCss }}
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: [.22, .7, .3, .42, .2, .36, .22], scale: [1, 1.18, 1.08, 1.12, 1, 1.1, 1] }}
        transition={loop([0, .03, .08, .2, .5, .75, 1], { ease: 'easeInOut' })} />

      {/* the bolt: strike → flicker → breathe, then strike again */}
      <motion.svg viewBox="0 0 300 1000" preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', top: 0, right: '5%', width: 'min(38vw, 460px)', height: '100%' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, .45, 1, .85, 1, .3, .46, .2, .12] }}
        transition={loop([0, .016, .05, .08, .11, .14, .22, .5, .84, 1])}>
        <defs><filter id="np-bolt-glow" x="-60%" y="-10%" width="220%" height="120%"><feGaussianBlur stdDeviation="7" /></filter></defs>
        <Bolt d={MAIN} from={.016} width={3} />
        {BRANCHES.map((d, i) => <Bolt key={d} d={d} from={.05 + i * .02} width={2} />)}
      </motion.svg>
    </motion.div>
  </div>;
}
