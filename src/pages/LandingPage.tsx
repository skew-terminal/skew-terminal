import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TickerTape } from "@/components/TickerTape";
import { FeatureCard } from "@/components/FeatureCard";
import { Scan, Users, BarChart3, Zap, ArrowRight, ExternalLink } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background circuit-pattern">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-primary [-webkit-transform:skewX(-10deg)] [transform:skewX(-10deg)]">
              <Zap className="h-6 w-6 text-primary-foreground [transform:skewX(10deg)]" />
            </div>
            <span className="font-mono text-xl font-bold tracking-wider text-foreground">
              SKEW
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <a 
              href="#features" 
              className="hidden font-mono text-sm uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary md:block"
            >
              Features
            </a>
            <Button variant="skewOutline" size="sm" asChild>
              <Link to="/app">
                <span className="[transform:skewX(5deg)]">Launch App</span>
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center pt-16">
        {/* Background grid */}
        <div className="absolute inset-0 grid-overlay opacity-50" />
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="container relative mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left content */}
            <div className="max-w-2xl">
              {/* Tag */}
              <div className="mb-6 inline-flex items-center gap-2 border border-primary/30 bg-primary/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary [-webkit-transform:skewX(-5deg)] [transform:skewX(-5deg)]">
                <span className="[transform:skewX(5deg)]">Cross-Chain Arbitrage</span>
              </div>

              {/* Headline */}
              <h1 className="mb-6 font-sans text-5xl font-black uppercase leading-none tracking-tight text-foreground md:text-7xl">
                Exploit<br />
                <span className="text-gradient-orange">The Imbalance</span>
              </h1>

              {/* Subheadline */}
              <p className="mb-8 max-w-lg text-lg leading-relaxed text-muted-foreground">
                The first cross-chain arbitrage terminal for prediction markets. Track spreads between 
                <span className="text-foreground font-medium"> Polymarket</span>, 
                <span className="text-foreground font-medium"> Kalshi</span>, and 
                <span className="text-foreground font-medium"> Solana</span> instantly.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4">
                <Button variant="skewPrimary" size="xl" asChild className="group">
                  <Link to="/app">
                    <span className="flex items-center gap-2 [transform:skewX(5deg)]">
                      Launch Terminal
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Button>
                <Button variant="skewOutline" size="xl" asChild>
                  <a href="#features">
                    <span className="[transform:skewX(5deg)]">Learn More</span>
                  </a>
                </Button>
              </div>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-3 gap-8 border-t border-border pt-8">
                <div>
                  <div className="font-mono text-3xl font-bold text-accent">$2.4B</div>
                  <div className="mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">Volume Tracked</div>
                </div>
                <div>
                  <div className="font-mono text-3xl font-bold text-primary">847</div>
                  <div className="mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">Markets</div>
                </div>
                <div>
                  <div className="font-mono text-3xl font-bold text-foreground">24/7</div>
                  <div className="mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">Live Data</div>
                </div>
              </div>
            </div>

            {/* Right visual */}
            <div className="relative hidden lg:block">
              <div className="relative aspect-square">
                {/* Glowing orb */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-64 w-64 rounded-full bg-primary/20 blur-3xl animate-pulse-glow" />
                </div>
                
                {/* Floating cards */}
                <div className="absolute top-10 left-0 border border-border bg-card p-4 shadow-2xl animate-float [-webkit-transform:skewX(-5deg)] [transform:skewX(-5deg)]">
                  <div className="[transform:skewX(5deg)]">
                    <div className="font-mono text-xs text-muted-foreground">TRUMP VICTORY</div>
                    <div className="mt-1 font-mono text-lg font-bold text-accent">+8.3% SKEW</div>
                  </div>
                </div>

                <div className="absolute top-1/3 right-0 border border-primary/50 bg-card p-4 shadow-2xl glow-orange animate-float [animation-delay:0.5s] [-webkit-transform:skewX(-5deg)] [transform:skewX(-5deg)]">
                  <div className="[transform:skewX(5deg)]">
                    <div className="font-mono text-xs text-muted-foreground">BTC $100K Q1</div>
                    <div className="mt-1 font-mono text-lg font-bold text-primary">+13.3% SKEW</div>
                  </div>
                </div>

                <div className="absolute bottom-20 left-10 border border-accent/50 bg-card p-4 shadow-2xl glow-green animate-float [animation-delay:1s] [-webkit-transform:skewX(-5deg)] [transform:skewX(-5deg)]">
                  <div className="[transform:skewX(5deg)]">
                    <div className="font-mono text-xs text-muted-foreground">FED RATE CUT</div>
                    <div className="mt-1 font-mono text-lg font-bold text-accent">+20.0% SKEW</div>
                  </div>
                </div>

                {/* Center logo */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="flex h-24 w-24 items-center justify-center bg-primary shadow-2xl [-webkit-transform:skewX(-10deg)] [transform:skewX(-10deg)]">
                    <Zap className="h-12 w-12 text-primary-foreground [transform:skewX(10deg)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker Tape */}
      <TickerTape />

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          {/* Section header */}
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-primary">
              <span className="h-px w-8 bg-primary" />
              Features
              <span className="h-px w-8 bg-primary" />
            </div>
            <h2 className="font-sans text-4xl font-black uppercase tracking-tight text-foreground md:text-5xl">
              The Predator's<br />
              <span className="text-gradient-orange">Toolkit</span>
            </h2>
          </div>

          {/* Feature cards */}
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            <FeatureCard
              icon={Scan}
              title="The Arb Scanner"
              description="Real-time spread detection across chains. Identify profitable opportunities before the market corrects."
            />
            <FeatureCard
              icon={Users}
              title="Whale Watch"
              description="Track smart money flows and insider bets. See where the big players are positioning."
            />
            <FeatureCard
              icon={BarChart3}
              title="Reality Check"
              description="Sentiment vs. probability analysis. Compare social signals against market pricing."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 font-sans text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
            Ready to Hunt?
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-muted-foreground">
            Join the elite traders exploiting cross-chain prediction market inefficiencies.
          </p>
          <Button variant="skewPrimary" size="xl" asChild className="group">
            <Link to="/app">
              <span className="flex items-center gap-2 [transform:skewX(5deg)]">
                Launch Terminal
                <ExternalLink className="h-5 w-5" />
              </span>
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center bg-primary [-webkit-transform:skewX(-10deg)] [transform:skewX(-10deg)]">
              <Zap className="h-5 w-5 text-primary-foreground [transform:skewX(10deg)]" />
            </div>
            <span className="font-mono text-sm font-bold tracking-wider text-foreground">SKEW</span>
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            © 2025 SKEW Protocol. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
