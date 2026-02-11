import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params;
  const user = { id, name: `User ${id}` };

  return (
    <main className="flex min-h-[40vh] flex-col items-center justify-center px-4">
      <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span>/</span>
        <Link href="/users" className="hover:underline">
          Users
        </Link>
        <span>/</span>
        <span className="text-zinc-700 dark:text-zinc-300">{id}</span>
      </nav>
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
        User Profile
      </h2>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">ID: {user.id}</p>
      <p className="text-zinc-600 dark:text-zinc-400">Name: {user.name}</p>
    </main>
  );
}
