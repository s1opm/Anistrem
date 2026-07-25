export default function TermsPage() {
  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <h1 className="section-title text-4xl sm:text-5xl font-display font-bold mb-4">
            Terms & Conditions
          </h1>
          <p className="text-dark-300 text-lg mt-6">
            Last updated: January 1, 2024
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8">
        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
          <p className="text-dark-300 leading-relaxed">
            By accessing and using AniStrem, you agree to be bound by these Terms and
            Conditions. If you do not agree with any part of these terms, you may not use
            our service.
          </p>
        </div>

        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">2. Use of Service</h2>
          <p className="text-dark-300 leading-relaxed">
            Our service is provided for personal, non-commercial use only. You may not copy,
            modify, distribute, sell, or lease any part of our service without written
            permission.
          </p>
        </div>

        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">3. Intellectual Property</h2>
          <p className="text-dark-300 leading-relaxed">
            All content on AniStrem, including videos, images, text, and graphics, is
            protected by intellectual property laws. You may not reproduce, distribute, or
            create derivative works.
          </p>
        </div>

        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">4. User Conduct</h2>
          <p className="text-dark-300 leading-relaxed">
            You agree not to use the service to transmit harmful content, attempt to gain
            unauthorized access, or engage in any activity that violates applicable laws.
          </p>
        </div>

        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">5. Limitation of Liability</h2>
          <p className="text-dark-300 leading-relaxed">
            AniStrem shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages resulting from your use of the service.
          </p>
        </div>

        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">6. Changes to Terms</h2>
          <p className="text-dark-300 leading-relaxed">
            We reserve the right to modify these terms at any time. Continued use of the
            service after changes constitutes acceptance of the new terms.
          </p>
        </div>
      </section>
    </div>
  );
}
