import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About RIHOSO",
  description: "Learn about the Rhode Island Horological Society — our mission, history, and community.",
};

export default function AboutPage() {
  return (
    <>
      <section className="py-20 bg-forest-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gold-400 text-sm uppercase tracking-[0.2em] mb-2 text-center">Who We Are</p>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-cream-50 mb-8 text-center">
            About RIHOSO
          </h1>

          <div className="prose prose-lg mx-auto space-y-6 text-cream-200 leading-relaxed">
            <p>
              The Rhode Island Horological Society (RIHOSO) is a community of watch and clock
              enthusiasts, collectors, historians, and craftspeople dedicated to preserving the
              art, science, and tradition of horology.
            </p>

            <h2 className="text-2xl font-display text-cream-50 mt-12 mb-4">Our Mission</h2>
            <p>
              RIHOSO exists to foster education, fellowship, and appreciation for the
              horological arts. We bring together people who share a passion for timepieces —
              from antique pocket watches and grandfather clocks to modern mechanical
              wristwatches and everything in between.
            </p>

            <h2 className="text-2xl font-display text-cream-50 mt-12 mb-4">Our History</h2>
            <p>
              Founded in Rhode Island, RIHOSO carries forward a long tradition of horological
              interest in New England. The region has deep ties to American watchmaking and
              clockmaking, with a rich history of skilled artisans and innovative manufacturers.
            </p>
            <p>
              Our society brings collectors and makers together to share knowledge, display
              remarkable timepieces, and ensure that the skills and stories of horology are
              passed to future generations.
            </p>

            <h2 className="text-2xl font-display text-cream-50 mt-12 mb-4">What We Do</h2>
            <ul className="space-y-3 text-cream-300">
              <li className="flex items-start gap-3">
                <span className="text-gold-400 mt-1">&#9679;</span>
                <span>Monthly meetings with show-and-tell sessions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold-400 mt-1">&#9679;</span>
                <span>Educational presentations on watchmaking and clock repair</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold-400 mt-1">&#9679;</span>
                <span>Horological fairs, swap meets, and community gatherings</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold-400 mt-1">&#9679;</span>
                <span>Resources and mentorship for aspiring watchmakers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold-400 mt-1">&#9679;</span>
                <span>Partnerships with watchmaking schools and institutions</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
