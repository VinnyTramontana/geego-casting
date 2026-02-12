import QuoteBuilder from "@/components/QuoteBuilder";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] bg-clip-text text-transparent">
          Precious Metal Casting Calculator
        </h1>
        <p className="mt-3 text-gray-400 max-w-2xl mx-auto">
          Upload your STL models and get an instant estimate for gold, platinum, or silver casting.
        </p>
      </div>
      <QuoteBuilder />
    </div>
  );
}
