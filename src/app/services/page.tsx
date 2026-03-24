import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Services",
  description:
    "AI consulting, team training, speaking engagements, and leadership coaching. Explore how Brandon Salomon can help your organization thrive with AI.",
};

const SERVICES = [
  {
    id: "consulting",
    label: "Consulting",
    title: "AI Strategy & Consulting",
    description:
      "A clear-eyed assessment of where AI can create real value in your organization, followed by a practical roadmap to get there.",
    details: [
      "AI readiness assessment and gap analysis",
      "Tool selection and vendor evaluation",
      "Workflow design and process optimization",
      "Implementation planning and milestone setting",
      "ROI measurement and success metrics",
      "Ongoing advisory and course correction",
    ],
  },
  {
    id: "training",
    label: "Training",
    title: "Team Training & Workshops",
    description:
      "Hands-on, interactive sessions that transform your team from AI-curious to AI-confident. Customized to your industry, tools, and goals.",
    details: [
      "AI fundamentals for non-technical teams",
      "Prompt engineering and effective AI communication",
      "Tool-specific deep dives (ChatGPT, Claude, Copilot, etc.)",
      "Building AI-augmented workflows",
      "Managing AI dependency and critical thinking",
      "Train-the-trainer programs for internal champions",
    ],
  },
  {
    id: "speaking",
    label: "Speaking",
    title: "Speaking & Keynotes",
    description:
      "Engaging, forward-thinking presentations that inspire action. Perfect for conferences, corporate events, leadership summits, and executive retreats.",
    details: [
      "Keynote addresses on AI and the future of work",
      "Interactive panel discussions and fireside chats",
      "Half-day and full-day workshop facilitation",
      "Executive briefings and board presentations",
      "Custom topic development for your audience",
      "Virtual and in-person formats available",
    ],
  },
  {
    id: "leadership",
    label: "Leadership",
    title: "Leadership Coaching",
    description:
      "One-on-one and small-group coaching for leaders navigating change. Build the communication, decision-making, and strategic skills the AI era demands.",
    details: [
      "Executive coaching for AI-era leadership",
      "Communication skills for leading through change",
      "Building a culture of AI adoption",
      "Strategic decision-making frameworks",
      "Managing teams through digital transformation",
      "Preventing AI dependency while encouraging adoption",
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-tan-600 font-semibold text-sm tracking-widest uppercase mb-6">
            Services
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-navy-900 leading-tight">
            Expertise That{" "}
            <span className="text-navy-600 italic">Moves Organizations</span>{" "}
            Forward
          </h1>
          <p className="mt-8 text-navy-500 text-lg sm:text-xl leading-relaxed max-w-3xl">
            From boardroom strategy to hands-on team workshops, every service is
            designed to deliver practical results and lasting confidence.
          </p>
          <div className="gradient-divider mt-10 mb-0" />
        </div>
      </section>

      {/* Services Detail */}
      <section className="pb-28 px-6 sm:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto space-y-20">
          {SERVICES.map((service, i) => (
            <div
              key={service.id}
              id={service.id}
              className={`scroll-mt-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start ${
                i % 2 === 1 ? "lg:direction-rtl" : ""
              }`}
            >
              <div>
                <p className="text-tan-500 font-semibold text-xs tracking-widest uppercase mb-3">
                  {service.label}
                </p>
                <h2 className="font-display text-3xl sm:text-4xl text-navy-900 mb-6">
                  {service.title}
                </h2>
                <p className="text-navy-500 text-lg leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-10 border border-sand-300/60 shadow-luxury">
                <h4 className="font-semibold text-navy-800 text-sm tracking-wider uppercase mb-6">
                  What&apos;s Included
                </h4>
                <ul className="space-y-4">
                  {service.details.map((detail) => (
                    <li
                      key={detail}
                      className="flex items-start gap-3 text-navy-600"
                    >
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5 text-tan-500 flex-shrink-0 mt-0.5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="py-28 px-6 sm:px-8 lg:px-12 bg-navy-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-tan-400 font-semibold text-sm tracking-widest uppercase mb-4">
              The Process
            </p>
            <h2 className="font-display text-3xl sm:text-4xl text-white">
              How We Work Together
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Discovery",
                description:
                  "We start with a conversation. I learn about your organization, challenges, goals, and where AI fits into your vision.",
              },
              {
                step: "02",
                title: "Strategy",
                description:
                  "I develop a customized plan — whether that's a training curriculum, implementation roadmap, or keynote tailored to your audience.",
              },
              {
                step: "03",
                title: "Execution",
                description:
                  "We put the plan into action. I stay engaged throughout to ensure results, adjust as needed, and measure impact.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="p-10 rounded-3xl border border-navy-700/50 bg-navy-800/50"
              >
                <span className="text-tan-400 font-display text-4xl">
                  {item.step}
                </span>
                <h3 className="font-display text-xl text-white mt-4 mb-4">
                  {item.title}
                </h3>
                <p className="text-navy-300 leading-relaxed">
                  {item.description}
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
            Let&apos;s Build Something Together
          </h2>
          <p className="mt-6 text-navy-500 text-lg leading-relaxed">
            Every engagement starts with a conversation. Tell me about your
            goals, and I&apos;ll share how I can help you get there.
          </p>
          <Link
            href="/contact"
            className="mt-10 px-10 py-4 bg-navy-900 text-white font-semibold rounded-full btn-luxury text-base inline-block"
          >
            Schedule a Consultation
          </Link>
        </div>
      </section>
    </>
  );
}
