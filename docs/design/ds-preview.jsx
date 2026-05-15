// Grow Logs — Dashboard preview artboard. Pulls the whole system together
// in a realistic "today" view so the system can be felt, not just listed.

const T3 = window.GL_TOKENS;

function DashboardPreview({ theme }) {
  const t = T3[theme];

  return (
    <Surface theme={theme} style={{ padding: 0 }}>
      {/* App chrome */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '232px 1fr',
        height: '100%',
        width: '100%',
      }}>
        {/* Sidebar */}
        <aside style={{
          padding: '28px 18px',
          borderRight: `1px solid ${t.border}`,
          background: t.bgSubtle,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {/* Wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px 24px' }}>
            <span style={{
              width: 24, height: 24, borderRadius: 7,
              background: t.primary,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: t.primaryInk, font: `700 14px/1 ${T3.type.sans}`,
            }}>g</span>
            <span style={{ font: `700 16px/1 ${T3.type.sans}`, letterSpacing: '-0.015em', color: t.text }}>Grow Logs</span>
          </div>

          <NavItem theme={theme} label="Today" active />
          <NavItem theme={theme} label="This week" />
          <NavItem theme={theme} label="Entries" count="142" />
          <NavItem theme={theme} label="Categories" />

          <div style={{ font: `700 11px/1 ${T3.type.sans}`, letterSpacing: '0.10em', textTransform: 'uppercase', color: t.textFaint, padding: '28px 10px 12px' }}>
            Categories
          </div>
          {[
            ['Engineering', t.swatch[0], '6.5h'],
            ['Reading',     t.swatch[1], '2.0h'],
            ['Side project',t.swatch[2], '3.5h'],
            ['Writing',     t.swatch[4], '1.0h'],
          ].map(([n, c, h]) => (
            <div key={n} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8,
              color: t.text, font: `500 13px/1 ${T3.type.sans}`,
            }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: c }} />
              <span style={{ flex: 1 }}>{n}</span>
              <span style={{ font: `500 12px/1 ${T3.type.mono}`, color: t.textMuted }}>{h}</span>
            </div>
          ))}

          <div style={{ marginTop: 'auto', padding: '12px 10px 0', borderTop: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 28, height: 28, borderRadius: 999, background: t.swatch[3], display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', font: `600 12px/1 ${T3.type.sans}` }}>JR</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ font: `500 13px/1.2 ${T3.type.sans}`, color: t.text }}>Jamie R.</span>
                <span style={{ font: `400 11px/1.2 ${T3.type.sans}`, color: t.textMuted }}>12-day streak</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ padding: '40px 48px 40px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <div style={{ font: `600 12px/1 ${T3.type.sans}`, letterSpacing: '0.10em', textTransform: 'uppercase', color: t.textMuted, marginBottom: 12 }}>Tuesday · 12 May</div>
              <div style={{ font: `700 40px/1.05 ${T3.type.sans}`, letterSpacing: '-0.025em', color: t.text }}>
                Evening, Jamie. <span style={{ color: t.primary }}>Three down.</span>
              </div>
            </div>
            <Button theme={theme} variant="primary" leadingIcon={<IconPlus />}>Log entry</Button>
          </div>

          {/* Stat row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard theme={theme} label="This week" value="14" unit="h" delta="+3" />
            <StatCard theme={theme} label="Avg. productivity" value="7.8" unit="/10" delta="+0.4" />
            <StatCard theme={theme} label="Streak" value="12" unit="days" delta="best yet" />
          </div>

          {/* Today list */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <div style={{ font: `700 20px/1.3 ${T3.type.sans}`, letterSpacing: '-0.015em', color: t.text }}>Today</div>
            <span style={{ font: `600 12px/1 ${T3.type.sans}`, color: t.textMuted, letterSpacing: '0.02em' }}>3 entries · 3h 20m</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <EntryRow theme={theme}
              kind="Work" cat="Engineering" catColor={t.swatch[0]}
              title="Refactored auth into a single guard"
              body="Pulled the refresh-token rotation out of the login handler. Tests dropped by half once the responsibilities were separated."
              time="2h" score={8} />
            <EntryRow theme={theme}
              kind="Learning" cat="Reading" catColor={t.swatch[1]}
              title="Chapter 4 — Encoding & Evolution"
              body="Schemas as forward + backward contracts. The Avro / Protobuf bit was the part I always glossed over before."
              time="45m" score={7} />
            <EntryRow theme={theme}
              kind="Work" cat="Writing" catColor={t.swatch[4]}
              title="Draft of the API contract doc"
              body="Got the auth, entries and admin sections to first-pass quality. Categories section still feels rushed."
              time="35m" score={6} />
          </div>
        </main>
      </div>
    </Surface>
  );
}

function NavItem({ theme, label, active, count }) {
  const t = T3[theme];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 10px', borderRadius: 8,
      color: active ? t.text : t.textMuted,
      background: active ? t.surface : 'transparent',
      border: active ? `1px solid ${t.border}` : '1px solid transparent',
      boxShadow: active ? t.shadow : 'none',
      font: `500 13px/1 ${T3.type.sans}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: active ? T3[theme].primary : t.textFaint }} />
      <span style={{ flex: 1 }}>{label}</span>
      {count && <span style={{ font: `500 12px/1 ${T3.type.mono}`, color: t.textMuted }}>{count}</span>}
    </div>
  );
}

function StatCard({ theme, label, value, unit, delta }) {
  const t = T3[theme];
  // Minimal stat card — hairline border, generous padding, big bold sans number.
  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 12,
      padding: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ font: `600 11px/1 ${T3.type.sans}`, letterSpacing: '0.10em', textTransform: 'uppercase', color: t.textMuted }}>{label}</div>
        <span style={{
          padding: '3px 8px', borderRadius: 999,
          background: window.glTint(t.primary, 0.16),
          color: t.primary,
          font: `600 11px/1 ${T3.type.sans}`,
        }}>{delta}</span>
      </div>
      <div style={{
        font: `700 44px/1 ${T3.type.sans}`,
        letterSpacing: '-0.03em',
        color: t.text,
        margin: '18px 0 0',
        fontVariantNumeric: 'tabular-nums',
        display: 'flex',
        alignItems: 'baseline',
        gap: 4,
      }}>
        {value}<span style={{ fontSize: 18, fontWeight: 600, color: t.textMuted }}>{unit}</span>
      </div>
    </div>
  );
}

function EntryRow({ theme, kind, cat, catColor, title, body, time, score }) {
  const t = T3[theme];
  const isWork = kind === 'Work';
  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 12,
      padding: 20,
      boxShadow: t.shadow,
      display: 'grid',
      gridTemplateColumns: '1fr 90px',
      gap: 20,
      alignItems: 'start',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <Badge theme={theme} bg={isWork ? t.workBg : t.learnBg} fg={isWork ? t.workFg : t.learnFg} dot>{kind}</Badge>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '3px 10px 3px 8px', borderRadius: 999,
            background: t.bgSubtle, border: `1px solid ${t.border}`,
            color: t.text, font: `500 12px/1.4 ${T3.type.sans}`,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: catColor }} />
            {cat}
          </span>
        </div>
        <div style={{ font: `700 17px/1.35 ${T3.type.sans}`, letterSpacing: '-0.01em', color: t.text, marginBottom: 6 }}>{title}</div>
        <div style={{ font: `400 15px/1.6 ${T3.type.sans}`, color: t.textMuted }}>{body}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
        <span style={{
          padding: '4px 10px', borderRadius: 999,
          background: window.glTint(t.primary, 0.16),
          color: t.primary,
          font: `700 13px/1.2 ${T3.type.sans}`,
          fontVariantNumeric: 'tabular-nums',
        }}>{score}/10</span>
        <span style={{ font: `600 12px/1 ${T3.type.sans}`, color: t.textMuted, letterSpacing: '0.02em' }}>{time}</span>
      </div>
    </div>
  );
}

Object.assign(window, { DashboardPreview });
