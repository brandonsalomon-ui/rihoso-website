import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Brandon Salomon for AI consulting, speaking engagements, team training, and leadership coaching. Let's start a conversation.",
};

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-tan-600 font-semibold text-sm tracking-widest uppercase mb-6">
            Contact
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-navy-900 leading-tight">
            Let&apos;s Start a{" "}
            <span className="text-navy-600 italic">Conversation</span>
          </h1>
          <p className="mt-8 text-navy-500 text-lg sm:text-xl leading-relaxed max-w-3xl">
            Whether you&apos;re exploring AI for the first time or looking for a
            speaker for your next event, I&apos;d love to hear about what
            you&apos;re working on.
          </p>
          <div className="gradient-divider mt-10 mb-0" />
        </div>
      </section>

      {/* Contact Content */}
      <section className="pb-28 px-6 sm:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-16">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl p-10 sm:p-12 border border-sand-300/60 shadow-luxury">
              <h2 className="font-display text-2xl text-navy-900 mb-8">
                Send a Message
              </h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-navy-700 mb-2"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="w-full px-4 py-3 rounded-xl border border-sand-300 bg-sand-50 text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-200 focus:border-navy-400 transition-all"
                      placeholder="Your first name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-navy-700 mb-2"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="w-full px-4 py-3 rounded-xl border border-sand-300 bg-sand-50 text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-200 focus:border-navy-400 transition-all"
                      placeholder="Your last name"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-navy-700 mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-3 rounded-xl border border-sand-300 bg-sand-50 text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-200 focus:border-navy-400 transition-all"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="interest"
                    className="block text-sm font-medium text-navy-700 mb-2"
                  >
                    I&apos;m Interested In
                  </label>
                  <select
                    id="interest"
                    name="interest"
                    className="w-full px-4 py-3 rounded-xl border border-sand-300 bg-sand-50 text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-200 focus:border-navy-400 transition-all"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select an option
                    </option>
                    <option value="consulting">AI Consulting</option>
                    <option value="training">Team Training &amp; Workshops</option>
                    <option value="speaking">Speaking Engagement</option>
                    <option value="leadership">Leadership Coaching</option>
                    <option value="other">Something Else</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-navy-700 mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-sand-300 bg-sand-50 text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-200 focus:border-navy-400 transition-all resize-none"
                    placeholder="Tell me about your goals, timeline, and how I can help..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-10 py-4 bg-navy-900 text-white font-semibold rounded-full btn-luxury text-base"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-8 border border-sand-300/60 shadow-luxury">
              <h3 className="font-display text-xl text-navy-900 mb-6">
                Quick Connect
              </h3>
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-navy-400 uppercase tracking-wider mb-1">
                    Email
                  </p>
                  <a
                    href="mailto:hello@brandonsalomon.com"
                    className="text-navy-700 hover:text-tan-600 transition-colors"
                  >
                    hello@brandonsalomon.com
                  </a>
                </div>
                <div>
                  <p className="text-sm font-medium text-navy-400 uppercase tracking-wider mb-1">
                    Response Time
                  </p>
                  <p className="text-navy-700">Within 24 hours</p>
                </div>
              </div>
            </div>

            <div className="bg-navy-900 rounded-3xl p-8 text-white">
              <h3 className="font-display text-xl mb-4">
                Looking to Book a Speaker?
              </h3>
              <p className="text-navy-300 leading-relaxed mb-6">
                I speak at conferences, corporate events, leadership retreats,
                and executive briefings. Let me know your event details and
                I&apos;ll put together a custom proposal.
              </p>
              <div className="space-y-3 text-sm">
                {[
                  "Keynote addresses (30\u201360 min)",
                  "Half-day workshops",
                  "Panel discussions & fireside chats",
                  "Virtual & in-person formats",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-tan-400 flex-shrink-0" />
                    <span className="text-navy-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
