import Link from "next/link";

const SERVICES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: "AI Strategy & Implementation",
    description:
      "Navigate the AI landscape with a clear roadmap. I help organizations identify the right tools, build workflows, and implement AI solutions that actually move the needle.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: "Team Training & Workshops",
    description:
      "Equip your team with the skills and confidence to work alongside AI. Hands-on workshops that turn uncertainty into fluency and resistance into enthusiasm.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
    title: "Speaking & Keynotes",
    description:
      "Engaging, thought-provoking presentations on AI leadership, digital transformation, and the future of work. For conferences, corporate events, and executive retreats.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    title: "Leadership Consulting",
    description:
      "One-on-one and executive-level guidance on leading teams through change. Build the communication skills and strategic vision to thrive in the AI era.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Soft gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-sand-100 via-sand-200 to-navy-50" />
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-tan-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-navy-100/20 rounded-full blur-3xl" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <p
            className="text-tan-600 font-semibold text-sm tracking-widest uppercase mb-6 animate-fade-in-up opacity-0"
            style={{ animationFillMode: "forwards" }}
          >
            AI Leadership &middot; Consulting &middot; Speaking
          </p>

          <h1
            className="font-display text-5xl sm:text-6xl lg:text-7xl text-navy-900 leading-[1.1] animate-fade-in-up opacity-0 animation-delay-200"
            style={{ animationFillMode: "forwards" }}
          >
            Helping Leaders{" "}
            <span className="text-navy-600 italic">Navigate</span> the AI
            Transformation
          </h1>

          <p
            className="mt-8 font-body text-lg sm:text-xl text-navy-500 leading-relaxed max-w-2xl mx-auto animate-fade-in-up opacity-0 animation-delay-400"
            style={{ animationFillMode: "forwards" }}
          >
            I partner with organizations to implement AI strategically, train
            teams to work confidently with new tools, and develop the leadership
            skills needed to thrive in a rapidly changing world.
          </p>

          <div
            className="mt-12 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up opacity-0 animation-delay-600"
            style={{ animationFillMode: "forwards" }}
          >
            <Link
              href="/contact"
              className="px-8 py-4 bg-navy-900 text-white font-semibold rounded-full btn-luxury text-base"
            >
              Schedule a Consultation
            </Link>
            <Link
              href="/services"
              className="px-8 py-4 border-2 border-navy-200 text-navy-700 font-semibold rounded-full hover:border-navy-400 hover:bg-white/50 transition-all duration-300 text-base"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="gradient-divider max-w-4xl mx-auto" />

      {/* Services Preview */}
      <section className="py-28 px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <p className="text-tan-600 font-semibold text-sm tracking-widest uppercase mb-4">
              What I Do
            </p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-navy-900">
              Services Built for the Future
            </h2>
            <p className="mt-6 text-navy-500 text-lg leading-relaxed">
              Whether you need hands-on AI implementation, team upskilling, or a
              compelling keynote, I bring clarity and actionable strategy to every
              engagement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {SERVICES.map((service, i) => (
              <div
                key={i}
                className="luxury-card p-10 bg-white rounded-3xl border border-sand-300/60 hover:border-tan-400/40"
              >
                <div className="w-14 h-14 rounded-2xl bg-navy-50 flex items-center justify-center text-navy-600 mb-6">
                  {service.icon}
                </div>
                <h3 className="font-display text-xl sm:text-2xl text-navy-900">
                  {service.title}
                </h3>
                <p className="mt-4 text-navy-500 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-navy-700 font-semibold hover:text-tan-600 transition-colors group"
            >
              View All Services
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* About Preview / Personal CTA */}
      <section className="py-28 px-6 sm:px-8 lg:px-12 bg-navy-900">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-tan-400 font-semibold text-sm tracking-widest uppercase mb-6">
            Why Work With Me
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white leading-tight">
            Real-World AI Experience,{" "}
            <span className="text-tan-400 italic">Human-First</span> Approach
          </h2>
          <p className="mt-8 text-navy-300 text-lg sm:text-xl leading-relaxed max-w-3xl mx-auto">
            I believe that AI should amplify people, not replace them. My
            approach combines deep technical understanding with genuine
            leadership and communication skills. The result? Teams that embrace
            AI with confidence and organizations that move faster without losing
            their human edge.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/about"
              className="px-8 py-4 bg-tan-500 text-white font-semibold rounded-full btn-luxury text-base hover:bg-tan-400"
            >
              Learn More About Me
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 border-2 border-navy-600 text-navy-300 font-semibold rounded-full hover:border-tan-400 hover:text-tan-400 transition-all duration-300 text-base"
            >
              Let&apos;s Talk
            </Link>
          </div>
        </div>
      </section>

      {/* Engagement Types */}
      <section className="py-28 px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <p className="text-tan-600 font-semibold text-sm tracking-widest uppercase mb-4">
              How We Work Together
            </p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-navy-900">
              Flexible Engagement Options
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "One-Time Consultation",
                description:
                  "A focused session to assess your AI readiness, identify quick wins, and develop a clear action plan.",
                detail: "90-minute deep dive",
              },
              {
                title: "Ongoing Partnership",
                description:
                  "Embedded support as your organization builds AI capabilities. Strategy, implementation guidance, and team coaching.",
                detail: "Monthly retainer",
              },
              {
                title: "Speaking & Events",
                description:
                  "Keynotes, panel discussions, and interactive workshops for conferences, offsites, and corporate events.",
                detail: "Custom engagements",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="luxury-card p-10 bg-white rounded-3xl border border-sand-300/60 text-center"
              >
                <p className="text-tan-500 font-semibold text-xs tracking-widest uppercase mb-4">
                  {item.detail}
                </p>
                <h3 className="font-display text-2xl text-navy-900">
                  {item.title}
                </h3>
                <p className="mt-4 text-navy-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/contact"
              className="px-10 py-4 bg-navy-900 text-white font-semibold rounded-full btn-luxury text-base inline-block"
            >
              Start a Conversation
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
