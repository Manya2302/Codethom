export default function AuthLayout({ 
  children, 
  title, 
  subtitle,
  image
}) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.7)), url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative z-10 text-white p-12 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <img src="/terrismart-logo.png" alt="TerriSmart" className="h-10 w-auto" />
              <span className="text-2xl font-bold">TerriSmart</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Smart Territory Management
            </h2>
            <p className="text-white/90 mb-8">
              Optimize your real estate operations with intelligent territory planning, analytics, and team coordination.
            </p>
          </div>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <p className="text-sm italic mb-2">
                "TerriSmart transformed how we manage our sales territories. Coverage is up 42% and our team coordination has never been better."
              </p>
              <p className="text-sm font-semibold">- Michael Torres, Sales Director</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="text-auth-title">{title}</h1>
            {subtitle && <p className="text-muted-foreground" data-testid="text-auth-subtitle">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
