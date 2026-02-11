import Link from "next/link";

const MOCK_USERS = [
  { id: "1", name: "User 1" },
  { id: "2", name: "User 2" },
];

export default function UsersListPage() {
  return (
    <main className="flex min-h-[40vh] flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Users
      </h1>
      <ul className="mt-4 flex flex-col gap-2">
        {MOCK_USERS.map((user) => (
          <li key={user.id}>
            <Link
              href={`/users/${user.id}`}
              className="text-emerald-600 hover:underline dark:text-emerald-400"
            >
              {user.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
