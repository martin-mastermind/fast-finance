export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Privacy Policy</h1>
      <p style={{ color: 'var(--tg-theme-hint-color, #888)', marginBottom: '1rem' }}>
        Last updated: {new Date().getFullYear()}
      </p>
      <p style={{ marginBottom: '1rem' }}>
        Fast Finance takes your privacy seriously. This policy describes what data we collect and how
        we use it.
      </p>
      <h2 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Data We Collect</h2>
      <ul style={{ marginBottom: '1rem', paddingLeft: '1.25rem' }}>
        <li>Telegram user ID and username (from Telegram Mini App authentication)</li>
        <li>Financial data you enter (accounts, transactions, categories)</li>
        <li>AI chat messages (stored to provide context for responses)</li>
      </ul>
      <h2 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>How We Use It</h2>
      <p style={{ marginBottom: '1rem' }}>
        Your data is used solely to provide the Fast Finance service. We do not sell or share your
        data with third parties.
      </p>
      <h2 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Your Rights</h2>
      <ul style={{ marginBottom: '1rem', paddingLeft: '1.25rem' }}>
        <li>Export all your data via Settings → Export Data</li>
        <li>Delete all your data via Settings → Delete Account</li>
      </ul>
      <h2 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Data Retention</h2>
      <p style={{ marginBottom: '1rem' }}>
        Your data is stored until you delete your account. After deletion, all data is permanently
        removed within 30 days.
      </p>
      <p style={{ color: 'var(--tg-theme-hint-color, #888)', fontSize: '0.875rem' }}>
        This policy will be updated before the public launch.
      </p>
    </main>
  )
}
