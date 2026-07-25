import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <h1 className="section-title text-4xl sm:text-5xl font-display font-bold mb-4">
            About AniStrem
          </h1>
          <p className="text-dark-300 text-lg mt-6">
            Your premier destination for streaming the finest animated content from around the world.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-12">
        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-dark-300 leading-relaxed">
            To bring the world of animation to everyone, everywhere. We believe great animation
            transcends borders and speaks to people of all ages. AniStrem is built by
            animation fans, for animation fans.
          </p>
        </div>

        <div className="gradient-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">What We Offer</h2>
          <ul className="space-y-4">
            {[
              'Thousands of animated videos across multiple categories',
              'High-quality streaming up to 1080p',
              'Regular updates with new content',
              'A clean, ad-friendly viewing experience',
              'Cross-device compatibility',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-dark-300">
                <span className="mt-1 w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="gradient-border rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Get in Touch</h2>
          <p className="text-dark-300 mb-6">
            Have questions or suggestions? We'd love to hear from you.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 gradient-bg text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 active:scale-95"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
