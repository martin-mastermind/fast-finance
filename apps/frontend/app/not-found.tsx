export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        background: 'var(--tg-theme-bg-color, #18181b)',
        color: 'var(--tg-theme-text-color, #fafafa)',
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Страница не найдена
      </h2>
      <p style={{ color: 'var(--tg-theme-hint-color, #71717a)' }}>
        Эта страница не существует или была удалена.
      </p>
    </div>
  )
}
