import {
  FaInstagram,
  FaFacebook,
  FaLinkedin,
  FaGithub,
  FaXTwitter,
} from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-sm text-slate-500">
      <div className="mx-auto max-w-6xl px-4">

        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <p>© {new Date().getFullYear()} SafeLoudoun</p>

          <div className="flex items-center gap-3 text-lg">
            <a href="#" aria-label="Instagram" className="hover:text-white transition-colors">
              <FaInstagram />
            </a>

            <a href="#" aria-label="Facebook" className="hover:text-white transition-colors">
              <FaFacebook />
            </a>

            <a href="#" aria-label="X" className="hover:text-white transition-colors">
              <FaXTwitter />
            </a>

            <a href="#" aria-label="LinkedIn" className="hover:text-white transition-colors">
              <FaLinkedin />
            </a>

            <a href="#" aria-label="GitHub" className="hover:text-white transition-colors">
              <FaGithub />
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
