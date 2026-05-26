import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Spooky or Dookie",
};

function Section({ n, heading, children }: { n: number; heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-green-spooky">
        {n}. {heading}
      </h2>
      <div className="text-ghost/90 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside space-y-1 text-ghost/80 pl-1">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-10">
        <h1 className="font-display text-4xl sm:text-5xl text-green-spooky mb-3">Terms of Service</h1>
        <p className="text-muted text-sm">Last updated: May 2026</p>
      </div>

      <div className="space-y-10">
        <Section n={1} heading="Acceptance of Terms">
          <p>
            By accessing or using SpookyorDookie.com you agree to be bound by these Terms of Service.
            If you do not agree to these terms do not use the site.
          </p>
        </Section>

        <Section n={2} heading="Who Can Use the Site">
          <p>
            You must be at least 13 years old to use SpookyorDookie. By using the site you confirm
            you meet this requirement.
          </p>
        </Section>

        <Section n={3} heading="Your Account">
          <p>
            You are responsible for maintaining the security of your account. You are responsible for
            all activity that occurs under your account. You must notify us immediately of any
            unauthorized use of your account at{" "}
            <a href="mailto:admin@spookyordookie.com" className="text-green-spooky hover:underline">
              admin@spookyordookie.com
            </a>
          </p>
        </Section>

        <Section n={4} heading="Content You Post">
          <p>
            You retain ownership of content you post on SpookyorDookie including ratings, reviews,
            and comments. By posting content you grant SpookyorDookie a non-exclusive license to
            display and distribute that content on the site.
          </p>
          <p>You agree not to post content that:</p>
          <Bullets items={[
            "Is abusive, harassing, threatening, or hateful toward other users",
            "Infringes on anyone's intellectual property rights",
            "Contains spam or commercial solicitation",
            "Violates any applicable law",
          ]} />
        </Section>

        <Section n={5} heading="Our Content">
          <p>
            The SpookyorDookie name, logo, and site design are our intellectual property. Movie and
            TV show data and images are provided by TMDB under their terms of use.
          </p>
        </Section>

        <Section n={6} heading="Moderation">
          <p>
            We reserve the right to remove any content that violates these terms and to suspend or
            terminate accounts that repeatedly violate these terms. We are not obligated to moderate
            all content but reserve the right to do so.
          </p>
        </Section>

        <Section n={7} heading="Rating Integrity">
          <p>
            Users agree to rate titles honestly based on their genuine opinion. Coordinated attempts
            to manipulate ratings including creating multiple accounts to inflate or deflate scores
            are prohibited and may result in account termination.
          </p>
        </Section>

        <Section n={8} heading="Disclaimer">
          <p>
            SpookyorDookie is provided as is without warranty of any kind. We do not guarantee the
            accuracy of movie or TV show information on the site.
          </p>
        </Section>

        <Section n={9} heading="Limitation of Liability">
          <p>
            SpookyorDookie is not liable for any damages arising from your use of the site including
            loss of data or service interruptions.
          </p>
        </Section>

        <Section n={10} heading="Changes to Terms">
          <p>
            We may update these terms from time to time. Continued use of the site after changes
            constitutes acceptance of the new terms.
          </p>
        </Section>

        <Section n={11} heading="Governing Law">
          <p>
            These terms are governed by the laws of the State of Texas, United States.
          </p>
        </Section>

        <Section n={12} heading="Contact Us">
          <p>
            For any questions about these terms contact us at{" "}
            <a href="mailto:admin@spookyordookie.com" className="text-green-spooky hover:underline">
              admin@spookyordookie.com
            </a>
          </p>
        </Section>
      </div>
    </div>
  );
}
