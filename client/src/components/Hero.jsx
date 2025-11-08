import { ArrowRight, MapPin, Users, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="absolute inset-0 z-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="1200" height="800" fill="url(#grid)" />
          <g opacity="0.8">
            <rect x="100" y="200" width="150" height="200" fill="none" stroke="white" strokeWidth="2" className="animate-pulse" />
            <rect x="300" y="150" width="180" height="250" fill="none" stroke="white" strokeWidth="2" className="animate-pulse" style={{animationDelay: '0.5s'}} />
            <rect x="550" y="180" width="160" height="220" fill="none" stroke="white" strokeWidth="2" className="animate-pulse" style={{animationDelay: '1s'}} />
            <rect x="750" y="160" width="200" height="240" fill="none" stroke="white" strokeWidth="2" className="animate-pulse" style={{animationDelay: '1.5s'}} />
            <rect x="1000" y="190" width="170" height="210" fill="none" stroke="white" strokeWidth="2" className="animate-pulse" style={{animationDelay: '2s'}} />
            <line x1="175" y1="200" x2="175" y2="0" stroke="white" strokeWidth="1" opacity="0.3" />
            <line x1="390" y1="150" x2="390" y2="0" stroke="white" strokeWidth="1" opacity="0.3" />
            <line x1="630" y1="180" x2="630" y2="0" stroke="white" strokeWidth="1" opacity="0.3" />
            <line x1="850" y1="160" x2="850" y2="0" stroke="white" strokeWidth="1" opacity="0.3" />
            <line x1="1085" y1="190" x2="1085" y2="0" stroke="white" strokeWidth="1" opacity="0.3" />
          </g>
        </svg>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6" data-testid="text-hero-title">
          Smart Territory Management
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            For Modern Real Estate
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto" data-testid="text-hero-subtitle">
          Optimize your real estate operations with intelligent territory planning, analytics, and team coordination. Maximize coverage, minimize overlap, and drive sales performance.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link href="/signup">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-lg" data-testid="button-get-started">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="#features">
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20"
              data-testid="button-learn-more"
            >
              Explore Features
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6 hover-elevate" data-testid="card-stat-users">
            <MapPin className="h-8 w-8 text-cyan-400 mb-2" />
            <div className="text-3xl font-bold text-white">1,500+</div>
            <div className="text-sm text-white/80">Territories Managed</div>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6 hover-elevate" data-testid="card-stat-projects">
            <Users className="h-8 w-8 text-blue-400 mb-2" />
            <div className="text-3xl font-bold text-white">850+</div>
            <div className="text-sm text-white/80">Active Sales Teams</div>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6 hover-elevate" data-testid="card-stat-secure">
            <TrendingUp className="h-8 w-8 text-green-400 mb-2" />
            <div className="text-3xl font-bold text-white">42%</div>
            <div className="text-sm text-white/80">Avg. Sales Increase</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
