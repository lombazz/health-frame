import Container from "./Container";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/60 mt-16">
      <Container className="py-8">
        <div className="text-center">
          <p className="text-sm text-slate-500">
            © 2024 HealthFrame. For educational purposes only.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Not medical advice. Always consult your healthcare provider.
          </p>
        </div>
      </Container>
    </footer>
  );
}
