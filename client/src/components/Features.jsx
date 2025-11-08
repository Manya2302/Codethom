import { MapPin, Users, BarChart3, Layers, Target, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function Features() {
  const features = [
    {
      icon: MapPin,
      title: 'Smart Territory Mapping',
      description: 'Create and visualize territories with intelligent boundary detection and geographic optimization.',
    },
    {
      icon: Users,
      title: 'Team Assignment & Routing',
      description: 'Assign agents to territories and optimize routing for maximum efficiency and coverage.',
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Track territory performance, sales metrics, and agent productivity with real-time dashboards.',
    },
    {
      icon: Layers,
      title: 'Territory Balancing',
      description: 'Automatically balance territories based on workload, potential, and agent capacity.',
    },
    {
      icon: Target,
      title: 'Lead Distribution',
      description: 'Intelligently distribute leads to the right agents based on territory and availability.',
    },
    {
      icon: Zap,
      title: 'Real-Time Updates',
      description: 'Get instant notifications on territory changes, new leads, and market opportunities.',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-features-title">
            Powerful Territory Management Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-features-subtitle">
            Everything you need to optimize your real estate territory operations
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-6 hover-elevate"
              data-testid={`card-feature-${index}`}
            >
              <feature.icon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
