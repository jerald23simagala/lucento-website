import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';

export const EXPLAINER_FPS = 24;
export const EXPLAINER_DURATION = 168;
export const EXPLAINER_WIDTH = 640;
export const EXPLAINER_HEIGHT = 360;

const ink = '#17233F';
const paper = '#FFFDF5';
const blue = '#154DFD';
const sky = '#61AEFD';
const sun = '#FDA81B';
const line = '#E4E0D4';

const grow = (frame: number, start: number, end: number, to: number): number =>
  interpolate(frame, [start, end], [0, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

export const Explainer = () => {
  const frame = useCurrentFrame();
  const scene = frame < 56 ? 0 : frame < 112 ? 1 : 2;
  const used = grow(frame, 8, 40, 63);
  const month = grow(frame, 12, 44, 64);
  const rows = [0, 1, 2].map((i) =>
    interpolate(frame, [64 + i * 6, 76 + i * 6], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const syncIn = interpolate(frame, [116, 132], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: paper, color: ink, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <div style={{ position: 'absolute', left: 36, top: 28, fontSize: 15, fontWeight: 700, letterSpacing: 0.2 }}>
        {scene === 0 ? 'Budget beside the month' : scene === 1 ? 'A sentence becomes rows' : 'The record stays on the phone'}
      </div>
      <div style={{ position: 'absolute', left: 36, top: 52, width: 28, height: 4, background: blue }} />
      <div style={{ position: 'absolute', left: 68, top: 52, width: 18, height: 4, background: sky }} />
      <div style={{ position: 'absolute', left: 90, top: 52, width: 10, height: 4, background: sun }} />

      {scene === 0 && (
        <div style={{ position: 'absolute', left: 36, right: 36, top: 88 }}>
          <Bar label="Budget used" pct={used} color={blue} />
          <div style={{ height: 22 }} />
          <Bar label="Month passed" pct={month} color={sky} />
          <div style={{ marginTop: 28, fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
            {frame > 36 ? 'In step' : ''}
          </div>
          <div style={{ marginTop: 6, fontSize: 18, fontWeight: 650 }}>
            {frame > 40 ? 'About $50.00 a day · 12 days left' : ''}
          </div>
        </div>
      )}

      {scene === 1 && (
        <div style={{ position: 'absolute', left: 36, right: 36, top: 88 }}>
          <div style={{ fontSize: 26, fontWeight: 750, letterSpacing: -0.4, paddingBottom: 12, borderBottom: `1px solid ${line}` }}>
            Lunch 45, groceries 120, parking 15
          </div>
          {[
            ['Lunch', '45.00'],
            ['Groceries', '120.00'],
            ['Parking', '15.00'],
          ].map(([name, amount], i) => (
            <div
              key={name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: `1px solid ${line}`,
                fontSize: 20,
                fontWeight: 700,
                opacity: rows[i],
                transform: `translateY(${(1 - rows[i]) * 8}px)`,
              }}
            >
              <span>{name}</span>
              <span>{amount}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, fontSize: 16, fontWeight: 650, opacity: rows[2] }}>Nothing is saved until Save.</div>
        </div>
      )}

      {scene === 2 && (
        <div style={{ position: 'absolute', left: 36, right: 36, top: 92, display: 'flex', gap: 28 }}>
          <div style={{ flex: 1, borderTop: `4px solid ${blue}`, paddingTop: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>On this phone</div>
            <div style={{ marginTop: 10, fontSize: 16, lineHeight: 1.45 }}>
              Offline
              <br />
              No bank login
            </div>
          </div>
          <div style={{ flex: 1, borderTop: `4px dashed ${sky}`, paddingTop: 12, opacity: 0.35 + syncIn * 0.65 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Optional sync</div>
            <div style={{ marginTop: 10, fontSize: 16, lineHeight: 1.45 }}>
              Google or email
              <br />
              Off until you choose it
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const Bar = ({ label, pct, color }: { label: string; pct: number; color: string }) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
        <span>{label}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div style={{ marginTop: 6, height: 14, borderRadius: 999, background: '#E7E3D8', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: color }} />
      </div>
    </div>
  );
};
