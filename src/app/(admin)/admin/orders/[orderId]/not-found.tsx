import Link from "next/link";

export default function AdminOrderNotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-10 sm:px-6">
      <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-600">Commande introuvable</p>
        <h1 className="mt-3 text-2xl font-semibold text-stone-950">Cette commande n’existe pas ou n’est plus disponible.</h1>
        <Link className="mt-5 inline-flex rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white" href="/admin/orders">
          Retour aux commandes
        </Link>
      </section>
    </main>
  );
}
