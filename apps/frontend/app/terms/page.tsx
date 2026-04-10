export default function TermsPage() {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Terms of Service</h1>
      <p style={{ color: 'var(--tg-theme-hint-color, #888)', marginBottom: '1rem' }}>
        Last updated: {new Date().getFullYear()}
      </p>
      <p style={{ marginBottom: '1rem' }}>
        By using Fast Finance, you agree to these Terms of Service. Please read them carefully.
      </p>
      <h2 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Use of Service</h2>
      <p style={{ marginBottom: '1rem' }}>
        Fast Finance is provided for personal financial tracking purposes. You are responsible for
        maintaining the security of your account and all activity under it.
      </p>
      <h2 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Data</h2>
      <p style={{ marginBottom: '1rem' }}>
        You can export or delete your data at any time from the app settings.
      </p>
      <h2 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Limitations</h2>
      <p style={{ marginBottom: '1rem' }}>
        The service is provided &quot;as is&quot; without warranties of any kind. We are not liable for any
        financial decisions made based on information in this app.
      </p>
      <p style={{ color: 'var(--tg-theme-hint-color, #888)', fontSize: '0.875rem' }}>
        These terms will be updated before the public launch.
      </p>
    </main>
  )
}
