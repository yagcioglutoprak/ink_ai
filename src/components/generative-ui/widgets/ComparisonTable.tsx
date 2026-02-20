import { shadows } from '../../../lib/theme'

interface CriteriaRow { label: string; values: string[] }
interface ComparisonTableProps { items: string[]; criteria: CriteriaRow[]; accentColor?: string }

export default function ComparisonTable({ items, criteria, accentColor = '#FFE500' }: ComparisonTableProps) {
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', boxShadow: shadows.md }}>
        <thead>
          <tr>
            <th
              style={{
                background: '#000',
                color: '#FFE500',
                padding: '8px 12px',
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                letterSpacing: '0.08em',
                textAlign: 'left',
                border: '1px solid #000',
                minWidth: 100,
              }}
            >
              CRITERIA
            </th>
            {items.map((item) => (
              <th
                key={item}
                style={{
                  background: accentColor,
                  color: '#000',
                  padding: '8px 12px',
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  letterSpacing: '0.08em',
                  textAlign: 'center',
                  border: '2px solid #000',
                  minWidth: 100,
                }}
              >
                {item.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map((row, i) => (
            <tr key={row.label} style={{ background: i % 2 === 0 ? '#fff' : '#F5EFE0' }}>
              <td
                style={{
                  padding: '8px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#000',
                  borderRight: '2px solid #000',
                  borderBottom: '1px solid #ccc',
                }}
              >
                {row.label}
              </td>
              {row.values.map((v, j) => (
                <td
                  key={j}
                  style={{
                    padding: '8px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: v === '✓' || v.toLowerCase() === 'yes' || v.toLowerCase() === 'good' ? '#00CC44' :
                           v === '✗' || v.toLowerCase() === 'no'  || v.toLowerCase() === 'poor' ? '#FF3B3B' : '#0A0A0A',
                    textAlign: 'center',
                    borderRight: j < row.values.length - 1 ? '1px solid #ddd' : 'none',
                    borderBottom: '1px solid #ddd',
                  }}
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
