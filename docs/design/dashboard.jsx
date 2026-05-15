// Grow Logs — Dashboard
// Dark navy sidebar + warm cream main content. Uses the Grow Logs dark
// system tokens for the sidebar, and a cream-surface companion palette
// (introduced here) for the main canvas. Sage-mint accent carries through.

// (everything below runs inside an IIFE so internal helpers like EntryRow,
// Eyebrow, Pill, Card, Field, etc. don't collide with same-named symbols
// in other Babel scripts loaded on the same page — only the explicit
// window assignments at the bottom escape.)
(() => {
const T = window.GL_TOKENS.dark;
const FONT_SANS = window.GL_TOKENS.type.sans;
const FONT_MONO = window.GL_TOKENS.type.mono;
const tint = window.glTint;

// Companion palette aliasing the dark design system so call sites stay
// readable. Everything resolves to GL_TOKENS.dark.
const CR = {
  bg:           T.bg,
  bgSubtle:     T.bgSubtle,
  surface:      T.surface,
  surface2:     T.surface2,
  border:       T.border,
  borderStrong: T.borderStrong,    // cream hard outline (signature)
  text:         T.text,
  textMuted:    T.textMuted,
  textFaint:    T.textFaint,
  primary:      T.primary,
  primaryHover: T.primaryHover,
  primarySoft:  T.primarySoft,
  primaryHalo:  tint(T.primary, 0.22),
  workBg:       T.workBg,
  workFg:       T.workFg,
  learnBg:      T.learnBg,
  learnFg:      T.learnFg,
  warningBg:    T.warningSoft,
  warningFg:    T.warning,
  dangerBg:     T.dangerSoft,
  dangerFg:     T.danger,
  shadow:       T.shadow,
  swatch:       T.swatch,
};

// ───────────────────────────── icons ─────────────────────────────
const I = {
  Logo: ({ size = 22, color = T.text, accent = T.primary }) => (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <rect x="2"  y="11" width="2.6" height="9"  rx="0.6" fill={color} />
      <rect x="6"  y="7"  width="2.6" height="13" rx="0.6" fill={color} />
      <rect x="10" y="3"  width="2.6" height="17" rx="0.6" fill={accent} />
      <rect x="14" y="9"  width="2.6" height="11" rx="0.6" fill={color} />
      <rect x="18" y="13" width="2.6" height="7"  rx="0.6" fill={color} />
    </svg>
  ),
  Plus: ({ s = 14 }) => <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>,
  Chevron: ({ s = 12 }) => <svg width={s} height={s} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4.5l3 3 3-3"/></svg>,
  ChevronUp: ({ s = 12 }) => <svg width={s} height={s} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7.5l3-3 3 3"/></svg>,
  Dots: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><circle cx="3.5" cy="8" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="12.5" cy="8" r="1.4"/></svg>,
  ArrowUp: ({ s = 11 }) => <svg width={s} height={s} viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 9V2.5M2.5 5l3-3 3 3"/></svg>,
  ArrowDown: ({ s = 11 }) => <svg width={s} height={s} viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 2v6.5M2.5 6l3 3 3-3"/></svg>,
  ArrowRight: ({ s = 12 }) => <svg width={s} height={s} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6H9M6 3l3 3-3 3"/></svg>,
  Today: ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="16" height="14" rx="2"/><path d="M3 9h16M7 3v4M15 3v4"/></svg>,
  Week: ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11h16M3 14h16M3 8h16"/></svg>,
  All: ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h16M3 11h16M3 17h16"/></svg>,
  Cat: ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h7A1.5 1.5 0 0 1 19.5 8.5v8A1.5 1.5 0 0 1 18 18H4.5A1.5 1.5 0 0 1 3 16.5v-10z"/></svg>,
  Insights: ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17h16"/><path d="M6 17v-5"/><path d="M10 17V8"/><path d="M14 17v-7"/><path d="M18 17V5"/></svg>,
  Settings: ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="3"/><path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.5 4.5l1.5 1.5M16 16l1.5 1.5M4.5 17.5L6 16M16 6l1.5-1.5"/></svg>,
  Close: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>,
  Empty: ({ s = 36 }) => <svg width={s} height={s} viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="9" width="24" height="20" rx="2"/><path d="M6 15h24"/><path d="M12 22h6M12 25h12"/></svg>,
};

// ───────────────────────────── sample data ─────────────────────────────
const CATEGORIES = [
  { name: 'Backend',      sub: ['NestJS', 'Postgres', 'Auth'],       hue: CR.swatch[0], count: 38, score: 7.8 },
  { name: 'System Design',sub: ['Caching', 'Queues'],                 hue: CR.swatch[1], count: 24, score: 7.2 },
  { name: 'Reading',      sub: ['DDIA', 'Refactoring'],               hue: CR.swatch[2], count: 22, score: 7.5 },
  { name: 'Side Project', sub: ['Grow Logs', 'Notes app'],           hue: CR.swatch[3], count: 19, score: 8.4 },
  { name: 'Soft Skills',  sub: ['Communication', 'Mentoring'],        hue: CR.swatch[4], count: 12, score: 6.9 },
];

const ENTRIES = [
  {
    id: 1, day: '14', month: 'May', type: 'Work', cat: 'Backend', sub: 'NestJS',
    text: 'Refactored auth into a single guard. Pulled the refresh-token rotation out of the login handler and the test surface dropped by half.',
    score: 8, hue: CR.swatch[0],
  },
  {
    id: 2, day: '14', month: 'May', type: 'Learning', cat: 'Reading', sub: 'DDIA',
    text: 'Chapter 4 — Designing Data-Intensive Applications. Replication patterns; conflict resolution figure finally clicked.',
    score: 7, hue: CR.swatch[2],
  },
  {
    id: 3, day: '13', month: 'May', type: 'Work', cat: 'Side Project', sub: 'Grow Logs',
    text: 'Shipped the import-from-CSV flow. Row-level errors inline. Cut onboarding friction for the three people who tried it.',
    score: 9, hue: CR.swatch[3],
  },
  {
    id: 4, day: '13', month: 'May', type: 'Learning', cat: 'System Design', sub: 'Caching',
    text: 'Read up on cache stampedes — request coalescing, lock-and-refresh, probabilistic early expiration. Trade-offs make sense now.',
    score: 6, hue: CR.swatch[1],
  },
  {
    id: 5, day: '12', month: 'May', type: 'Work', cat: 'Backend', sub: 'Postgres',
    text: 'Replaced two redundant indexes after running the unused-index report. Saved ~140MB. Tiny but satisfying.',
    score: 7, hue: CR.swatch[0],
  },
];

// 30 days of daily activity — work + learning entry counts
const DAILY = (() => {
  const seed = [
    1,2,0,3,1, 2,3,1,2,2, 4,2,3,1,0,
    2,3,2,4,1, 3,2,3,1,2, 4,3,2,1,3,
  ];
  return seed.map((w, i) => ({
    i, label: (i % 7 === 0 || i === 29) ? `${((i+1) || 1)} May` : '',
    work: w, learn: ((i * 3) % 4 + ((i % 5 === 0) ? 1 : 0)),
  }));
})();

// 8-week productivity trend (avg score per week, null = no data)
const TREND = [6.8, 7.1, 6.5, 7.4, null, 7.6, 7.8, 8.0];

// ───────────────────────────── primitives ─────────────────────────────
function Card({ children, style, pad = 22 }) {
  return (
    <div style={{
      background: CR.surface,
      border: `1px solid ${CR.border}`,
      borderRadius: 12,
      padding: pad,
      ...style,
    }}>{children}</div>
  );
}

function Eyebrow({ children, style }) {
  return (
    <div style={{
      font: `700 10.5px/1.2 ${FONT_SANS}`,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: CR.textMuted,
      ...style,
    }}>{children}</div>
  );
}

function Pill({ children, on, onClick, color = 'navy' }) {
  const palette = color === 'sage' ? {
    bg: on ? CR.primarySoft : 'transparent',
    fg: on ? CR.primary : CR.textMuted,
    bgHover: CR.primarySoft,
  } : {
    bg: on ? tint(T.text, 0.08) : 'transparent',
    fg: on ? CR.text : CR.textMuted,
    bgHover: tint(T.text, 0.05),
  };
  return (
    <button onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 8,
      border: 'none', background: palette.bg,
      color: palette.fg, cursor: 'pointer',
      font: `${on ? 600 : 500} 12.5px/1 ${FONT_SANS}`,
      whiteSpace: 'nowrap',
      transition: 'background-color .12s',
    }}
    onMouseEnter={(e) => !on && (e.currentTarget.style.background = palette.bgHover)}
    onMouseLeave={(e) => !on && (e.currentTarget.style.background = 'transparent')}>
      {children}
    </button>
  );
}

function ScorePill({ score }) {
  const tone = score >= 8 ? { bg: CR.primarySoft, fg: CR.primary } :
               score >= 5 ? { bg: CR.warningBg,  fg: CR.warningFg } :
                            { bg: CR.dangerBg,   fg: CR.dangerFg };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 10px', borderRadius: 7,
      background: tone.bg, color: tone.fg,
      font: `600 12px/1.2 ${FONT_MONO}`,
      whiteSpace: 'nowrap',
      fontVariantNumeric: 'tabular-nums',
    }}>{score} / 10</span>
  );
}

function TypeBadge({ type }) {
  const work = type === 'Work';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999,
      background: work ? CR.workBg : CR.learnBg,
      color: work ? CR.workFg : CR.learnFg,
      font: `600 11px/1.3 ${FONT_SANS}`,
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 999, background: 'currentColor' }} />
      {type}
    </span>
  );
}

// ───────────────────────────── Sidebar ─────────────────────────────
function Sidebar() {
  const nav = [
    ['Today',       I.Today,    false],
    ['Dashboard',   I.Insights, true],
    ['All entries', I.All,      false],
    ['Categories',  I.Cat,      false],
  ];
  return (
    <aside style={{
      background: T.bgSubtle, color: T.text,
      borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column',
      padding: '22px 16px 18px',
      width: 240, flexShrink: 0,
      height: '100vh', position: 'sticky', top: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 22px' }}>
        <I.Logo size={20} />
        <span style={{ font: `700 15px/1 ${FONT_SANS}`, letterSpacing: '-0.015em', color: T.text }}>Grow Logs</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map(([label, Ic, on]) => (
          <a key={label} href="#" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 8,
            background: on ? T.surface : 'transparent',
            color: on ? T.text : T.textMuted,
            font: `${on ? 600 : 500} 13.5px/1 ${FONT_SANS}`,
            textDecoration: 'none',
            border: on ? `1px solid ${T.border}` : '1px solid transparent',
          }}>
            <Ic /> {label}
          </a>
        ))}
      </div>

      <div style={{
        font: `700 10px/1 ${FONT_SANS}`, letterSpacing: '0.12em', textTransform: 'uppercase',
        color: T.textFaint, padding: '24px 10px 10px',
      }}>Categories</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {CATEGORIES.map((c) => (
          <a key={c.name} href="#" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 10px', borderRadius: 7,
            color: T.textMuted, font: `500 12.5px/1 ${FONT_SANS}`,
            textDecoration: 'none',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: c.hue }} />
            <span style={{ flex: 1 }}>{c.name}</span>
            <span style={{ font: `500 11px/1 ${FONT_MONO}`, color: T.textFaint }}>{c.count}</span>
          </a>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <a href="#" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 8,
        color: T.textMuted, font: `500 13px/1 ${FONT_SANS}`,
        textDecoration: 'none',
      }}>
        <I.Settings /> Settings
      </a>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 8px', marginTop: 6,
        borderTop: `1px solid ${T.border}`,
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 30, height: 30, borderRadius: 999,
          background: T.primary, color: T.primaryInk,
          font: `700 12px/1 ${FONT_SANS}`,
        }}>SE</span>
        <div style={{ flex: 1 }}>
          <div style={{ font: `600 12.5px/1.2 ${FONT_SANS}`, color: T.text }}>Software engineer</div>
          <div style={{ font: `400 11px/1.2 ${FONT_SANS}`, color: T.textMuted, marginTop: 2 }}>3yr experience</div>
        </div>
      </div>
    </aside>
  );
}

// ───────────────────────────── TopBar ─────────────────────────────
function TopBar({ period, onPeriod, onAdd, empty, onToggleEmpty }) {
  const periods = [['7 days', '7d'], ['30 days', '30d'], ['All time', 'all']];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '22px 32px',
      borderBottom: `1px solid ${CR.border}`,
      background: CR.bg,
      position: 'sticky', top: 0, zIndex: 5,
    }}>
      <div>
        <div style={{ font: `700 24px/1.1 ${FONT_SANS}`, letterSpacing: '-0.022em', color: CR.text }}>Dashboard</div>
        <div style={{ font: `400 13px/1.3 ${FONT_SANS}`, color: CR.textMuted, marginTop: 4 }}>
          Friday, 15 May · 12-day streak going
        </div>
      </div>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: 4, background: CR.bgSubtle, border: `1px solid ${CR.border}`, borderRadius: 10 }}>
        {periods.map(([label, k]) => (
          <button key={k} onClick={() => onPeriod(k)} style={{
            padding: '7px 12px', borderRadius: 7, border: 'none',
            background: period === k ? CR.surface : 'transparent',
            color: period === k ? CR.text : CR.textMuted,
            font: `${period === k ? 600 : 500} 12.5px/1 ${FONT_SANS}`,
            cursor: 'pointer', whiteSpace: 'nowrap',
            border: period === k ? `1px solid ${CR.border}` : '1px solid transparent',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onToggleEmpty} title="Toggle empty state for demo" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 11px', borderRadius: 8, border: `1px dashed ${CR.borderStrong}`,
          background: 'transparent', color: CR.textMuted,
          font: `500 11.5px/1 ${FONT_SANS}`, cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: empty ? CR.primary : CR.textFaint }} />
          {empty ? 'Showing empty state' : 'Demo: empty state'}
        </button>
        <button onClick={onAdd} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', borderRadius: 10, border: 'none',
          background: CR.primarySoft, color: CR.primary,
          font: `600 13.5px/1 ${FONT_SANS}`, cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>
          <I.Plus s={13} /> Add entry
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────── Stat cards ─────────────────────────────
function StatCard({ label, value, suffix, sub, subTone = 'sage', trend }) {
  return (
    <Card pad={20} style={{ minWidth: 0 }}>
      <Eyebrow>{label}</Eyebrow>
      <div style={{
        font: `700 42px/1 ${FONT_SANS}`, letterSpacing: '-0.03em',
        color: CR.text, margin: '12px 0 6px',
        fontVariantNumeric: 'tabular-nums',
        display: 'flex', alignItems: 'baseline', gap: 4,
      }}>{value}{suffix && <span style={{ fontSize: 18, color: CR.textMuted, fontWeight: 600 }}>{suffix}</span>}</div>
      {trend && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          font: `500 12px/1.3 ${FONT_SANS}`, color: CR.textMuted,
          whiteSpace: 'nowrap',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 16, height: 16, borderRadius: 4,
            background: trend.up ? CR.primarySoft : CR.dangerBg,
            color: trend.up ? CR.primary : CR.dangerFg,
          }}>{trend.up ? <I.ArrowUp /> : <I.ArrowDown />}</span>
          {trend.text}
        </div>
      )}
      {sub && !trend && (
        <div style={{
          font: `500 12px/1.4 ${FONT_SANS}`,
          color: subTone === 'sage' ? CR.primary : CR.textMuted,
        }}>{sub}</div>
      )}
    </Card>
  );
}

function SplitStatCard({ workPct, learnPct }) {
  return (
    <Card pad={20} style={{ minWidth: 0 }}>
      <Eyebrow>This month's split</Eyebrow>
      <div style={{ margin: '14px 0 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={{ font: `700 24px/1 ${FONT_MONO}`, color: CR.workFg, fontVariantNumeric: 'tabular-nums' }}>{workPct}%</div>
          <div style={{ font: `500 11px/1.3 ${FONT_SANS}`, color: CR.textMuted, marginTop: 4 }}>Work</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ font: `700 24px/1 ${FONT_MONO}`, color: CR.primary, fontVariantNumeric: 'tabular-nums' }}>{learnPct}%</div>
          <div style={{ font: `500 11px/1.3 ${FONT_SANS}`, color: CR.textMuted, marginTop: 4 }}>Learning</div>
        </div>
      </div>
      <div style={{
        height: 10, borderRadius: 999, overflow: 'hidden', display: 'flex',
        background: CR.bgSubtle, marginTop: 8,
      }}>
        <div style={{ width: `${workPct}%`, background: CR.workFg, opacity: 0.85 }} />
        <div style={{ width: `${learnPct}%`, background: CR.primary, opacity: 0.95 }} />
      </div>
    </Card>
  );
}

function StatsRow({ empty }) {
  if (empty) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 18 }}>
        {[1,2,3,4,5].map((i) => (
          <Card key={i} pad={20} style={{ background: 'transparent', border: `1px dashed ${CR.borderStrong}` }}>
            <Eyebrow style={{ color: CR.textFaint }}>—</Eyebrow>
            <div style={{ font: `700 42px/1 ${FONT_SANS}`, letterSpacing: '-0.03em', color: CR.textFaint, margin: '12px 0 6px' }}>—</div>
            <div style={{ font: `500 12px/1.4 ${FONT_SANS}`, color: CR.textFaint }}>Log entries to see stats</div>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 18 }}>
      <StatCard label="Total entries" value="147" sub="since you started" />
      <StatCard label="This week"     value="12"  trend={{ up: true,  text: '+3 vs. last week' }} />
      <SplitStatCard workPct={62} learnPct={38} />
      <StatCard label="Avg productivity" value="7.4" suffix="/10" sub="across scored entries" subTone="muted" />
      <StatCard label="Current streak"   value="9"   sub="Personal best: 23 days" />
    </div>
  );
}

// ───────────────────────────── Activity chart ─────────────────────────────
function ActivityCard({ empty }) {
  const [tab, setTab] = React.useState('daily');
  const [tip, setTip] = React.useState(null); // { x, y, label, work, learn }

  return (
    <Card pad={0} style={{ marginBottom: 18, overflow: 'visible' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 22px 0',
      }}>
        <div>
          <Eyebrow style={{ marginBottom: 8 }}>Activity</Eyebrow>
          <div style={{ display: 'flex', gap: 4, padding: 4, background: CR.bgSubtle, borderRadius: 9, border: `1px solid ${CR.border}` }}>
            {[['Daily activity', 'daily'], ['Category breakdown', 'cat']].map(([label, k]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: '7px 13px', borderRadius: 6, border: 'none',
                background: tab === k ? CR.surface : 'transparent',
                color: tab === k ? CR.text : CR.textMuted,
                font: `${tab === k ? 600 : 500} 12.5px/1 ${FONT_SANS}`,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                border: tab === k ? `1px solid ${CR.border}` : '1px solid transparent',
                boxShadow: tab === k ? '0 1px 2px rgba(22,20,42,0.04)' : 'none',
              }}>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, font: `500 12px/1 ${FONT_SANS}`, color: CR.textMuted }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: CR.workFg }} /> Work
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: CR.primary }} /> Learning
          </span>
        </div>
      </div>

      <div style={{ padding: '22px' }}>
        {empty ? (
          <EmptyChart />
        ) : tab === 'daily' ? (
          <DailyChart tip={tip} setTip={setTip} />
        ) : (
          <CategoryChart />
        )}
      </div>
    </Card>
  );
}

function DailyChart({ tip, setTip }) {
  const max = Math.max(...DAILY.map(d => Math.max(d.work, d.learn)), 1);
  const H = 220;
  return (
    <div style={{ position: 'relative' }}>
      {/* gridlines */}
      <div style={{ position: 'relative', height: H + 28 }}>
        {[0.25, 0.5, 0.75, 1].map((p) => (
          <div key={p} style={{
            position: 'absolute', left: 30, right: 0,
            top: (1 - p) * H + 4,
            borderTop: `1px dashed ${CR.border}`,
            font: `500 10px/1 ${FONT_MONO}`, color: CR.textFaint,
            paddingLeft: 0,
          }}>
            <span style={{ position: 'absolute', left: -28, top: -5 }}>{Math.round(p * max)}</span>
          </div>
        ))}
        <div style={{
          position: 'absolute', left: 30, right: 0, top: H + 4,
          borderTop: `1px solid ${CR.border}`,
        }}>
          <span style={{ position: 'absolute', left: -28, top: -5, font: `500 10px/1 ${FONT_MONO}`, color: CR.textFaint }}>0</span>
        </div>

        {/* bars */}
        <div style={{
          position: 'absolute', left: 30, right: 0, top: 4, height: H,
          display: 'grid', gridTemplateColumns: `repeat(${DAILY.length}, 1fr)`, gap: 4, alignItems: 'end',
        }}>
          {DAILY.map((d) => {
            const wh = (d.work / max) * H;
            const lh = (d.learn / max) * H;
            return (
              <div key={d.i}
                onMouseEnter={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const p = e.currentTarget.parentElement.parentElement.parentElement.getBoundingClientRect();
                  setTip({
                    x: r.left - p.left + r.width / 2,
                    y: r.top - p.top - 8,
                    label: `${d.i + 1} May`,
                    work: d.work, learn: d.learn,
                  });
                }}
                onMouseLeave={() => setTip(null)}
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', cursor: 'default' }}>
                <div style={{ display: 'flex', gap: 2, height: '100%', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, height: wh, background: CR.workFg, opacity: 0.85, borderRadius: '2px 2px 0 0' }} />
                  <div style={{ flex: 1, height: lh, background: CR.primary, opacity: 0.95, borderRadius: '2px 2px 0 0' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* x-axis labels */}
        <div style={{
          position: 'absolute', left: 30, right: 0, top: H + 12,
          display: 'grid', gridTemplateColumns: `repeat(${DAILY.length}, 1fr)`, gap: 4,
        }}>
          {DAILY.map((d) => (
            <div key={d.i} style={{
              font: `500 10px/1 ${FONT_MONO}`, color: CR.textFaint,
              textAlign: 'center', whiteSpace: 'nowrap',
              opacity: d.label ? 1 : 0,
            }}>{d.label}</div>
          ))}
        </div>
      </div>

      {tip && (
        <div style={{
          position: 'absolute',
          left: tip.x, top: tip.y,
          transform: 'translate(-50%, -100%)',
          background: T.surface, color: T.text,
          border: `1px solid ${T.border}`, borderRadius: 8,
          padding: '8px 12px',
          font: `500 12px/1.4 ${FONT_SANS}`,
          whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10,
          boxShadow: T.shadowLg,
        }}>
          <div style={{ font: `600 11px/1.2 ${FONT_MONO}`, color: T.textMuted, marginBottom: 4 }}>{tip.label}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 999, background: CR.workFg, marginRight: 6 }} />{tip.work} Work</span>
            <span><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 999, background: CR.primary, marginRight: 6 }} />{tip.learn} Learning</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryChart() {
  const max = Math.max(...CATEGORIES.map(c => c.count));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {CATEGORIES.map((c) => (
        <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 60px', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: `600 13px/1.2 ${FONT_SANS}`, color: CR.text }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: c.hue }} />
              {c.name}
            </div>
            <div style={{ font: `500 11px/1.3 ${FONT_MONO}`, color: CR.textFaint, marginTop: 4 }}>avg {c.score.toFixed(1)}/10</div>
          </div>
          <div style={{ height: 26, background: CR.bgSubtle, borderRadius: 7, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              width: `${(c.count / max) * 100}%`, height: '100%',
              background: tint(T.text, 0.14),
              borderRight: `2px solid ${c.hue}`,
            }} />
          </div>
          <div style={{ font: `600 13px/1 ${FONT_MONO}`, color: CR.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.count}</div>
        </div>
      ))}
    </div>
  );
}

function EmptyChart() {
  return (
    <div style={{
      border: `1px dashed ${CR.borderStrong}`, borderRadius: 10,
      padding: '60px 24px', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      color: CR.textFaint,
    }}>
      <I.Empty />
      <div style={{ font: `600 15px/1.4 ${FONT_SANS}`, color: CR.textMuted, marginTop: 4 }}>
        Your activity chart will appear here
      </div>
      <div style={{ font: `400 13px/1.5 ${FONT_SANS}`, color: CR.textFaint }}>
        Start by adding your first entry.
      </div>
    </div>
  );
}

// ───────────────────────────── Recent entries ─────────────────────────────
function RecentEntries({ empty, onAdd }) {
  const [filter, setFilter] = React.useState('all');
  const [expanded, setExpanded] = React.useState(null);
  const [menuOpen, setMenuOpen] = React.useState(null);

  React.useEffect(() => {
    const close = () => setMenuOpen(null);
    if (menuOpen) {
      window.addEventListener('click', close);
      return () => window.removeEventListener('click', close);
    }
  }, [menuOpen]);

  const visible = filter === 'all' ? ENTRIES : ENTRIES.filter(e => e.type.toLowerCase() === filter);

  return (
    <Card pad={0} style={{ marginBottom: 18 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 22px',
        borderBottom: `1px solid ${CR.border}`,
      }}>
        <div style={{ font: `700 17px/1.2 ${FONT_SANS}`, letterSpacing: '-0.015em', color: CR.text }}>
          Recent entries
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 2, padding: 3, background: CR.bgSubtle, borderRadius: 8, border: `1px solid ${CR.border}` }}>
            <Pill on={filter === 'all'}      onClick={() => setFilter('all')}      color="sage">All</Pill>
            <Pill on={filter === 'work'}     onClick={() => setFilter('work')}     color="navy">Work</Pill>
            <Pill on={filter === 'learning'} onClick={() => setFilter('learning')} color="navy">Learning</Pill>
          </div>
          <a href="#" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            font: `600 12.5px/1 ${FONT_SANS}`, color: CR.primary,
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>View all <I.ArrowRight /></a>
        </div>
      </div>

      {empty ? (
        <div style={{
          padding: '60px 24px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <div style={{ font: `700 18px/1.3 ${FONT_SANS}`, letterSpacing: '-0.015em', color: CR.text }}>No entries yet</div>
          <div style={{ font: `400 14px/1.5 ${FONT_SANS}`, color: CR.textMuted, maxWidth: 320 }}>
            Your log will appear here once you start adding entries.
          </div>
          <a href="#" onClick={(e) => { e.preventDefault(); onAdd(); }} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            font: `600 13px/1 ${FONT_SANS}`, color: CR.primary,
            textDecoration: 'none', marginTop: 8,
            whiteSpace: 'nowrap',
          }}>Add your first entry <I.ArrowRight /></a>
        </div>
      ) : visible.length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center', font: `500 13px/1.5 ${FONT_SANS}`, color: CR.textMuted }}>
          No {filter} entries in this period.
        </div>
      ) : (
        visible.map((e, i) => (
          <EntryRow key={e.id} e={e}
            expanded={expanded === e.id}
            onToggle={() => setExpanded(expanded === e.id ? null : e.id)}
            menuOpen={menuOpen === e.id}
            onMenu={(ev) => { ev.stopPropagation(); setMenuOpen(menuOpen === e.id ? null : e.id); }}
            isLast={i === visible.length - 1}
          />
        ))
      )}
    </Card>
  );
}

function EntryRow({ e, expanded, onToggle, menuOpen, onMenu, isLast }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '60px 92px 1fr 80px 36px',
        gap: 18,
        alignItems: 'center',
        padding: '16px 22px',
        borderBottom: isLast ? 'none' : `1px solid ${CR.border}`,
        background: hover ? CR.surface2 : 'transparent',
        cursor: 'pointer',
        position: 'relative',
        minHeight: 64,
      }}>
      <div style={{ textAlign: 'left' }}>
        <div style={{ font: `700 18px/1 ${FONT_SANS}`, color: CR.text, letterSpacing: '-0.015em' }}>{e.day}</div>
        <div style={{ font: `500 11px/1 ${FONT_MONO}`, color: CR.textFaint, marginTop: 4, textTransform: 'uppercase' }}>{e.month}</div>
      </div>
      <TypeBadge type={e.type} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 4 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: `600 13px/1.3 ${FONT_SANS}`, color: CR.text, whiteSpace: 'nowrap' }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: e.hue }} />
            {e.cat}
          </span>
          <span style={{ font: `400 12px/1.3 ${FONT_SANS}`, color: CR.textFaint }}>/</span>
          <span style={{ font: `500 12px/1.3 ${FONT_SANS}`, color: CR.textMuted, whiteSpace: 'nowrap' }}>{e.sub}</span>
        </div>
        <div style={{
          font: `400 13.5px/1.5 ${FONT_SANS}`, color: CR.textMuted,
          fontStyle: 'italic',
          ...(expanded ? {} : { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }),
        }}>{e.text}</div>
      </div>
      <div style={{ justifySelf: 'end' }}><ScorePill score={e.score} /></div>
      <div style={{ position: 'relative', justifySelf: 'end' }}>
        <button onClick={onMenu} style={{
          width: 28, height: 28, borderRadius: 7, border: 'none',
          background: menuOpen ? CR.bgSubtle : 'transparent',
          color: CR.textMuted, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}><I.Dots /></button>
        {menuOpen && (
          <div onClick={(ev) => ev.stopPropagation()} style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 4,
            background: CR.surface, border: `1px solid ${CR.borderStrong}`,
            borderRadius: 9, padding: 4, minWidth: 140, zIndex: 20,
            boxShadow: CR.shadow,
          }}>
            {[['Edit', CR.text], ['Delete', CR.dangerFg]].map(([label, color]) => (
              <button key={label} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '7px 10px', borderRadius: 6, border: 'none',
                background: 'transparent', color,
                font: `500 13px/1 ${FONT_SANS}`, cursor: 'pointer',
              }}
              onMouseEnter={(ev) => ev.currentTarget.style.background = CR.bgSubtle}
              onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────── Productivity trend ─────────────────────────────
function ProductivityTrend({ empty }) {
  const W = 980, H = 160, PAD_L = 32, PAD_R = 12, PAD_T = 14, PAD_B = 24;
  const cw = W - PAD_L - PAD_R, ch = H - PAD_T - PAD_B;

  // build segments around nulls
  const pts = TREND.map((v, i) => {
    const x = PAD_L + (i / (TREND.length - 1)) * cw;
    const y = v == null ? null : PAD_T + (1 - v / 10) * ch;
    return { x, y, v, label: `W${i + 1}` };
  });

  // segment paths
  const segments = [];
  let cur = [];
  pts.forEach((p) => {
    if (p.y == null) {
      if (cur.length > 1) segments.push(cur);
      cur = [];
    } else cur.push(p);
  });
  if (cur.length > 1) segments.push(cur);

  return (
    <Card style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ font: `700 17px/1.2 ${FONT_SANS}`, letterSpacing: '-0.015em', color: CR.text }}>Productivity over time</div>
          <div style={{ font: `400 13px/1.4 ${FONT_SANS}`, color: CR.textMuted, marginTop: 4 }}>
            Average score per week across all entries
          </div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999,
          background: CR.primarySoft, color: CR.primary,
          font: `600 12px/1.3 ${FONT_SANS}`, whiteSpace: 'nowrap',
        }}>
          <I.ArrowUp /> Trending up · +1.2 over 8 weeks
        </div>
      </div>

      {empty ? (
        <div style={{
          border: `1px dashed ${CR.borderStrong}`, borderRadius: 10,
          padding: '40px 24px', textAlign: 'center',
          font: `500 13px/1.5 ${FONT_SANS}`, color: CR.textFaint,
        }}>
          Add entries with a productivity score to see your trend.
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 200, display: 'block' }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={CR.primary} stopOpacity="0.22" />
              <stop offset="100%" stopColor={CR.primary} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* gridlines */}
          {[0, 5, 10].map((v) => {
            const y = PAD_T + (1 - v / 10) * ch;
            return (
              <g key={v}>
                <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke={CR.border} strokeDasharray="4 4" />
                <text x={PAD_L - 8} y={y + 3} textAnchor="end" fontFamily={FONT_MONO} fontSize="10" fill={CR.textFaint}>{v}</text>
              </g>
            );
          })}

          {/* x labels */}
          {pts.map((p) => (
            <text key={p.label} x={p.x} y={H - 6} textAnchor="middle" fontFamily={FONT_MONO} fontSize="10" fill={CR.textFaint}>
              {p.label}
            </text>
          ))}

          {/* area + line per segment */}
          {segments.map((seg, si) => {
            const d = seg.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
            const last = seg[seg.length - 1], first = seg[0];
            const area = `${d} L${last.x},${PAD_T + ch} L${first.x},${PAD_T + ch} Z`;
            return (
              <g key={si}>
                <path d={area} fill="url(#trendFill)" />
                <path d={d} fill="none" stroke={CR.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            );
          })}

          {/* points */}
          {pts.map((p, i) => p.y != null && (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3.2} fill={CR.surface} stroke={CR.primary} strokeWidth="2" />
              {i === pts.length - 1 && (
                <text x={p.x} y={p.y - 10} textAnchor="middle" fontFamily={FONT_SANS} fontSize="11" fontWeight="600" fill={CR.primary}>
                  {p.v.toFixed(1)}
                </text>
              )}
            </g>
          ))}
        </svg>
      )}
    </Card>
  );
}

// ───────────────────────────── Add Entry sheet ─────────────────────────────
function AddEntrySheet({ open, onClose }) {
  const [type, setType] = React.useState('Work');
  const [score, setScore] = React.useState(7);
  const [cat, setCat] = React.useState(CATEGORIES[0]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (ev) => ev.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <React.Fragment>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(22,20,42,0.45)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity .25s ease',
      }} />
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
        zIndex: 60,
        background: T.surface, color: T.text,
        borderLeft: `1px solid ${T.border}`,
        boxShadow: '-20px 0 60px -20px rgba(0,0,0,0.5)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .28s ease',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div>
            <div style={{ font: `700 18px/1.2 ${FONT_SANS}`, letterSpacing: '-0.018em', color: T.text }}>New entry</div>
            <div style={{ font: `400 12.5px/1.4 ${FONT_SANS}`, color: T.textMuted, marginTop: 4 }}>Friday, 15 May</div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: tint(T.text, 0.06), color: T.textMuted, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}><I.Close /></button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 22, overflowY: 'auto' }}>
          <Field label="Type">
            <div style={{ display: 'inline-flex', padding: 4, background: T.bgSubtle, border: `1px solid ${T.border}`, borderRadius: 10 }}>
              {['Work', 'Learning'].map((opt) => (
                <button key={opt} onClick={() => setType(opt)} style={{
                  padding: '8px 18px', borderRadius: 7, border: 'none',
                  background: type === opt ? T.surface : 'transparent',
                  color: type === opt ? T.text : T.textMuted,
                  font: `${type === opt ? 600 : 500} 13px/1 ${FONT_SANS}`,
                  cursor: 'pointer',
                  border: type === opt ? `1px solid ${T.border}` : '1px solid transparent',
                }}>{opt}</button>
              ))}
            </div>
          </Field>

          <Field label="Category">
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '0 12px',
              background: T.surface, border: `1px solid ${T.borderInput}`, borderRadius: 10,
            }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: cat.hue }} />
              <select value={cat.name} onChange={(e) => setCat(CATEGORIES.find(c => c.name === e.target.value))}
                style={{
                  flex: 1, height: 42, border: 'none', background: 'transparent',
                  font: `400 14px/1.5 ${FONT_SANS}`, color: T.text, outline: 'none', appearance: 'none',
                }}>
                {CATEGORIES.map((c) => <option key={c.name} value={c.name} style={{ background: T.surface, color: T.text }}>{c.name}</option>)}
              </select>
              <span style={{ color: T.textMuted }}><I.Chevron /></span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {cat.sub.map((s) => (
                <span key={s} style={{
                  padding: '4px 9px', borderRadius: 999,
                  background: T.bgSubtle, color: T.textMuted,
                  border: `1px solid ${T.border}`,
                  font: `500 11.5px/1.3 ${FONT_SANS}`,
                }}>{s}</span>
              ))}
            </div>
          </Field>

          <Field label="What did you do?" hint="One line, a list, or a full reflection.">
            <textarea defaultValue="Refactored auth into a single guard. Tests dropped by half once the responsibilities were separated." rows={5} style={{
              width: '100%', padding: '12px 14px',
              background: T.surface, color: T.text,
              border: `1px solid ${T.borderInput}`, borderRadius: 10,
              font: `400 14px/1.6 ${FONT_SANS}`, resize: 'vertical', outline: 'none',
              boxSizing: 'border-box',
            }} />
          </Field>

          <Field label="Productivity score" hint={`${score} / 10`}>
            <input type="range" min="1" max="10" value={score} onChange={(e) => setScore(+e.target.value)} style={{
              width: '100%', accentColor: T.primary,
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', font: `500 10.5px/1 ${FONT_MONO}`, color: T.textFaint, marginTop: 4 }}>
              <span>1</span><span>5</span><span>10</span>
            </div>
          </Field>
        </div>

        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${T.border}`,
          display: 'flex', gap: 10, justifyContent: 'flex-end',
        }}>
          <button onClick={onClose} style={{
            padding: '11px 16px', borderRadius: 10, border: 'none',
            background: 'transparent', color: T.textMuted,
            font: `600 13.5px/1 ${FONT_SANS}`, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={onClose} style={{
            padding: '11px 18px', borderRadius: 10, border: 'none',
            background: tint(T.primary, 0.16), color: T.primary,
            font: `600 13.5px/1 ${FONT_SANS}`, cursor: 'pointer',
          }}>Save entry</button>
        </div>
      </aside>
    </React.Fragment>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, gap: 12 }}>
        <label style={{ font: `600 12.5px/1.4 ${FONT_SANS}`, color: T.text, whiteSpace: 'nowrap' }}>{label}</label>
        {hint && <span style={{ font: `400 12px/1.4 ${FONT_SANS}`, color: T.textMuted, fontFamily: FONT_MONO, fontWeight: 500, whiteSpace: 'nowrap' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// ───────────────────────────── App shell ─────────────────────────────
function Dashboard() {
  const [period, setPeriod] = React.useState('30d');
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [empty, setEmpty] = React.useState(false);

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: CR.bg, color: CR.text,
      fontFamily: FONT_SANS,
    }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar
          period={period} onPeriod={setPeriod}
          onAdd={() => setSheetOpen(true)}
          empty={empty} onToggleEmpty={() => setEmpty((v) => !v)}
        />
        <div style={{ padding: '24px 32px 60px', flex: 1 }}>
          <StatsRow empty={empty} />
          <ActivityCard empty={empty} />
          <RecentEntries empty={empty} onAdd={() => setSheetOpen(true)} />
          <ProductivityTrend empty={empty} />
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '20px 0 0', marginTop: 8,
            borderTop: `1px solid ${CR.border}`,
            font: `400 12px/1.5 ${FONT_SANS}`, color: CR.textFaint,
          }}>
            <span>Last sync · just now</span>
            <a href="Landing Page.html" style={{ color: CR.textMuted, textDecoration: 'none', font: `500 12.5px/1 ${FONT_SANS}`, whiteSpace: 'nowrap' }}>← Back to landing</a>
          </div>
        </div>
      </main>

      <AddEntrySheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}

Object.assign(window, { Dashboard, StatsRow, ActivityCard, RecentEntries, ProductivityTrend, SplitStatCard });
})();
