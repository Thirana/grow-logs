// Grow Logs — Landing page
// Uses the dark Grow Logs design system directly (window.GL_TOKENS.dark).
// Deep navy bg, cream ink, sage-mint accent. Cream hard-border is the
// signature on chunky elements — used on the hero CTA and dashboard frame.

const T = window.GL_TOKENS.dark;
const FONT_SANS = window.GL_TOKENS.type.sans;
const FONT_MONO = window.GL_TOKENS.type.mono;
const tint = window.glTint;

// ───────────────────────────── icons ─────────────────────────────
const IconLogo = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    {/* bar-stack mark from the DS brand intro */}
    <rect x="2"  y="11" width="2.6" height="9"  rx="0.6" fill={T.text} />
    <rect x="6"  y="7"  width="2.6" height="13" rx="0.6" fill={T.text} />
    <rect x="10" y="3"  width="2.6" height="17" rx="0.6" fill={T.primary} />
    <rect x="14" y="9"  width="2.6" height="11" rx="0.6" fill={T.text} />
    <rect x="18" y="13" width="2.6" height="7"  rx="0.6" fill={T.text} />
  </svg>
);

const IconArrow = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7h8M7 3l4 4-4 4"/>
  </svg>
);

const IconCheck = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 7.5l3 3 6-7"/>
  </svg>
);

const IconPen = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 19l3.5-1 11-11a2 2 0 0 0-2.8-2.8l-11 11L3 19z"/>
    <path d="M12.5 6.5l3 3"/>
  </svg>
);

const IconFolder = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h7a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 18 18H4.5A1.5 1.5 0 0 1 3 16.5v-10z"/>
  </svg>
);

const IconChart = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17h16"/>
    <path d="M6 17v-5"/>
    <path d="M10 17V8"/>
    <path d="M14 17v-7"/>
    <path d="M18 17V5"/>
  </svg>
);

const IconCalendar = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="16" height="14" rx="2" />
    <path d="M3 9h16" />
    <path d="M7 3v4M15 3v4" />
    <circle cx="11" cy="13.5" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

const IconBook = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H10v15H5.5A1.5 1.5 0 0 1 4 16.5v-12z" />
    <path d="M18 4.5A1.5 1.5 0 0 0 16.5 3H12v15h4.5A1.5 1.5 0 0 0 18 16.5v-12z" />
  </svg>
);

const IconBriefcase = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="16" height="11" rx="2" />
    <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h3A1.5 1.5 0 0 1 14 5.5V7" />
    <path d="M3 12h16" />
  </svg>
);

// ───────────────────────────── primitives ─────────────────────────────
// Buttons follow the DS Notion-style soft-tint pattern. The cream
// hard-border + offset shadow is reserved for the signature hero CTA
// (the "chunky" treatment from the tokens file).
function Button({ variant = 'primary', size = 'lg', children, trailing, leading, style }) {
  const sizes = {
    sm: { padY: 6,  padX: 12, fs: 13, gap: 6,  radius: 8 },
    md: { padY: 9,  padX: 14, fs: 14, gap: 8,  radius: 8 },
    lg: { padY: 13, padX: 22, fs: 15, gap: 10, radius: 10 },
  }[size];

  const variants = {
    // soft-tinted sage chip (DS primary)
    primary: {
      background: tint(T.primary, 0.16),
      color: T.primary,
    },
    secondary: {
      background: tint(T.text, 0.06),
      color: T.text,
    },
    ghost: {
      background: 'transparent',
      color: T.textMuted,
    },
  }[variant];

  return (
    <button style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: sizes.gap,
      padding: `${sizes.padY}px ${sizes.padX}px`,
      font: `600 ${sizes.fs}px/1 ${FONT_SANS}`,
      letterSpacing: '-0.005em',
      borderRadius: sizes.radius,
      border: variants.border || 'none',
      cursor: 'pointer',
      transition: 'transform .12s ease, box-shadow .12s ease, background-color .12s ease',
      whiteSpace: 'nowrap',
      ...variants,
      ...style,
    }}>
      {leading}
      {children}
      {trailing}
    </button>
  );
}

function Eyebrow({ children, style }) {
  return (
    <div style={{
      font: `700 11px/1.4 ${FONT_SANS}`,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: T.textMuted,
      ...style,
    }}>{children}</div>
  );
}

// ───────────────────────────── Nav ─────────────────────────────
function Nav() {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '24px 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <IconLogo />
        <span style={{ font: `700 17px/1 ${FONT_SANS}`, letterSpacing: '-0.015em', color: T.text }}>
          Grow Logs
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <a href="#features" style={{
          font: `500 14px/1 ${FONT_SANS}`, color: T.textMuted,
          padding: '8px 12px', textDecoration: 'none',
        }}>Features</a>
        <a href="#testimonials" style={{
          font: `500 14px/1 ${FONT_SANS}`, color: T.textMuted,
          padding: '8px 12px', textDecoration: 'none',
        }}>Stories</a>
        <a href="#pricing" style={{
          font: `500 14px/1 ${FONT_SANS}`, color: T.textMuted,
          padding: '8px 12px', textDecoration: 'none',
        }}>Pricing</a>
        <span style={{ width: 1, height: 18, background: T.border, margin: '0 8px' }} />
        <a href="#login" style={{
          font: `600 14px/1 ${FONT_SANS}`, color: T.text,
          padding: '8px 12px', textDecoration: 'none',
        }}>Log in</a>
        <Button variant="primary" size="md">Get started</Button>
      </div>
    </nav>
  );
}

// ───────────────────────────── Hero ─────────────────────────────
function Hero() {
  return (
    <section style={{ position: 'relative', paddingTop: 80, paddingBottom: 80, textAlign: 'center' }}>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 820, margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px 5px 6px',
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 999,
          font: `500 12px/1.4 ${FONT_SANS}`,
          color: T.textMuted,
          marginBottom: 32,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '2px 8px', borderRadius: 999,
            background: T.primarySoft, color: T.primary,
            font: `700 10.5px/1.4 ${FONT_SANS}`, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>New</span>
          <span style={{ color: T.text }}>Free to start · no setup required · built for developers</span>
          <IconArrow size={12} />
        </div>

        <h1 data-hero-h1 style={{
          font: `700 78px/1.0 ${FONT_SANS}`,
          letterSpacing: '-0.04em',
          color: T.text,
          margin: '0 0 24px',
          textWrap: 'balance',
        }}>
          Never forget what<br />
          you learned or <span style={{ color: T.primary }}>built</span>.
        </h1>

        <p style={{
          font: `400 20px/1.55 ${FONT_SANS}`,
          color: T.textMuted,
          margin: '0 auto 40px',
          maxWidth: 620,
          textWrap: 'pretty',
        }}>
          Grow Logs is a daily logging tool for developers and self-learners. Track your work and learning, organised by your own categories — so your progress is always visible and never lost.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="primary" size="lg" trailing={<IconArrow />}>Start for free</Button>
          <a href="Dashboard.html" style={{ textDecoration: 'none' }}><Button variant="secondary" size="lg">See a demo</Button></a>
        </div>

        <div style={{
          display: 'flex', gap: 28, justifyContent: 'center',
          marginTop: 36, flexWrap: 'wrap',
        }}>
          {['Free to start', 'No setup required', 'Built for developers'].map((t) => (
            <div key={t} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              font: `500 13px/1 ${FONT_SANS}`, color: T.textMuted,
              whiteSpace: 'nowrap',
            }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 18, height: 18, borderRadius: 999,
                background: T.primarySoft, color: T.primary,
              }}><IconCheck size={11} /></span>
              {t}
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, marginTop: 80 }}>
        <HeroSpot />
      </div>
    </section>
  );
}

// ───────────────────────────── Hero spot ─────────────────────────────
// A curated "product moment" — one entry card on the left, the
// work/learning split + an 8-week productivity sparkline on the right.
// Pulls SplitStatCard from dashboard.jsx so it stays in sync with the
// real product.
function HeroSpot() {
  const SplitStatCard = window.SplitStatCard;
  return (
    <div style={{
      maxWidth: 940, margin: '0 auto',
      display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 18,
      textAlign: 'left',
      alignItems: 'stretch',
    }} data-row>
      <HeroEntryCard />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {SplitStatCard && <SplitStatCard workPct={62} learnPct={38} />}
        <HeroTrend />
      </div>
    </div>
  );
}

function HeroEntryCard() {
  return (
    <div style={{
      position: 'relative',
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      padding: 28,
      boxShadow: T.shadowLg,
      display: 'flex', flexDirection: 'column', gap: 14,
      minHeight: 280,
    }}>
      {/* date + score */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{
          font: `600 11px/1.2 ${FONT_MONO}`, color: T.textFaint,
          letterSpacing: '0.10em', textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>14 May · Today</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '5px 11px', borderRadius: 8,
          background: T.primarySoft, color: T.primary,
          font: `600 12px/1.2 ${FONT_MONO}`, whiteSpace: 'nowrap',
          fontVariantNumeric: 'tabular-nums',
        }}><span style={{ opacity: 0.6, fontWeight: 400 }}>score</span> 8 / 10</span>
      </div>

      {/* type + category */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999,
          background: T.workBg, color: T.workFg,
          font: `600 11px/1.3 ${FONT_SANS}`, whiteSpace: 'nowrap',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: 'currentColor' }} />
          Work
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '4px 10px 4px 8px', borderRadius: 999,
          background: T.surface2, border: `1px solid ${T.border}`,
          color: T.text, font: `500 11.5px/1.3 ${FONT_SANS}`, whiteSpace: 'nowrap',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: T.swatch[0] }} />
          Backend
          <span style={{ color: T.textFaint, margin: '0 2px' }}>/</span>
          <span style={{ color: T.textMuted }}>NestJS</span>
        </span>
      </div>

      {/* title */}
      <div style={{
        font: `700 22px/1.32 ${FONT_SANS}`, letterSpacing: '-0.018em',
        color: T.text, marginTop: 2, textWrap: 'balance',
      }}>
        Refactored auth into a single guard.
      </div>

      {/* body */}
      <div style={{
        font: `400 14.5px/1.65 ${FONT_SANS}`, color: T.textMuted,
        fontStyle: 'italic',
      }}>
        Pulled the refresh-token rotation out of the login handler. Tests dropped by half once the responsibilities were separated.
      </div>

      {/* footer */}
      <div style={{
        marginTop: 'auto', paddingTop: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: `1px solid ${T.border}`,
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          font: `500 11.5px/1 ${FONT_SANS}`, color: T.primary,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 14, height: 14, borderRadius: 999, background: T.primarySoft,
          }}><IconCheck size={9} /></span>
          Saved · just now
        </span>
        <span style={{ font: `500 11px/1 ${FONT_MONO}`, color: T.textFaint }}>↵ enter</span>
      </div>
    </div>
  );
}

function HeroTrend() {
  // last 8 weeks; null = no scored entries that week
  const trend = [6.8, 7.1, 6.5, 7.4, null, 7.6, 7.8, 8.0];
  const W = 260, H = 64, PAD = 6;
  const cw = W - PAD * 2, ch = H - 8;
  const pts = trend.map((v, i) => ({
    x: PAD + (i / (trend.length - 1)) * cw,
    y: v == null ? null : 4 + (1 - v / 10) * ch,
    v, i,
  }));
  // segments around null
  const segs = [];
  let cur = [];
  pts.forEach((p) => {
    if (p.y == null) { if (cur.length > 1) segs.push(cur); cur = []; }
    else cur.push(p);
  });
  if (cur.length > 1) segs.push(cur);
  const last = pts[pts.length - 1];

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 16, padding: 20,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{
        font: `700 10.5px/1.2 ${FONT_SANS}`,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: T.textMuted,
      }}>Productivity · 8 wk</div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{
          font: `700 28px/1 ${FONT_SANS}`, letterSpacing: '-0.025em', color: T.text,
          fontVariantNumeric: 'tabular-nums',
        }}>{last.v.toFixed(1)}<span style={{ fontSize: 15, color: T.textMuted, fontWeight: 600 }}> / 10</span></span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 8px', borderRadius: 999,
          background: T.primarySoft, color: T.primary,
          font: `600 11px/1.3 ${FONT_SANS}`, whiteSpace: 'nowrap',
        }}>↗ +1.2</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 56, display: 'block' }}>
        <defs>
          <linearGradient id="heroTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={T.primary} stopOpacity="0.25" />
            <stop offset="100%" stopColor={T.primary} stopOpacity="0" />
          </linearGradient>
        </defs>
        {segs.map((seg, si) => {
          const d = seg.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
          const f = seg[0], l = seg[seg.length - 1];
          const area = `${d} L${l.x},${H} L${f.x},${H} Z`;
          return (
            <g key={si}>
              <path d={area} fill="url(#heroTrendFill)" />
              <path d={d} fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}
        <circle cx={last.x} cy={last.y} r={3.5} fill={T.surface} stroke={T.primary} strokeWidth="2" />
      </svg>
    </div>
  );
}


// ───────────────────────────── Problem ─────────────────────────────
function Problem() {
  const problems = [
    {
      icon: <IconCalendar />,
      title: 'You forget what you did last week.',
      body: 'Performance review time comes around and you are staring at a blank page trying to remember what you actually worked on for six months.',
    },
    {
      icon: <IconBook />,
      title: 'Your learning has no visible shape.',
      body: 'You study every day but have no record of how far you have come or which areas you have actually covered.',
    },
    {
      icon: <IconBriefcase />,
      title: 'Interviews catch you off guard.',
      body: 'You know you have grown significantly, but when asked to articulate it, the specific examples are gone.',
    },
  ];
  return (
    <section id="problem" style={{ padding: '120px 0 40px' }}>
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 56px' }}>
        <Eyebrow style={{ marginBottom: 14 }}>The problem</Eyebrow>
        <h2 data-section-h2 style={{
          font: `700 44px/1.08 ${FONT_SANS}`, letterSpacing: '-0.028em',
          color: T.text, margin: '0 0 14px', textWrap: 'balance',
        }}>
          Sound familiar?
        </h2>
        <p style={{ font: `400 17px/1.55 ${FONT_SANS}`, color: T.textMuted, margin: 0 }}>
          A few frustrations every learner and engineer eventually runs into.
        </p>
      </div>

      <div data-row style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20,
      }}>
        {problems.map((p, i) => (
          <div key={i} style={{
            background: T.bgSubtle,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            padding: 28,
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, borderRadius: 12,
              background: T.surface2, color: T.textMuted,
              border: `1px solid ${T.border}`,
              marginBottom: 22,
            }}>{p.icon}</div>
            <div style={{
              font: `700 20px/1.3 ${FONT_SANS}`, letterSpacing: '-0.015em',
              color: T.text, marginBottom: 10, textWrap: 'balance',
            }}>{p.title}</div>
            <div style={{
              font: `400 15px/1.6 ${FONT_SANS}`, color: T.textMuted,
            }}>{p.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ───────────────────────────── Features ─────────────────────────────
function Features() {
  const items = [
    {
      icon: <IconPen />,
      eyebrow: 'Log',
      title: 'Log work and learning separately.',
      body: 'Tag every entry as Work or Learning. Add a productivity score to reflect how focused and effective you felt. Build an honest record, not just a list.',
      preview: <PreviewLog />,
    },
    {
      icon: <IconFolder />,
      eyebrow: 'Organise',
      title: 'Organised by your own categories.',
      body: 'Define up to 5 main categories and their sub-categories during onboarding — Backend, System Design, Soft Skills, whatever fits your journey. Every entry slots in exactly where it belongs.',
      preview: <PreviewCategories />,
    },
    {
      icon: <IconChart />,
      eyebrow: 'Review',
      title: 'See your progress over time.',
      body: 'Your dashboard shows activity breakdowns by category, productivity trends, and a full log history. Know exactly what to say in your next interview or performance review.',
      preview: <PreviewChart />,
    },
  ];

  return (
    <section id="features" style={{ padding: '80px 0 40px' }}>
      <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
        <Eyebrow style={{ marginBottom: 14 }}>Features</Eyebrow>
        <h2 data-section-h2 style={{
          font: `700 44px/1.08 ${FONT_SANS}`, letterSpacing: '-0.028em',
          color: T.text, margin: '0 0 14px', textWrap: 'balance',
        }}>
          Everything you need to track your growth.
        </h2>
        <p style={{ font: `400 17px/1.55 ${FONT_SANS}`, color: T.textMuted, margin: 0, textWrap: 'pretty' }}>
          One place for your work logs and your learning — structured, searchable, and always there when you need it.
        </p>
      </div>

      <div data-row style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20,
      }}>
        {items.map((it, i) => (
          <div key={i} style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            padding: 28,
            display: 'flex', flexDirection: 'column',
            boxShadow: T.shadow,
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, borderRadius: 12,
              background: T.primarySoft, color: T.primary,
              marginBottom: 22,
            }}>{it.icon}</div>
            <Eyebrow style={{ marginBottom: 8 }}>{it.eyebrow}</Eyebrow>
            <div style={{
              font: `700 22px/1.25 ${FONT_SANS}`, letterSpacing: '-0.018em',
              color: T.text, marginBottom: 10, textWrap: 'balance',
            }}>{it.title}</div>
            <div style={{
              font: `400 15px/1.55 ${FONT_SANS}`, color: T.textMuted,
              marginBottom: 24,
            }}>{it.body}</div>
            <div style={{ marginTop: 'auto' }}>{it.preview}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Feature previews ──
function PreviewLog() {
  return (
    <div style={{
      background: T.bgSubtle, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{
          padding: '3px 8px', borderRadius: 999,
          background: T.workBg, color: T.workFg,
          font: `500 10.5px/1.3 ${FONT_SANS}`,
        }}>Work</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 8px 3px 6px', borderRadius: 999,
          background: T.surface, border: `1px solid ${T.border}`,
          font: `500 10.5px/1.3 ${FONT_SANS}`, color: T.text,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: T.swatch[0] }} />
          Engineering
        </span>
      </div>
      <div style={{
        font: `500 13px/1.5 ${FONT_SANS}`, color: T.text,
      }}>
        Untangled the refresh-token rotation from the login&nbsp;handler.
        <span style={{
          display: 'inline-block', width: 1, height: 13, background: T.primary,
          marginLeft: 2, verticalAlign: '-2px',
          animation: 'gl-blink 1s steps(2) infinite',
        }} />
      </div>
    </div>
  );
}

function PreviewCategories() {
  const cats = [
    ['Engineering',  T.swatch[0], 38],
    ['Reading',      T.swatch[1], 24],
    ['Side project', T.swatch[2], 17],
    ['Writing',      T.swatch[4], 9],
  ];
  return (
    <div style={{
      background: T.bgSubtle, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {cats.map(([label, color, n]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, background: color }} />
          <span style={{ font: `500 12.5px/1 ${FONT_SANS}`, color: T.text, flex: 1 }}>{label}</span>
          <span style={{ font: `500 11px/1 ${FONT_MONO}`, color: T.textFaint }}>{n}</span>
        </div>
      ))}
    </div>
  );
}

function PreviewChart() {
  const weeks = [22, 38, 30, 52, 44, 64, 58, 78];
  const max = 80;
  const w = 240, h = 64;
  const pts = weeks.map((v, i) => {
    const x = (i / (weeks.length - 1)) * w;
    const y = h - (v / max) * h;
    return [x, y];
  });
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${d} L${w},${h} L0,${h} Z`;
  return (
    <div style={{
      background: T.bgSubtle, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ font: `500 11px/1 ${FONT_SANS}`, color: T.textMuted }}>Last 8 weeks</span>
        <span style={{ font: `600 11px/1 ${FONT_MONO}`, color: T.primary }}>↗ +28%</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 64, display: 'block' }}>
        <path d={area} fill={T.primary} opacity="0.14" />
        <path d={d} fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 3.5 : 0} fill={T.primary} />
        ))}
      </svg>
    </div>
  );
}

// ───────────────────────────── Live preview ─────────────────────────────
// Uses the real dashboard sub-components from dashboard.jsx — same code
// the full Dashboard.html ships. Click the chart tabs, filter the entries,
// hover the bars; everything works in place.
function LivePreview() {
  const D = {
    StatsRow:           window.StatsRow,
    ActivityCard:       window.ActivityCard,
    RecentEntries:      window.RecentEntries,
    ProductivityTrend:  window.ProductivityTrend,
  };
  const openDash = () => { window.location.href = 'Dashboard.html'; };

  return (
    <section id="preview" style={{ padding: '100px 0 40px' }}>
      <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 56px' }}>
        <Eyebrow style={{ marginBottom: 14 }}>Live preview</Eyebrow>
        <h2 data-section-h2 style={{
          font: `700 44px/1.08 ${FONT_SANS}`, letterSpacing: '-0.028em',
          color: T.text, margin: '0 0 14px', textWrap: 'balance',
        }}>
          See it in <span style={{ color: T.primary }}>action</span>.
        </h2>
        <p style={{ font: `400 17px/1.55 ${FONT_SANS}`, color: T.textMuted, margin: 0, textWrap: 'pretty' }}>
          The real dashboard, embedded right here. Switch the chart tabs, filter the entries, hover the bars — it all works.
        </p>
      </div>

      <div style={{
        background: T.bgSubtle,
        border: `1px solid ${T.border}`,
        borderRadius: 18,
        padding: 20,
        boxShadow: T.shadowLg,
        position: 'relative',
      }}>
        {/* tiny chrome bar so it reads as a screen, not raw cards */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 8px 16px',
          borderBottom: `1px solid ${T.border}`,
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconLogo size={16} />
            <span style={{ font: `700 13px/1 ${FONT_SANS}`, letterSpacing: '-0.01em', color: T.text }}>
              Dashboard
            </span>
            <span style={{ font: `500 11px/1.4 ${FONT_MONO}`, color: T.textFaint, marginLeft: 6, whiteSpace: 'nowrap' }}>
              live · click around
            </span>
          </div>
          <a href="Dashboard.html" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            font: `600 12.5px/1 ${FONT_SANS}`, color: T.primary,
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>Open full dashboard <IconArrow size={12} /></a>
        </div>

        <D.StatsRow empty={false} />
        <D.ActivityCard empty={false} />
        <D.RecentEntries empty={false} onAdd={openDash} />
        <D.ProductivityTrend empty={false} />
      </div>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <a href="Dashboard.html" style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="lg" trailing={<IconArrow />}>Try the full dashboard</Button>
        </a>
      </div>
    </section>
  );
}

// ───────────────────────────── How it works ─────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Set up your categories.',
      body: 'Define the areas you are tracking — your stack, your learning topics, your goals.',
    },
    {
      n: '02',
      title: 'Log something every day.',
      body: 'Takes less than a minute. A sentence, a bullet list, or a full reflection — whatever feels right.',
    },
    {
      n: '03',
      title: 'Watch your progress appear.',
      body: 'Your dashboard fills up. Your categories grow. Your growth becomes visible and articulable.',
    },
  ];
  return (
    <section id="how" style={{ padding: '100px 0 60px' }}>
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 64px' }}>
        <Eyebrow style={{ marginBottom: 14 }}>How it works</Eyebrow>
        <h2 data-section-h2 style={{
          font: `700 44px/1.08 ${FONT_SANS}`, letterSpacing: '-0.028em',
          color: T.text, margin: 0, textWrap: 'balance',
        }}>
          Up and running in minutes.
        </h2>
      </div>

      <div data-row style={{
        position: 'relative',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32,
      }}>
        {/* connector hairline */}
        <div data-hide-mobile style={{
          position: 'absolute', top: 36, left: '16.66%', right: '16.66%', height: 1,
          background: `linear-gradient(to right, transparent, ${T.border} 12%, ${T.border} 88%, transparent)`,
          zIndex: 0,
        }} />
        {steps.map((s, i) => (
          <div key={i} style={{
            position: 'relative', zIndex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14,
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 72, height: 72, borderRadius: 999,
              background: T.bgSubtle, border: `1px solid ${T.border}`,
              font: `700 24px/1 ${FONT_MONO}`, color: T.primary,
              fontVariantNumeric: 'tabular-nums',
            }}>{s.n}</div>
            <div style={{
              font: `700 22px/1.25 ${FONT_SANS}`, letterSpacing: '-0.018em',
              color: T.text, marginTop: 8, textWrap: 'balance',
            }}>{s.title}</div>
            <div style={{ font: `400 15px/1.6 ${FONT_SANS}`, color: T.textMuted }}>{s.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ───────────────────────────── Testimonials ─────────────────────────────
function Testimonials() {
  const quotes = [
    {
      q: 'I used to dread performance review season. Now I just open Grow Logs and the evidence is already there.',
      name: 'Software engineer',
      role: '3 years experience',
      hue: T.swatch[0],
    },
    {
      q: 'I study every day but always felt like I had nothing to show for it. Seeing the categories fill up changed that completely.',
      name: 'Self-taught developer',
      role: 'Career switching',
      hue: T.swatch[1],
    },
    {
      q: 'The productivity score is the detail that makes it different. I can see not just what I did but how well I was actually focused.',
      name: 'Senior developer',
      role: 'Upskilling in system design',
      hue: T.swatch[2],
    },
  ];

  return (
    <section id="testimonials" style={{ padding: '80px 0' }}>
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 56px' }}>
        <Eyebrow style={{ marginBottom: 14 }}>Stories</Eyebrow>
        <h2 data-section-h2 style={{
          font: `700 40px/1.1 ${FONT_SANS}`, letterSpacing: '-0.025em',
          color: T.text, margin: '0 0 12px', textWrap: 'balance',
        }}>
          Built for people who never stop learning.
        </h2>
      </div>

      <div data-row style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {quotes.map((q, i) => (
          <figure key={i} style={{
            margin: 0,
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            padding: 28,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24,
            boxShadow: T.shadow,
          }}>
            <blockquote style={{
              margin: 0,
              font: `500 17px/1.5 ${FONT_SANS}`, letterSpacing: '-0.012em',
              color: T.text, textWrap: 'pretty',
            }}>
              <span style={{ color: T.primary, fontWeight: 700, marginRight: 2 }}>“</span>
              {q.q}
              <span style={{ color: T.primary, fontWeight: 700, marginLeft: 1 }}>”</span>
            </blockquote>
            <figcaption style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 38, borderRadius: 999,
                background: q.hue, color: T.primaryInk,
                font: `700 14px/1 ${FONT_SANS}`, letterSpacing: '-0.01em',
              }}>{q.name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()}</span>
              <div>
                <div style={{ font: `600 14px/1.3 ${FONT_SANS}`, color: T.text }}>{q.name}</div>
                <div style={{ font: `400 12.5px/1.3 ${FONT_SANS}`, color: T.textMuted, marginTop: 2 }}>{q.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

// ───────────────────────────── Bottom CTA ─────────────────────────────
function BottomCTA() {
  return (
    <section style={{ padding: '80px 0 100px' }}>
      <div style={{
        position: 'relative',
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 24,
        padding: '80px 40px',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* warm sage halo */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: `radial-gradient(50% 80% at 50% 0%, ${tint(T.primary, 0.10)} 0%, transparent 70%)`,
        }} />
        {/* bar-stack echo, right */}
        <div style={{
          position: 'absolute', right: 32, bottom: 0, display: 'flex', gap: 6, alignItems: 'flex-end',
          opacity: 0.22,
        }}>
          {[40, 64, 28, 80, 52, 44, 96, 36].map((bh, i) => (
            <div key={i} style={{
              width: 14, height: bh,
              background: i === 3 ? T.primary : T.text,
              borderRadius: 2,
            }} />
          ))}
        </div>
        <div style={{
          position: 'absolute', left: 32, top: 0, display: 'flex', gap: 6, alignItems: 'flex-start',
          opacity: 0.14, transform: 'scaleY(-1)',
        }}>
          {[32, 48, 20, 64].map((bh, i) => (
            <div key={i} style={{ width: 14, height: bh, background: T.text, borderRadius: 2 }} />
          ))}
        </div>

        <h2 data-cta-h2 style={{
          position: 'relative',
          font: `700 56px/1.05 ${FONT_SANS}`, letterSpacing: '-0.035em',
          color: T.text, margin: '0 auto 18px', maxWidth: 760, textWrap: 'balance',
        }}>
          Start building a record of your <span style={{ color: T.primary }}>growth</span>.
        </h2>
        <p style={{
          position: 'relative',
          font: `400 18px/1.55 ${FONT_SANS}`, color: T.textMuted,
          margin: '0 auto 36px', maxWidth: 560,
        }}>
          The best time to start was your first day of learning. The second best time is today.
        </p>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Button variant="primary" size="lg" trailing={<IconArrow />}>Start for free</Button>
          <span style={{ font: `400 12.5px/1 ${FONT_SANS}`, color: T.textFaint }}>No credit card required</span>
        </div>
      </div>
    </section>
  );
}

// ───────────────────────────── Footer ─────────────────────────────
function Footer() {
  const cols = [
    ['Product',   ['Features', 'Pricing', 'Changelog', 'Roadmap']],
    ['Company',   ['About', 'Blog', 'Contact']],
    ['Legal',     ['Privacy', 'Terms', 'Security']],
  ];
  return (
    <footer style={{
      borderTop: `1px solid ${T.border}`,
      padding: '48px 0 40px',
      display: 'grid', gridTemplateColumns: '1.6fr repeat(3, 1fr)', gap: 32,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <IconLogo size={20} />
          <span style={{ font: `700 16px/1 ${FONT_SANS}`, letterSpacing: '-0.015em', color: T.text }}>
            Grow Logs
          </span>
        </div>
        <div style={{ font: `400 13px/1.55 ${FONT_SANS}`, color: T.textMuted, maxWidth: 280 }}>
          A daily log book for the work you do and the things you learn.
        </div>
        <div style={{
          font: `400 12px/1 ${FONT_MONO}`, color: T.textFaint, marginTop: 24,
        }}>© 2026 Grow Logs · Made for people who keep notes.</div>
      </div>
      {cols.map(([h, items]) => (
        <div key={h}>
          <div style={{
            font: `700 11px/1 ${FONT_SANS}`, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: T.textFaint, marginBottom: 16,
          }}>{h}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} style={{
                font: `500 13.5px/1 ${FONT_SANS}`, color: T.textMuted, textDecoration: 'none',
              }}>{l}</a>
            ))}
          </div>
        </div>
      ))}
    </footer>
  );
}

// ───────────────────────────── Page shell ─────────────────────────────
function LandingPage() {
  return (
    <div style={{
      background: T.bg,
      minHeight: '100vh',
      color: T.text,
      fontFamily: FONT_SANS,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* page-level top gradient — sage halo behind the nav and hero, full-width */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1100,
        zIndex: 0, pointerEvents: 'none',
        background: `
          radial-gradient(70% 45% at 50% 0%, ${tint(T.primary, 0.16)} 0%, transparent 65%),
          radial-gradient(45% 35% at 50% 25%, ${tint('#F2EAD3', 0.04)} 0%, transparent 80%),
          linear-gradient(to bottom, transparent 55%, ${T.bg} 100%)
        `,
      }} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <Nav />
        <Hero />
        <Problem />
        <Features />
        <LivePreview />
        <HowItWorks />
        <Testimonials />
        <BottomCTA />
        <Footer />
      </div>
    </div>
  );
}

Object.assign(window, { LandingPage });
