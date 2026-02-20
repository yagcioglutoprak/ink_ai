import { shadows } from '../../../lib/theme'

interface ProsConsListProps { pros: string[]; cons: string[]; topic?: string }

export default function ProsConsList({ pros, cons, topic }: ProsConsListProps) {
  return (
    <div style={{ width: '100%' }}>
      {topic && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.06em', marginBottom: 10 }}>
          {topic.toUpperCase()}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {/* Pros */}
        <div style={{ border: '2px solid #000', boxShadow: shadows.sm, overflow: 'hidden' }}>
          <div
            style={{
              background: '#00CC44',
              borderBottom: '2px solid #000',
              padding: '6px 10px',
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              letterSpacing: '0.06em',
            }}
          >
            PROS ({pros.length})
          </div>
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6, background: '#fff' }}>
            {pros.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00CC44', flexShrink: 0, marginTop: 1 }}>+</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#0A0A0A', lineHeight: 1.5 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Cons */}
        <div style={{ border: '2px solid #000', boxShadow: shadows.sm, overflow: 'hidden' }}>
          <div
            style={{
              background: '#FF3B3B',
              borderBottom: '2px solid #000',
              padding: '6px 10px',
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              letterSpacing: '0.06em',
            }}
          >
            CONS ({cons.length})
          </div>
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6, background: '#fff' }}>
            {cons.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#FF3B3B', flexShrink: 0, marginTop: 1 }}>−</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#0A0A0A', lineHeight: 1.5 }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
