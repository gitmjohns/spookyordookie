import { TMDBSearchForm } from "./TMDBSearchForm";

export default function NewTitlePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-display text-ghost mb-6">Add New Title</h1>
      <TMDBSearchForm />
    </div>
  );
}
