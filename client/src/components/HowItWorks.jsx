import { UserPlus, MapPin, Users, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: UserPlus,
      title: 'Set Up Your Organization',
      description: 'Create your account and add your sales team members to the platform.',
    },
    {
      number: '02',
      icon: MapPin,
      title: 'Define Territories',
      description: 'Map out your territories using our intelligent boundary tools and data.',
    },
    {
      number: '03',
      icon: Users,
      title: 'Assign Teams',
      description: 'Assign agents to territories and set up performance tracking.',
    },
    {
      number: '04',
      icon: TrendingUp,
      title: 'Track & Optimize',
      description: 'Monitor performance metrics and continuously optimize territory allocation.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-how-title">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-how-subtitle">
            Get started with territory management in four simple steps
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative"
              data-testid={`step-${index}`}
            >
              <div className="flex flex-col items-center text-center">
                <Badge
                  variant="outline"
                  className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold mb-6 border-2"
                >
                  {step.number}
                </Badge>
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
