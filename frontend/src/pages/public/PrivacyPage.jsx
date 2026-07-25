export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <h1 className="section-title text-4xl sm:text-5xl font-display font-bold mb-4">
            Privacy Policy
          </h1>
          <p className="text-dark-300 text-lg mt-6">
            Last updated: January 1, 2024
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8">
        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
          <p className="text-dark-300 leading-relaxed">
            We collect information you provide directly, such as when you create an account,
            subscribe to our newsletter, or contact us. This may include your name, email
            address, and preferences.
          </p>
        </div>

        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
          <p className="text-dark-300 leading-relaxed">
            We use the information we collect to provide, maintain, and improve our services,
            to send you technical notices and support messages, and to communicate with you
            about products, services, and promotions.
          </p>
        </div>

        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">3. Cookies and Tracking</h2>
          <p className="text-dark-300 leading-relaxed">
            We use cookies and similar tracking technologies to track activity on our service
            and hold certain information. You can instruct your browser to refuse all cookies.
          </p>
        </div>

        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
          <p className="text-dark-300 leading-relaxed">
            We implement appropriate technical and organizational measures to protect your
            personal data against unauthorized access, alteration, disclosure, or destruction.
          </p>
        </div>

        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">5. Third-Party Services</h2>
          <p className="text-dark-300 leading-relaxed">
            We may employ third-party companies to facilitate our service, provide service on
            our behalf, or perform service-related activities. These third parties have access
            to your personal data only to perform these tasks on our behalf.
          </p>
        </div>

        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">6. Changes to This Policy</h2>
          <p className="text-dark-300 leading-relaxed">
            We may update our Privacy Policy from time to time. We will notify you of any
            changes by posting the new Privacy Policy on this page.
          </p>
        </div>

        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">7. Contact Us</h2>
          <p className="text-dark-300 leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at{' '}
            <span className="text-purple-400">privacy@anistrem.com</span>.
          </p>
        </div>
      </section>
    </div>
  );
}
