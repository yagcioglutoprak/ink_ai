import { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Monitor, Tablet, Smartphone, RotateCcw, AlertCircle } from 'lucide-react'
import { shadows } from '../../lib/theme'
import { buildPreviewHTML, isPreviewable } from '../../lib/artifacts'
import type { Artifact } from '../../types'

interface PreviewTabProps {
  artifact: Artifact
  onConsoleLog?: (entry: ConsoleEntry) => void
}

export interface ConsoleEntry {
  level: 'log' | 'warn' | 'error' | 'info'
  args: string[]
  timestamp: number
}

type DeviceSize = 'desktop' | 'tablet' | 'mobile'

const DEVICE_SIZES: Record<DeviceSize, { width: string; label: string }> = {
  desktop: { width: '100%', label: 'DESKTOP' },
  tablet: { width: '768px', label: 'TABLET' },
  mobile: { width: '375px', label: 'MOBILE' },
}

export default function PreviewTab({ artifact, onConsoleLog }: PreviewTabProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [device, setDevice] = useState<DeviceSize>('desktop')
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const canPreview = isPreviewable(artifact.type)

  const handleMessage = useCallback(
    (e: MessageEvent) => {
      if (e.data?.type === 'console') {
        onConsoleLog?.({
          level: e.data.level ?? 'log',
          args: e.data.args ?? [],
          timestamp: Date.now(),
        })
      }
      if (e.data?.type === 'error') {
        setError(e.data.message ?? 'Runtime error')
      }
    },
    [onConsoleLog],
  )

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  // Reset error on code change
  useEffect(() => {
    setError(null)
  }, [artifact.code, refreshKey])

  if (!canPreview) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 12,
          background: '#FFFCF0',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            background: '#F5EFE0',
            border: '2px solid #000',
            boxShadow: shadows.sm,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Monitor size={20} color="#999" />
        </div>
        <div style={{ fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          NO PREVIEW AVAILABLE
        </div>
        <div style={{ fontSize: 10, color: '#bbb' }}>
          Preview is available for HTML, CSS, and JavaScript files.
        </div>
      </div>
    )
  }

  // Build the preview HTML with console capture injected
  const rawHTML = buildPreviewHTML(artifact.code, artifact.type)
  const consoleCapture = `<script>
(function(){
  var origConsole = {};
  ['log','warn','error','info'].forEach(function(level){
    origConsole[level] = console[level];
    console[level] = function(){
      var args = Array.from(arguments).map(function(a){
        try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
        catch(e) { return String(a); }
      });
      origConsole[level].apply(console, arguments);
      parent.postMessage({type:'console',level:level,args:args},'*');
    };
  });
  window.onerror = function(msg){
    parent.postMessage({type:'error',message:String(msg)},'*');
  };
})();
${"<"}/script>`

  // Inject console capture before </head> or at the start
  let previewHTML = rawHTML
  if (rawHTML.includes('</head>')) {
    previewHTML = rawHTML.replace('</head>', consoleCapture + '</head>')
  } else if (rawHTML.includes('<body')) {
    previewHTML = rawHTML.replace('<body', consoleCapture + '<body')
  } else {
    previewHTML = consoleCapture + rawHTML
  }

  const deviceConfig = DEVICE_SIZES[device]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F5EFE0' }}>
      {/* Device toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          borderBottom: '2px solid #000',
          background: '#fff',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {(['desktop', 'tablet', 'mobile'] as DeviceSize[]).map((d) => (
            <DeviceBtn
              key={d}
              active={device === d}
              onClick={() => setDevice(d)}
              label={DEVICE_SIZES[d].label}
            >
              {d === 'desktop' && <Monitor size={11} />}
              {d === 'tablet' && <Tablet size={11} />}
              {d === 'mobile' && <Smartphone size={11} />}
            </DeviceBtn>
          ))}
        </div>

        {/* Refresh */}
        <motion.button
          whileHover={{ x: -1, y: -1, boxShadow: shadows.sm }}
          whileTap={{ x: 1, y: 1, boxShadow: 'none' }}
          transition={{ duration: 0.07 }}
          onClick={() => setRefreshKey((k) => k + 1)}
          title="Refresh preview"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            background: 'transparent',
            border: '1.5px solid #000',
            color: '#000',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={9} />
          REFRESH
        </motion.button>
      </div>

      {/* Error overlay */}
      {error && (
        <div
          style={{
            padding: '8px 12px',
            background: '#FFF0F0',
            borderBottom: '2px solid #FF3B3B',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <AlertCircle size={12} color="#FF3B3B" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#CC0000' }}>
            {error}
          </span>
        </div>
      )}

      {/* Preview container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          overflow: 'auto',
          padding: device === 'desktop' ? 0 : 16,
        }}
      >
        <div
          style={{
            width: deviceConfig.width,
            maxWidth: '100%',
            height: '100%',
            position: 'relative',
            border: device !== 'desktop' ? '2px solid #000' : 'none',
            boxShadow: device !== 'desktop' ? shadows.md : 'none',
            background: '#fff',
          }}
        >
          {/* Device frame chrome for mobile/tablet */}
          {device === 'mobile' && (
            <div
              style={{
                height: 24,
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                borderBottom: '1px solid #333',
              }}
            >
              <div style={{ width: 40, height: 4, background: '#333', borderRadius: 2 }} />
            </div>
          )}

          <iframe
            ref={iframeRef}
            key={refreshKey}
            srcDoc={previewHTML}
            sandbox="allow-scripts"
            style={{
              width: '100%',
              height: device === 'mobile' ? 'calc(100% - 24px)' : '100%',
              border: 'none',
              display: 'block',
              background: '#fff',
            }}
            title="Artifact Preview"
          />
        </div>
      </div>
    </div>
  )
}

function DeviceBtn({
  children,
  active,
  onClick,
  label,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.07 }}
      onClick={onClick}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        padding: '3px 8px',
        background: active ? '#000' : 'transparent',
        border: '1.5px solid #000',
        color: active ? '#FFE500' : '#000',
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        letterSpacing: '0.06em',
        cursor: 'pointer',
      }}
    >
      {children}
      {label}
    </motion.button>
  )
}
