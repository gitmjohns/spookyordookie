import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact — Spooky or Dookie",
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-10">
        <h1 className="font-display text-4xl sm:text-5xl text-green-spooky mb-3">Contact</h1>
        <p className="text-specter text-sm">Have a question or feedback? Send us a message.</p>
      </div>
      <ContactForm />
    </div>
  );
}
