import { Link } from "@/i18n/navigation";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="font-display text-7xl font-extrabold text-gradient">404</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-fg px-5 py-3 font-semibold text-bg"
        >
          AidoPost
        </Link>
      </div>
    </div>
  );
}
