export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-sm text-slate-500">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-5">
          <p>© {new Date().getFullYear()} SafeLoudoun</p>

          <div className="flex items-center gap-4">
            <a
              href="#"
              aria-label="Instagram"
              className="transition-opacity hover:opacity-80"
            >
              <img
                src="/icons/instagram.svg"
                alt=""
                className="h-5 w-5"
              />
            </a>

            <a
              href="#"
              aria-label="YouTube"
              className="transition-opacity hover:opacity-80"
            >
              <img
                src="/icons/youtube.svg"
                alt=""
                className="h-5 w-5"
              />
            </a>

            <a
              href="#"
              aria-label="GitHub"
              className="transition-opacity hover:opacity-80"
            >
              <img
                src="/icons/github.svg"
                alt=""
                className="h-5 w-5"
              />
            </a>
          </div>
        </div>

        <p className="mt-2 text-xs">
          Built for Loudoun. Designed for every community.
        </p>
      </div>
    </footer>
  );
}
