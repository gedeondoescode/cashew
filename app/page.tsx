import { MainApp } from "@/app/components/MainApp";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cashew</h1>
        <p className="mt-1 text-muted-foreground">
          Compile a policy with AI, upload a spend CSV, and review flagged
          transactions.
        </p>
      </div>
      <MainApp />
    </main>
  );
}
