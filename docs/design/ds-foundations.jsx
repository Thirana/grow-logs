// Grow Logs — Foundations artboards: brand intro, palette, type scale.

const T = window.GL_TOKENS;

// ───────────────────────────── shared helpers ─────────────────────────────
function Surface({ theme, children, style }) {
  const t = T[theme];
  return (
    <div style={{
      background: t.bg,
      color: t.text,
      fontFamily: T.type.sans,
      padding: 40,
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      ...style,
    }}>{children}</div>
  );
}

function Eyebrow({ theme, children }) {
  return (
    <div style={{
      font: `600 11px/1.4 ${T.type.sans}`,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: T[theme].textMuted,
      marginBottom: 14,
    }}>{children}</div>
  );
}

function ArtTitle({ theme, children, sub }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        font: `600 28px/1.15 ${T.type.sans}`,
        letterSpacing: '-0.015em',
        color: T[theme].text,
      }}>{children}</div>
      {sub && <div style={{
        font: `400 14px/1.55 ${T.type.sans}`,
        color: T[theme].textMuted,
        marginTop: 6,
        maxWidth: 540,
      }}>{sub}</div>}
    </div>
  );
}

// ───────────────────────────── Brand intro ─────────────────────────────
function BrandIntro({ theme }) {
  const t = T[theme];
  return (
    <Surface theme={theme} style={{ padding: 56, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <Eyebrow theme={theme}>Design System · v0.2</Eyebrow>
        <div style={{
          font: `700 72px/0.98 ${T.type.sans}`,
          letterSpacing: '-0.04em',
          color: t.text,
          marginBottom: 22,
          maxWidth: 760,
        }}>
          Log what you did.<br />
          <span style={{ color: t.primary }}>Notice the pattern.</span>
        </div>
        <div style={{
          font: `400 19px/1.55 ${T.type.sans}`,
          color: t.textMuted,
          maxWidth: 560,
        }}>
          A personal log book for work and learning — not a&nbsp;
          <span style={{ textDecoration: 'line-through', textDecorationColor: t.primary, textDecorationThickness: 2 }}>corporate dashboard</span>
          &nbsp;productivity tool. Deep navy, cream ink, one calm sage-mint that suggests growth without shouting.
        </div>
      </div>

      {/* abstract brand chips — three flat-coloured tiles, no illustrations */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginTop: 56 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            ['Navy',   t.bg],
            ['Mint',   t.primary],
            ['Cream',  t.text],
            ['Soft',   t.primarySoft],
          ].map(([label, color]) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px 10px 10px',
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 999,
              font: `600 13px/1 ${T.type.sans}`,
              color: t.text,
            }}>
              <span style={{ width: 18, height: 18, borderRadius: 999, background: color, boxShadow: `inset 0 0 0 1px ${t.border}` }} />
              {label}
            </div>
          ))}
        </div>

        {/* a flat geometric placeholder — abstract, not an illustration */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          {[40, 64, 28, 80, 52, 44, 96].map((h, i) => (
            <div key={i} style={{
              width: 14, height: h,
              background: i === 3 ? t.primary : t.text,
              borderRadius: 2,
            }} />
          ))}
        </div>
      </div>
    </Surface>
  );
}

// ───────────────────────────── Palette ─────────────────────────────
function Swatch({ theme, name, hex, role, big }) {
  const t = T[theme];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        height: big ? 96 : 72,
        borderRadius: 10,
        background: hex,
        boxShadow: `inset 0 0 0 1px ${t.border}`,
      }} />
      <div>
        <div style={{ font: `500 13px/1.3 ${T.type.sans}`, color: t.text }}>{name}</div>
        <div style={{ font: `500 11px/1.4 ${T.type.mono}`, color: t.textMuted, marginTop: 2 }}>{hex.toUpperCase()}</div>
        {role && <div style={{ font: `400 11px/1.4 ${T.type.sans}`, color: t.textFaint, marginTop: 1 }}>{role}</div>}
      </div>
    </div>
  );
}

function PaletteArtboard({ theme }) {
  const t = T[theme];
  const surfaces = [
    ['Background',     t.bg,           'Page canvas'],
    ['Surface',        t.surface,      'Card body'],
    ['Surface 2',      t.surface2,     'Nested / inset'],
    ['Border',         t.border,       'Hairlines'],
    ['Border strong',  t.borderStrong, 'Inputs, dividers'],
  ];
  const ink = [
    ['Text',         t.text,      'Primary'],
    ['Text muted',   t.textMuted, 'Labels, meta'],
    ['Text faint',   t.textFaint, 'Hints'],
  ];
  const accent = [
    ['Primary',       t.primary,     'Sage-mint · CTA'],
    ['Primary hover', t.primaryHover,'Pressed state'],
    ['Primary soft',  t.primarySoft, 'Pills, halos'],
  ];
  const semantic = [
    ['Work',     t.workBg,    'Tag bg'],
    ['Learning', t.learnBg,   'Tag bg'],
    ['Danger',   t.danger,    'Destructive'],
    ['Warning',  t.warning,   'Caution'],
  ];

  return (
    <Surface theme={theme}>
      <Eyebrow theme={theme}>Colour</Eyebrow>
      <ArtTitle theme={theme} sub="Deep navy surfaces, warm cream ink, one calm sage-mint accent for growth. Saturation stays measured so nothing reads like an alarm.">
        Palette
      </ArtTitle>

      <Group theme={theme} label="Surfaces">
        <Grid cols={5}>
          {surfaces.map(([n, h, r]) => <Swatch key={n} theme={theme} name={n} hex={h} role={r} />)}
        </Grid>
      </Group>

      <Group theme={theme} label="Ink">
        <Grid cols={5}>
          {ink.map(([n, h, r]) => <Swatch key={n} theme={theme} name={n} hex={h} role={r} />)}
        </Grid>
      </Group>

      <Group theme={theme} label="Accent · Sage">
        <Grid cols={5}>
          {accent.map(([n, h, r]) => <Swatch key={n} theme={theme} name={n} hex={h} role={r} big />)}
        </Grid>
      </Group>

      <Group theme={theme} label="Semantic & Tags">
        <Grid cols={5}>
          {semantic.map(([n, h, r]) => <Swatch key={n} theme={theme} name={n} hex={h} role={r} />)}
        </Grid>
      </Group>

      <Group theme={theme} label="Category swatches" lastless>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {t.swatch.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px 6px 6px', borderRadius: 999, background: t.surface, border: `1px solid ${t.border}` }}>
              <span style={{ width: 16, height: 16, borderRadius: 999, background: c }} />
              <span style={{ font: `500 11px/1 ${T.type.mono}`, color: t.textMuted }}>{c.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </Group>
    </Surface>
  );
}

function Group({ theme, label, children, lastless }) {
  const t = T[theme];
  return (
    <div style={{ marginBottom: lastless ? 0 : 28 }}>
      <div style={{
        font: `500 11px/1.4 ${T.type.sans}`,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: t.textFaint,
        marginBottom: 12,
      }}>{label}</div>
      {children}
    </div>
  );
}

function Grid({ cols, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 18 }}>{children}</div>
  );
}

// ───────────────────────────── Typography ─────────────────────────────
function TypographyArtboard({ theme }) {
  const t = T[theme];
  return (
    <Surface theme={theme}>
      <Eyebrow theme={theme}>Typography</Eyebrow>
      <ArtTitle theme={theme} sub="Inter, with conviction. Headings sit on 700 weight and very tight tracking — they're meant to land. Body breathes at 1.55–1.6.">
        Type scale
      </ArtTitle>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {T.type.scale.map((s) => (
          <div key={s.name} style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr 220px',
            alignItems: 'baseline',
            gap: 24,
            padding: '14px 0',
            borderBottom: `1px solid ${t.border}`,
          }}>
            <div>
              <div style={{ font: `500 13px/1.2 ${T.type.sans}`, color: t.text }}>{s.name}</div>
              <div style={{ font: `400 11px/1.4 ${T.type.mono}`, color: t.textMuted, marginTop: 2 }}>
                {s.px}/{Math.round(s.px * s.lh)} · {s.weight}
              </div>
            </div>
            <div style={{
              font: `${s.weight} ${s.px}px/${s.lh} ${T.type.sans}`,
              letterSpacing: s.tracking,
              color: t.text,
              ...(s.name === 'Overline' ? { textTransform: 'uppercase' } : {}),
            }}>
              {s.name === 'Body L' || s.name === 'Body'
                ? 'Shipped the refresh-token rotation. Half the test surface vanished overnight.'
                : 'Do the work. Log the work.'}
            </div>
            <div style={{ font: `400 12px/1.5 ${T.type.sans}`, color: t.textMuted }}>{s.use}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 36 }}>
        <Group theme={theme} label="Metric — sans, heavy, tabular">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
          }}>
            {[
              ['Display', '142', 'h logged this quarter'],
              ['Large',   '7.8', 'Avg. productivity'],
              ['Regular', '23',  'Entries this month'],
            ].map(([label, n, sub], i) => {
              const m = [T.type.metric.display, T.type.metric.large, T.type.metric.regular][i];
              return (
                <div key={label} style={{
                  padding: 24,
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: 12,
                  boxShadow: t.shadow,
                }}>
                  <div style={{ font: `500 11px/1 ${T.type.sans}`, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.textMuted }}>{label}</div>
                  <div style={{
                    font: `${m.weight} ${m.px}px/1 ${T.type[m.font]}`,
                    letterSpacing: m.tracking,
                    color: t.text,
                    margin: '14px 0 6px',
                    fontVariantNumeric: 'tabular-nums',
                  }}>{n}</div>
                  <div style={{ font: `400 13px/1.5 ${T.type.sans}`, color: t.textMuted }}>{sub}</div>
                </div>
              );
            })}
          </div>
        </Group>
      </div>
    </Surface>
  );
}

Object.assign(window, { BrandIntro, PaletteArtboard, TypographyArtboard, Surface, Group, Grid, ArtTitle, Eyebrow });
