import { AnimatePresence, motion } from 'framer-motion'
import { springs } from './lib/theme'
import './styles/globals.css'

/**
 * App.tsx — Root layout shell (Phase 1)
 * Three-panel system: Sidebar | Chat | Artifact
 * Panels are stubbed here; populated in Phase 2+
 */
export default function App() {
  return (
    <div className="mesh-bg" style={{ display: 'flex', width: '100dvw', height: '100dvh', overflow: 'hidden', position: 'relative' }}>

      {/* ── Sidebar stub ──────────────────────────── */}
      <motion.aside
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ ...springs.smooth, delay: 0.05 }}
        style={{
          width: 280,
          minWidth: 280,
          height: '100%',
          background: 'var(--color-surface)',
          borderRight: '1.5px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 20,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1.5px solid var(--color-border)' }}>
          <span
            className="font-display"
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--color-neon-lime)',
            }}
          >
            ink.ai
          </span>
          <span style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
            v0.1 — foundation
          </span>
        </div>

        {/* Placeholder content */}
        <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkeletonRow width="90%" />
          <SkeletonRow width="75%" />
          <SkeletonRow width="85%" />
          <SkeletonRow width="60%" />
          <SkeletonRow width="80%" />
        </div>
      </motion.aside>

      {/* ── Main chat area stub ───────────────────── */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...springs.smooth, delay: 0.15 }}
        style={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Design kitchen sink — Phase 1 preview */}
        <DesignKitchenSink />
      </motion.main>

      {/* ── AnimatePresence for artifact panel ───── */}
      <AnimatePresence>
        {/* Artifact panel will render here in Phase 5 */}
      </AnimatePresence>
    </div>
  )
}

/* ── Internal: Skeleton row placeholder ─────────────── */
function SkeletonRow({ width }: { width: string }) {
  return (
    <div
      className="animate-shimmer"
      style={{
        height: 36,
        width,
        borderRadius: 'var(--radius-sm)',
      }}
    />
  )
}

/* ── Design Kitchen Sink ─────────────────────────────── */
function DesignKitchenSink() {
  const neonColors = [
    { name: 'Neon Lime', value: '#C8FF00', var: '--color-neon-lime' },
    { name: 'Coral',     value: '#FF4F5E', var: '--color-coral' },
    { name: 'Sky Blue',  value: '#4FC3F7', var: '--color-blue' },
    { name: 'Violet',    value: '#B57BFF', var: '--color-violet' },
    { name: 'Amber',     value: '#FFB547', var: '--color-amber' },
  ]

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '40px 48px' }}>

      {/* Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...springs.smooth, delay: 0.2 }}
        style={{ marginBottom: 56 }}
      >
        <div
          className="font-display"
          style={{
            fontSize: 11,
            letterSpacing: '0.15em',
            color: 'var(--color-muted)',
            textTransform: 'uppercase',
            marginBottom: 12,
            fontFamily: 'var(--font-mono)',
          }}
        >
          Phase 1 — Design System
        </div>
        <h1
          className="font-display"
          style={{
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            background: 'linear-gradient(135deg, #F0F0F8 0%, #8888A0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Ink + Neon
        </h1>
        <p style={{ marginTop: 12, color: 'var(--color-muted)', maxWidth: 480, lineHeight: 1.7 }}>
          Design tokens, typography, color palette, and animation primitives.
          The foundation everything else is built on.
        </p>
      </motion.div>

      {/* Color palette */}
      <Section title="Color Palette" delay={0.25}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {/* BG colors */}
          {[
            { name: 'Background',  value: '#0D0D12' },
            { name: 'Surface',     value: '#14141C' },
            { name: 'Surface 2',   value: '#1A1A26' },
            { name: 'Border',      value: '#2A2A3A' },
            { name: 'Border 2',    value: '#3A3A52' },
          ].map((c) => (
            <ColorSwatch key={c.name} {...c} />
          ))}
          {neonColors.map((c) => (
            <ColorSwatch key={c.name} name={c.name} value={c.value} neon />
          ))}
          {[
            { name: 'Text',        value: '#F0F0F8' },
            { name: 'Muted',       value: '#8888A0' },
            { name: 'Faint',       value: '#4A4A60' },
          ].map((c) => (
            <ColorSwatch key={c.name} {...c} />
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography" delay={0.3}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Clash Display — Display
            </div>
            {[
              { size: 48, weight: 700, label: 'H1 — 48px / 700' },
              { size: 32, weight: 700, label: 'H2 — 32px / 700' },
              { size: 24, weight: 600, label: 'H3 — 24px / 600' },
              { size: 18, weight: 500, label: 'H4 — 18px / 500' },
            ].map((t) => (
              <div
                key={t.label}
                className="font-display"
                style={{ fontSize: t.size, fontWeight: t.weight, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: 8 }}
              >
                The quick brown fox
                <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-muted)', marginLeft: 16, fontFamily: 'var(--font-mono)' }}>
                  {t.label}
                </span>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              DM Mono — Body / Code
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--color-text)', maxWidth: 560 }}>
              A cartoonish, vibrant, ultra-smooth AI chat app that feels alive.
              Think: neon candy colors on inky dark backgrounds, wobbly bubble
              animations, playful yet powerful.{' '}
              <code style={{ color: 'var(--color-neon-lime)', background: 'rgba(200,255,0,0.08)', padding: '1px 6px', borderRadius: 4 }}>
                inline code
              </code>
            </p>
          </div>
        </div>
      </Section>

      {/* Neon glows */}
      <Section title="Glow Effects" delay={0.35}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {neonColors.map((c) => (
            <div
              key={c.name}
              style={{
                padding: '16px 28px',
                borderRadius: 'var(--radius-card)',
                border: `2px solid ${c.value}`,
                boxShadow: `0 0 20px ${c.value}55, 0 0 60px ${c.value}22`,
                color: c.value,
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {c.name}
            </div>
          ))}
        </div>
      </Section>

      {/* Animations */}
      <Section title="Animation Primitives" delay={0.4}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Bounce dots */}
          <AnimCard label="Bounce Dots (loading)">
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="animate-bounce-dot"
                  style={{
                    width: 8, height: 8,
                    borderRadius: '50%',
                    background: 'var(--color-neon-lime)',
                    animationDelay: `${i * 0.16}s`,
                  }}
                />
              ))}
            </div>
          </AnimCard>

          {/* Shimmer */}
          <AnimCard label="Shimmer (skeleton)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 160 }}>
              <div className="animate-shimmer" style={{ height: 12, borderRadius: 4 }} />
              <div className="animate-shimmer" style={{ height: 12, borderRadius: 4, width: '80%' }} />
              <div className="animate-shimmer" style={{ height: 12, borderRadius: 4, width: '60%' }} />
            </div>
          </AnimCard>

          {/* Cursor blink */}
          <AnimCard label="Cursor Blink (streaming)">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--color-text)' }}>
              Hello world
              <span
                className="animate-cursor-blink"
                style={{ display: 'inline-block', width: 10, height: 20, background: 'var(--color-neon-lime)', marginLeft: 2, verticalAlign: 'text-bottom' }}
              />
            </span>
          </AnimCard>

          {/* Brain pulse */}
          <AnimCard label="Brain Pulse (thinking)">
            <div
              className="animate-brain-pulse"
              style={{
                width: 40, height: 40,
                borderRadius: '50%',
                background: 'radial-gradient(circle, var(--color-violet) 0%, rgba(181,123,255,0.2) 100%)',
                border: '2px solid var(--color-violet)',
              }}
            />
          </AnimCard>

          {/* Float */}
          <AnimCard label="Float (orbs)">
            <div
              className="animate-float"
              style={{
                width: 48, height: 48,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, var(--color-blue), rgba(79,195,247,0.3))',
                border: '1.5px solid var(--color-blue)',
                boxShadow: '0 0 20px rgba(79,195,247,0.4)',
              }}
            />
          </AnimCard>

          {/* Spin slow */}
          <AnimCard label="Spin Slow (gear)">
            <div
              className="animate-spin-slow"
              style={{
                width: 36, height: 36,
                border: '2.5px solid var(--color-coral)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                boxShadow: '0 0 12px rgba(255,79,94,0.5)',
              }}
            />
          </AnimCard>

        </div>
      </Section>

      {/* Framer Motion spring demos */}
      <Section title="Spring Physics (Framer Motion)" delay={0.45}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Bouncy', preset: springs.bouncy, color: '#C8FF00' },
            { label: 'Smooth', preset: springs.smooth, color: '#4FC3F7' },
            { label: 'Quick',  preset: springs.quick,  color: '#B57BFF' },
          ].map(({ label, preset, color }) => (
            <SpringDemo key={label} label={label} preset={preset} color={color} />
          ))}
        </div>
      </Section>

      {/* Spacing & radius tokens */}
      <Section title="Radius Tokens" delay={0.5}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {[
            { name: 'bubble', px: 18 },
            { name: 'card',   px: 14 },
            { name: 'sm',     px: 8 },
            { name: 'xs',     px: 4 },
          ].map((r) => (
            <div key={r.name} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 80, height: 80,
                  background: 'var(--color-surface-2)',
                  border: '1.5px solid var(--color-border-2)',
                  borderRadius: r.px,
                  marginBottom: 8,
                }}
              />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)' }}>
                --radius-{r.name}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-neon-lime)' }}>
                {r.px}px
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div style={{ height: 80 }} />
    </div>
  )
}

/* ── Section wrapper ──────────────────────────────────── */
function Section({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...springs.smooth, delay }}
      style={{ marginBottom: 48 }}
    >
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--color-muted)',
        marginBottom: 20,
        paddingBottom: 10,
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{ width: 16, height: 1.5, background: 'var(--color-neon-lime)', display: 'inline-block' }} />
        {title}
      </div>
      {children}
    </motion.div>
  )
}

/* ── Color swatch ─────────────────────────────────────── */
function ColorSwatch({ name, value, neon }: { name: string; value: string; neon?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: 36, height: 36,
          borderRadius: 'var(--radius-sm)',
          background: value,
          border: '1.5px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
          boxShadow: neon ? `0 0 12px ${value}66` : undefined,
        }}
      />
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text)', fontWeight: 500 }}>
          {name}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)', letterSpacing: '0.05em' }}>
          {value}
        </div>
      </div>
    </div>
  )
}

/* ── Animation demo card ──────────────────────────────── */
function AnimCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '20px 24px',
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        minWidth: 140,
      }}
    >
      {children}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', textAlign: 'center' }}>
        {label}
      </span>
    </div>
  )
}

/* ── Spring demo ──────────────────────────────────────── */
function SpringDemo({ label, preset, color }: { label: string; preset: object; color: string }) {
  return (
    <div
      style={{
        padding: '20px 24px',
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        minWidth: 160,
      }}
    >
      <motion.div
        style={{
          width: 40, height: 40,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 16px ${color}88`,
          marginBottom: 12,
        }}
        animate={{ x: [0, 60, 0] }}
        transition={{ ...preset, repeat: Infinity, repeatDelay: 1 }}
      />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color, marginTop: 2 }}>
        spring preset
      </div>
    </div>
  )
}
