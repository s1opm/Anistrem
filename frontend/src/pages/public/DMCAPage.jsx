export default function DMCAPage() {
  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <h1 className="section-title text-4xl sm:text-5xl font-display font-bold mb-4">
            DMCA Policy
          </h1>
          <p className="text-dark-300 text-lg mt-6">
            Last updated: January 1, 2024
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8">
        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">1. Reporting Copyright Infringement</h2>
          <p className="text-dark-300 leading-relaxed">
            AniStrem respects the intellectual property of others and expects our users
            to do the same. If you believe that content on our service infringes your
            copyright, please send us a DMCA takedown notice.
          </p>
        </div>

        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">2. How to File a Notice</h2>
          <p className="text-dark-300 leading-relaxed">
            To file a DMCA notice, send a written communication to our designated copyright
            agent that includes: identification of the copyrighted work, identification of
            the infringing material, your contact information, a statement of good faith
            belief, and a statement of accuracy under penalty of perjury.
          </p>
        </div>

        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">3. Counter-Notification</h2>
          <p className="text-dark-300 leading-relaxed">
            If you believe your content was removed in error, you may file a
            counter-notification. Include your identification of the removed material and a
            statement under penalty of perjury.
          </p>
        </div>

        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">4. Repeat Infringers</h2>
          <p className="text-dark-300 leading-relaxed">
            In accordance with the DMCA and other applicable law, AniStrem has adopted
            a policy of terminating, in appropriate circumstances, users who are deemed to be
            repeat infringers.
          </p>
        </div>

        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">5. Contact</h2>
          <p className="text-dark-300 leading-relaxed">
            Send DMCA notices to:{' '}
            <span className="text-purple-400">dmca@anistrem.com</span>.
          </p>
        </div>
      </section>
    </div>
  );
}
