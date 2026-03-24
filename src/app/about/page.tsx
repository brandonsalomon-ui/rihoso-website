import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Brandon Salomon — AI leadership consultant, speaker, and team training expert helping organizations thrive in the age of artificial intelligence.",
};

const VALUES = [
  {
    title: "People First",
    description:
      "Technology works best when it serves people. Every recommendation I make starts with the humans involved — their strengths, concerns, and goals.",
  },
  {
    title: "Clarity Over Complexity",
    description:
      "AI doesn't have to be confusing. I translate complex technology into clear, actionable strategies that everyone can understand and execute.",
  },
  {
    title: "Practical Results",
    description:
      "No theoretical fluff. Every engagement is designed to deliver tangible outcomes — skills your team can use immediately and strategies that produce measurable impact.",
  },
  {
    title: "Honest Guidance",
    description:
      "Not every AI solution is the right fit. I give candid advice about what will work, what won't, and where your resources are best invested.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-tan-600 font-semibold text-sm tracking-widest uppercase mb-6">
            About Me
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-navy-900 leading-tight">
            Bridging the Gap Between{" "}
            <span className="text-navy-600 italic">AI &amp; Leadership</span>
          </h1>
          <div className="gradient-divider mt-10 mb-0" />
        </div>
      </section>

      {/* Story */}
      <section className="pb-28 px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
            <div className="lg:col-span-3 space-y-6 text-navy-600 text-lg leading-relaxed">
              <p>
                I&apos;ve spent my career at the intersection of technology and
                people. What I&apos;ve learned is that the biggest challenge with AI
                isn&apos;t the technology itself — it&apos;s helping people adapt,
                communicate, and lead through the change it brings.
              </p>
              <p>
                Organizations don&apos;t fail at AI because they chose the wrong
                tools. They struggle because they didn&apos;t prepare their teams,
                didn&apos;t align their leadership, and didn&apos;t build the
                communication pathways needed to make transformation stick.
              </p>
              <p>
                That&apos;s where I come in. I work directly with leaders and their
                teams to build real AI fluency — not just technical skills, but
                the confidence, communication habits, and strategic thinking that
                make AI adoption actually work.
              </p>
              <p>
                Whether I&apos;m on stage speaking to hundreds, in a boardroom with
                executives, or running a hands-on workshop with a team of ten,
                my goal is always the same: leave people more capable, more
                confident, and more excited about the future than when I found
                them.
              </p>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-sand-300/60 shadow-luxury">
                <h3 className="font-display text-xl text-navy-900 mb-4">
                  Areas of Expertise
                </h3>
                <ul className="space-y-3 text-navy-600">
                  {[
                    "AI Strategy & Implementation",
                    "Team Training & Upskilling",
                    "Leadership Development",
                    "Change Management",
                    "Communication Coaching",
                    "Digital Transformation",
                    "Keynote Speaking",
                    "Executive Consulting",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-tan-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-28 px-6 sm:px-8 lg:px-12 bg-navy-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <p className="text-tan-400 font-semibold text-sm tracking-widest uppercase mb-4">
              My Approach
            </p>
            <h2 className="font-display text-3xl sm:text-4xl text-white">
              What I Believe In
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {VALUES.map((value, i) => (
              <div
                key={i}
                className="p-10 rounded-3xl border border-navy-700/50 bg-navy-800/50 hover:border-tan-500/30 transition-all duration-500"
              >
                <h3 className="font-display text-xl text-white mb-4">
                  {value.title}
                </h3>
                <p className="text-navy-300 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 sm:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl text-navy-900">
            Ready to Work Together?
          </h2>
          <p className="mt-6 text-navy-500 text-lg leading-relaxed">
            Whether you&apos;re looking for a one-time consultation, ongoing
            partnership, or a speaker for your next event — I&apos;d love to hear
            from you.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-4 bg-navy-900 text-white font-semibold rounded-full btn-luxury text-base"
            >
              Get in Touch
            </Link>
            <Link
              href="/services"
              className="px-8 py-4 border-2 border-navy-200 text-navy-700 font-semibold rounded-full hover:border-navy-400 transition-all duration-300 text-base"
            >
              View Services
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
