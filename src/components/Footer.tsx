export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-sm text-slate-500">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-xs sm:text-sm">
          © {new Date().getFullYear()} SafeLoudoun | Built for Loudoun. Designed for every community.
        </p>
        <p className="mt-1 text-xs">
          *We will add social links here once accounts are made*
        </p>
      </div>
    </footer>
  );
}
