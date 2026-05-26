import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Spooky or Dookie",
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

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-10">
        <h1 className="font-display text-4xl sm:text-5xl text-green-spooky mb-3">Privacy Policy</h1>
        <p className="text-muted text-sm">Last updated: May 2026</p>
      </div>

      <div className="space-y-10">
        <Section n={1} heading="Who We Are">
          <p>
            SpookyorDookie is a horror movie and TV show review and rating community at SpookyorDookie.com.
          </p>
        </Section>

        <Section n={2} heading="What Information We Collect">
          <p>When you create an account we collect:</p>
          <Bullets items={[
            "Your name and email address from your Google or Discord account via OAuth authentication",
            "Your chosen username and avatar preferences",
            "Your ratings, reviews, comments, and debate replies",
            "Your watchlist and viewing history",
            "Your activity on the site including pages visited and features used",
          ]} />
          <p>We do not collect payment information, physical addresses, or phone numbers.</p>
        </Section>

        <Section n={3} heading="How We Use Your Information">
          <p>We use your information to:</p>
          <Bullets items={[
            "Create and manage your account",
            "Display your ratings, reviews, and community activity",
            "Send you notifications about replies and upvotes on your content",
            "Improve the site and user experience",
            "Ensure the security and integrity of the platform",
          ]} />
        </Section>

        <Section n={4} heading="What We Share">
          <p>We do not sell your personal information to anyone ever.</p>
          <p>
            Your public profile, ratings, reviews, and comments are visible to other users and visitors
            of the site by default. Your watchlist is private and only visible to you.
          </p>
          <p>We use the following third party services which may process your data:</p>
          <Bullets items={[
            "Supabase — database and authentication hosting",
            "Vercel — website hosting",
            "TMDB — movie and TV show data and images",
            "Google and Discord — OAuth authentication",
          ]} />
        </Section>

        <Section n={5} heading="Data Retention">
          <p>
            We keep your data for as long as your account is active. If you delete your account all
            your personal data including ratings, comments, and profile information will be permanently
            deleted within 30 days.
          </p>
        </Section>

        <Section n={6} heading="Your Rights">
          <p>You have the right to:</p>
          <Bullets items={[
            "Access the personal data we hold about you",
            "Request correction of inaccurate data",
            "Request deletion of your account and associated data",
            "Export your data",
          ]} />
          <p>
            To exercise any of these rights contact us at{" "}
            <a href="mailto:admin@spookyordookie.com" className="text-green-spooky hover:underline">
              admin@spookyordookie.com
            </a>
          </p>
        </Section>

        <Section n={7} heading="Cookies">
          <p>
            We use cookies and similar technologies to keep you logged in and remember your preferences.
            We do not use advertising cookies or tracking cookies.
          </p>
        </Section>

        <Section n={8} heading="Children's Privacy">
          <p>
            SpookyorDookie is not intended for children under 13. We do not knowingly collect personal
            information from children under 13. If you believe a child has provided us with personal
            information please contact us at{" "}
            <a href="mailto:admin@spookyordookie.com" className="text-green-spooky hover:underline">
              admin@spookyordookie.com
            </a>
          </p>
        </Section>

        <Section n={9} heading="Changes to This Policy">
          <p>
            We may update this policy from time to time. We will notify users of significant changes
            by posting a notice on the site.
          </p>
        </Section>

        <Section n={10} heading="Contact Us">
          <p>
            For any privacy related questions contact us at{" "}
            <a href="mailto:admin@spookyordookie.com" className="text-green-spooky hover:underline">
              admin@spookyordookie.com
            </a>
          </p>
        </Section>
      </div>
    </div>
  );
}
