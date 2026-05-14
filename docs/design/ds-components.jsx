// Grow Logs — Components artboards: buttons, badges, inputs, cards, preview.

const T2 = window.GL_TOKENS;

// ───────────────────────────── primitives ─────────────────────────────
function Button({ theme, variant = 'primary', size = 'md', children, leadingIcon }) {
  const t = T2[theme];
  const sizes = {
    sm: { padY: 6,  padX: 12, fs: 13, gap: 6,  radius: 8  },
    md: { padY: 9,  padX: 14, fs: 14, gap: 8,  radius: 8 },
    lg: { padY: 12, padX: 18, fs: 15, gap: 10, radius: 10 },
  }[size];

  // Notion-style soft-tinted buttons. Background is a tint of the action
  // colour at low alpha; label carries the colour at full saturation.
  // No borders, no shadows.
  const variants = {
    primary: {
      background: window.glTint(t.primary, 0.16),
      color: t.primary,
    },
    secondary: {
      background: window.glTint(t.text, 0.06),
      color: t.text,
    },
    ghost: {
      background: 'transparent',
      color: t.textMuted,
    },
    destructive: {
      background: window.glTint(t.danger, 0.12),
      color: t.danger,
    },
  }[variant];

  return (
    <button style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: sizes.gap,
      padding: `${sizes.padY}px ${sizes.padX}px`,
      font: `600 ${sizes.fs}px/1 ${T2.type.sans}`,
      letterSpacing: '-0.005em',
      borderRadius: sizes.radius,
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color .12s ease',
      ...variants,
    }}>
      {leadingIcon && <span style={{ display: 'inline-flex' }}>{leadingIcon}</span>}
      {children}
    </button>
  );
}

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 2.5v9M2.5 7h9"/></svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h8M7 3l4 4-4 4"/></svg>
);

// ───────────────────────────── Buttons artboard ─────────────────────────────
function ButtonsArtboard({ theme }) {
  const t = T2[theme];
  return (
    <Surface theme={theme}>
      <Eyebrow theme={theme}>Components · Buttons</Eyebrow>
      <ArtTitle theme={theme} sub="Soft-tinted chips: background is a low-alpha tint of the action colour, the label carries the colour at full saturation. No borders, no shadows. Hover lifts the tint.">
        Buttons
      </ArtTitle>

      <Group theme={theme} label="Variants">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button theme={theme} variant="primary" leadingIcon={<IconPlus />}>New entry</Button>
          <Button theme={theme} variant="secondary">View week</Button>
          <Button theme={theme} variant="ghost">Cancel</Button>
          <Button theme={theme} variant="destructive">Delete entry</Button>
        </div>
      </Group>

      <Group theme={theme} label="Sizes">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button theme={theme} size="sm" variant="primary">Save</Button>
          <Button theme={theme} size="md" variant="primary">Save entry</Button>
          <Button theme={theme} size="lg" variant="primary">Save and add another</Button>
        </div>
      </Group>

      <Group theme={theme} label="States">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button theme={theme} variant="primary">Default</Button>
          {/* Hover: tint lifts from ~16% to ~26% */}
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '9px 14px',
            font: `600 14px/1 ${T2.type.sans}`, letterSpacing: '-0.005em',
            background: window.glTint(t.primary, 0.26),
            color: t.primary,
            border: 'none', borderRadius: 8, cursor: 'pointer',
          }}>Hover</button>
          {/* Focused: 2px accent ring, offset 2px out */}
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <Button theme={theme} variant="primary">Focused</Button>
            <div style={{
              position: 'absolute', inset: -3,
              border: `2px solid ${t.primary}`,
              borderRadius: 11, opacity: 0.85, pointerEvents: 'none',
            }} />
          </div>
          <div style={{ opacity: 0.45 }}>
            <Button theme={theme} variant="primary">Disabled</Button>
          </div>
        </div>
      </Group>

      <Group theme={theme} label="With trailing arrow" lastless>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button theme={theme} variant="primary">Open dashboard <IconArrow /></Button>
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 4px', font: `600 14px/1 ${T2.type.sans}`,
            background: 'transparent', color: t.primary,
            border: 'none', cursor: 'pointer',
          }}>See this week <IconArrow /></button>
        </div>
      </Group>
    </Surface>
  );
}

// ───────────────────────────── Badges ─────────────────────────────
function Badge({ theme, bg, fg, dot, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px',
      borderRadius: 999,
      background: bg,
      color: fg,
      font: `500 12px/1.4 ${T2.type.sans}`,
      letterSpacing: '0.005em',
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: fg }} />}
      {children}
    </span>
  );
}

function BadgesArtboard({ theme }) {
  const t = T2[theme];
  return (
    <Surface theme={theme}>
      <Eyebrow theme={theme}>Components · Badges</Eyebrow>
      <ArtTitle theme={theme} sub="Soft-fill pills for entry types; outlined chips with a colour dot for categories. Pill = friendly. Chip = factual.">
        Badges
      </ArtTitle>

      <Group theme={theme} label="Entry type">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Badge theme={theme} bg={t.workBg} fg={t.workFg} dot>Work</Badge>
          <Badge theme={theme} bg={t.learnBg} fg={t.learnFg} dot>Learning</Badge>
        </div>
      </Group>

      <Group theme={theme} label="Category (with swatch)">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            ['Engineering', t.swatch[0]],
            ['Reading',     t.swatch[1]],
            ['Side project',t.swatch[2]],
            ['Health',      t.swatch[3]],
            ['Writing',     t.swatch[4]],
          ].map(([label, color]) => (
            <span key={label} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '4px 10px 4px 8px',
              borderRadius: 999,
              background: t.surface,
              border: `1px solid ${t.border}`,
              color: t.text,
              font: `500 12px/1.4 ${T2.type.sans}`,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: color }} />
              {label}
            </span>
          ))}
        </div>
      </Group>

      <Group theme={theme} label="Status">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Badge theme={theme} bg={t.primarySoft} fg={t.primary} dot>Streak · 12d</Badge>
          <Badge theme={theme} bg={t.warningSoft} fg={t.warning} dot>Missed yesterday</Badge>
          <Badge theme={theme} bg={t.dangerSoft} fg={t.danger} dot>Verification pending</Badge>
        </div>
      </Group>

      <Group theme={theme} label="Score chip" lastless>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {[3, 5, 7, 9].map((n) => {
            const tone = n >= 8 ? t.primary : n >= 5 ? t.workFg : t.textMuted;
            const bg   = n >= 8 ? t.primarySoft : n >= 5 ? t.workBg : t.bgSubtle;
            return (
              <span key={n} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px',
                borderRadius: 8,
                background: bg,
                color: tone,
                font: `600 12px/1.2 ${T2.type.mono}`,
                fontVariantNumeric: 'tabular-nums',
              }}>
                <span style={{ opacity: 0.65, fontWeight: 400 }}>score</span> {n}/10
              </span>
            );
          })}
        </div>
      </Group>
    </Surface>
  );
}

// ───────────────────────────── Inputs ─────────────────────────────
function FieldLabel({ theme, children, hint, error }) {
  const t = T2[theme];
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
      <label style={{ font: `500 13px/1.4 ${T2.type.sans}`, color: t.text }}>{children}</label>
      {hint && !error && <span style={{ font: `400 12px/1.4 ${T2.type.sans}`, color: t.textMuted }}>{hint}</span>}
      {error && <span style={{ font: `500 12px/1.4 ${T2.type.sans}`, color: t.danger }}>{error}</span>}
    </div>
  );
}

function InputShell({ theme, focused, error, children, leadingAdornment, trailing }) {
  const t = T2[theme];
  const border = error ? t.danger : focused ? t.primary : t.borderInput;
  const ring   = error ? t.dangerSoft : focused ? t.primarySoft : 'transparent';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: t.surface,
      border: `1px solid ${border}`,
      borderRadius: 10,
      padding: '0 12px',
      boxShadow: focused || error ? `0 0 0 3px ${ring}` : 'none',
      transition: 'box-shadow .12s, border-color .12s',
    }}>
      {leadingAdornment && <span style={{ color: t.textMuted, display: 'inline-flex' }}>{leadingAdornment}</span>}
      {children}
      {trailing && <span style={{ color: t.textMuted, font: `400 12px/1 ${T2.type.mono}` }}>{trailing}</span>}
    </div>
  );
}

function InputsArtboard({ theme }) {
  const t = T2[theme];
  const baseInput = {
    flex: 1,
    height: 42,
    border: 'none',
    background: 'transparent',
    font: `400 14px/1.5 ${T2.type.sans}`,
    color: t.text,
    outline: 'none',
    width: '100%',
  };
  return (
    <Surface theme={theme}>
      <Eyebrow theme={theme}>Components · Inputs</Eyebrow>
      <ArtTitle theme={theme} sub="Hairline border, accent focus ring, comfortable 42px height. Errors stay small and corrective — never alarmed.">
        Form fields
      </ArtTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        <div>
          <FieldLabel theme={theme} hint="What you did, in your own words.">Entry</FieldLabel>
          <InputShell theme={theme}>
            <input style={baseInput} defaultValue="Refactored the auth flow into a single guard." />
          </InputShell>
        </div>

        <div>
          <FieldLabel theme={theme}>Category</FieldLabel>
          <InputShell theme={theme} leadingAdornment={<span style={{ width: 10, height: 10, borderRadius: 999, background: t.swatch[0], display: 'inline-block' }} />} trailing="⌄">
            <input style={baseInput} defaultValue="Engineering" />
          </InputShell>
        </div>

        <div>
          <FieldLabel theme={theme}>Focused</FieldLabel>
          <InputShell theme={theme} focused>
            <input style={baseInput} defaultValue="Read a chapter of Designing Data-Intensive Apps" />
          </InputShell>
        </div>

        <div>
          <FieldLabel theme={theme} error="Score must be 1–10.">Productivity score</FieldLabel>
          <InputShell theme={theme} error trailing="/ 10">
            <input style={baseInput} defaultValue="12" />
          </InputShell>
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <FieldLabel theme={theme} hint="Markdown supported.">Notes</FieldLabel>
          <div style={{
            background: t.surface,
            border: `1px solid ${t.borderInput}`,
            borderRadius: 10,
            padding: '14px 14px 12px',
          }}>
            <div style={{ font: `400 14px/1.6 ${T2.type.sans}`, color: t.text }}>
              The trickiest part was untangling the refresh-token rotation from the
              login handler — once those were separated, the test surface dropped
              by half. <span style={{ color: t.primary }}>Worth doing again next time.</span>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
              {['B', 'I', '“ ”', '• list', '#'].map((g) => (
                <span key={g} style={{
                  padding: '4px 8px', borderRadius: 6,
                  font: `500 12px/1 ${T2.type.mono}`,
                  color: t.textMuted, background: t.bgSubtle,
                }}>{g}</span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <FieldLabel theme={theme}>Disabled</FieldLabel>
          <div style={{ opacity: 0.55 }}>
            <InputShell theme={theme}>
              <input style={{ ...baseInput, color: t.textMuted }} defaultValue="Not yet available" disabled />
            </InputShell>
          </div>
        </div>

        <div>
          <FieldLabel theme={theme}>Toggle · Entry type</FieldLabel>
          <SegmentedToggle theme={theme} options={['Work', 'Learning']} value="Work" />
        </div>
      </div>
    </Surface>
  );
}

function SegmentedToggle({ theme, options, value }) {
  const t = T2[theme];
  return (
    <div style={{
      display: 'inline-flex',
      padding: 4,
      background: t.bgSubtle,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
    }}>
      {options.map((opt) => {
        const on = opt === value;
        return (
          <div key={opt} style={{
            padding: '8px 16px',
            font: `500 13px/1 ${T2.type.sans}`,
            color: on ? t.text : t.textMuted,
            background: on ? t.surface : 'transparent',
            border: on ? `1px solid ${t.border}` : '1px solid transparent',
            boxShadow: on ? t.shadow : 'none',
            borderRadius: 7,
            cursor: 'pointer',
          }}>{opt}</div>
        );
      })}
    </div>
  );
}

// ───────────────────────────── Cards ─────────────────────────────
function CardShell({ theme, children, pad = 24, style }) {
  const t = T2[theme];
  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 12,
      boxShadow: t.shadow,
      padding: pad,
      ...style,
    }}>{children}</div>
  );
}

function CardsArtboard({ theme }) {
  const t = T2[theme];
  return (
    <Surface theme={theme}>
      <Eyebrow theme={theme}>Components · Cards</Eyebrow>
      <ArtTitle theme={theme} sub="One radius (12px), one hairline border. Padding stays generous; the card should feel like a page on a page, not a button.">
        Cards
      </ArtTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Stat card — minimal hairline + accent metric */}
        <CardShell theme={theme} pad={28}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ font: `600 11px/1 ${T2.type.sans}`, letterSpacing: '0.10em', textTransform: 'uppercase', color: t.textMuted }}>This week</div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 999,
              background: window.glTint(t.primary, 0.16),
              color: t.primary,
              font: `600 11px/1 ${T2.type.sans}`,
            }}>+3 vs. last</span>
          </div>
          <div style={{
            font: `700 56px/0.95 ${T2.type.sans}`,
            letterSpacing: '-0.035em',
            color: t.text,
            margin: '20px 0 6px',
            fontVariantNumeric: 'tabular-nums',
            display: 'flex', alignItems: 'baseline', gap: 4,
          }}>14<span style={{ color: t.textMuted, fontSize: 22, fontWeight: 600 }}>h</span></div>
          <div style={{ font: `400 14px/1.5 ${T2.type.sans}`, color: t.textMuted }}>across 6 categories</div>
        </CardShell>

        {/* Empty state */}
        <CardShell theme={theme} pad={28}>
          <div style={{ font: `700 20px/1.25 ${T2.type.sans}`, letterSpacing: '-0.015em', color: t.text, marginBottom: 8 }}>Nothing logged today.</div>
          <div style={{ font: `400 15px/1.6 ${T2.type.sans}`, color: t.textMuted, marginBottom: 24 }}>
            One line counts. The streak doesn't care if it's impressive — just that it's true.
          </div>
          <Button theme={theme} variant="primary" leadingIcon={<IconPlus />}>Log something small</Button>
        </CardShell>

        {/* Entry log card */}
        <div style={{ gridColumn: 'span 2' }}>
          <CardShell theme={theme}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <Badge theme={theme} bg={t.workBg} fg={t.workFg} dot>Work</Badge>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '4px 10px 4px 8px', borderRadius: 999,
                background: t.bgSubtle, border: `1px solid ${t.border}`,
                color: t.text, font: `500 12px/1.4 ${T2.type.sans}`,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: t.swatch[0] }} />
                Engineering · Auth
              </span>
              <span style={{ font: `500 12px/1 ${T2.type.mono}`, color: t.textMuted, marginLeft: 'auto' }}>
                Tue · 12 May
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 8,
                background: t.primarySoft, color: t.primary,
                font: `600 12px/1.2 ${T2.type.mono}`,
              }}><span style={{ opacity: 0.6, fontWeight: 400 }}>score</span> 8/10</span>
            </div>
            <div style={{ font: `700 20px/1.35 ${T2.type.sans}`, letterSpacing: '-0.015em', color: t.text, marginBottom: 8 }}>
              Refactored auth into a single guard.
            </div>
            <div style={{ font: `400 15px/1.65 ${T2.type.sans}`, color: t.text, opacity: 0.84 }}>
              Pulled the refresh-token rotation out of the login handler. Tests dropped by half once the
              responsibilities were separated. Worth doing again next time the same kind of tangle shows up.
            </div>
          </CardShell>
        </div>
      </div>
    </Surface>
  );
}

Object.assign(window, { ButtonsArtboard, BadgesArtboard, InputsArtboard, CardsArtboard, Button, Badge, CardShell, IconPlus, IconArrow });
