import Link from "next/link";
import Container from "./Container";

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-slate-200/60">
      <Container className="py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-slate-900">
            HealthFrame
          </Link>
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 transition-colors">
              Dashboard
            </Link>
            <Link href="/upload" className="text-slate-600 hover:text-slate-900 transition-colors">
              Upload
            </Link>
            <span className="text-slate-400">Sign in/out</span>
          </div>
        </div>
      </Container>
    </nav>
  );
}
