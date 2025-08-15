import Container from "./(ui)/components/Container";
import Button from "./(ui)/components/Button";
import Card from "./(ui)/components/Card";

export default function Home() {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Hero Section */}
      <Container className="py-16 md:py-24">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl lg:text-6xl text-slate-900 max-w-4xl mx-auto">
              Understanding your health through data
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Track your health trends with AI-powered insights from your lab results. 
              Get educational summaries and visualizations to better understand your health data over time.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/upload" className="text-base px-6 py-3">
              Get started
            </Button>
            <Button href="/dashboard" variant="secondary" className="text-base px-6 py-3">
              View dashboard
            </Button>
          </div>
        </div>
      </Container>

      {/* How it Works Section */}
      <Container className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl text-slate-900 mb-4">How it works</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Simple steps to get insights from your lab results
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center space-y-4">
            <div className="bg-emerald-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
              <span className="text-emerald-600 font-semibold">1</span>
            </div>
            <h3 className="text-lg text-slate-900">Enter your info</h3>
            <p className="text-slate-600">Input basic demographics and lab values from your blood test results</p>
          </Card>

          <Card className="text-center space-y-4">
            <div className="bg-emerald-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
              <span className="text-emerald-600 font-semibold">2</span>
            </div>
            <h3 className="text-lg text-slate-900">Get AI summary</h3>
            <p className="text-slate-600">Receive educational insights and analysis about your lab results</p>
          </Card>

          <Card className="text-center space-y-4">
            <div className="bg-emerald-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
              <span className="text-emerald-600 font-semibold">3</span>
            </div>
            <h3 className="text-lg text-slate-900">Track trends</h3>
            <p className="text-slate-600">Visualize changes in your health data over time with charts</p>
          </Card>
        </div>
      </Container>

      {/* Disclaimer */}
      <Container className="py-8">
        <Card className="bg-slate-50 border-slate-300/50">
          <div className="text-center space-y-2">
            <p className="text-sm text-slate-600 font-medium">⚠️ Important disclaimer</p>
            <p className="text-sm text-slate-500">
              This tool is for educational purposes only and does not provide medical advice. 
              Always consult with your healthcare provider for medical decisions.
            </p>
          </div>
        </Card>
      </Container>
    </div>
  );
}
