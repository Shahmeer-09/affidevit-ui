import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { ROUTES, APP_NAME } from '@/lib/constants';
import {
  FileText,
  ArrowRight,
  Shield,
  Zap,
  Lock,
  Stamp,
  HelpCircle,
  Building2,
  PlayCircle,
  Sparkles,
} from 'lucide-react';

export function LandingPage() {
  const { user, isAuthenticated } = useAuth();
 if(user){
  console.log("User info on landing page:", user);
 }
  // Redirect staff users to their dashboards (except superuser admins)
  if (isAuthenticated && user) {
    // Allow superuser admins to access landing page
    if (user.role === 'admin') {
      // Let them stay on landing page
    } else {
      switch (user.role) {
        case 'reviewer':
          return <Navigate to={ROUTES.REVIEWER_DASHBOARD} replace />;
        case 'commissioner':
          return <Navigate to={ROUTES.COMMISSIONER_DASHBOARD} replace />;
      }
    }
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Copy */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
                Official Affidavits in Minutes,{' '}
                <span className="text-primary">Not Hours.</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Smart legal drafting for Trinidad & Tobago. Secure, automated, and Commissioner-ready.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="text-base h-12 px-8" asChild>
                  <Link to={ROUTES.AFFIDAVIT_TYPES}>
                    Start My Affidavit
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-base h-12 px-8 gap-2" asChild>
                  <Link to="#how-it-works">
                    <PlayCircle className="h-5 w-5" />
                    How It Works
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right - Two Clear Paths */}
            <div className="w-full max-w-md mx-auto lg:ml-auto space-y-4">
              {/* I Know What I Need */}
              <Card className="border-2 border-primary/20 shadow-lg hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">I know what I need</CardTitle>
                      <CardDescription>Browse all affidavit types</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button className="w-full" asChild>
                    <Link to={ROUTES.AFFIDAVIT_TYPES}>
                      Browse Affidavit Types
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Help Me Choose */}
              <Card className="border-2 border-muted shadow-lg hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <HelpCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Not sure what you need?</CardTitle>
                      <CardDescription>Answer 3 quick questions</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={ROUTES.DECISION_TREE}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Help Me Choose
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid - 3 Columns */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Why Choose {APP_NAME}?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Trusted by thousands across Trinidad & Tobago for fast, accurate legal documents.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* AI-Powered */}
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">AI-Powered</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Our smart engine drafts your legal text instantly based on local T&T laws and requirements.
                </p>
              </CardContent>
            </Card>

            {/* Commissioner Ready */}
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Stamp className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">Commissioner Ready</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Pick up your stamped document from any affiliated office using your unique tracking code.
                </p>
              </CardContent>
            </Card>

            {/* Secure & Private */}
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Lock className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">Secure & Private</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  End-to-end encryption ensures your personal data stays yours. We never share your information.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-slate-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              Get your official affidavit in 4 simple steps
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { step: 1, title: 'Answer Questions', description: 'Tell us what you need in plain language' },
              { step: 2, title: 'We Draft It', description: 'AI generates your legal document instantly' },
              { step: 3, title: 'Review & Pay', description: 'Check your affidavit and complete payment' },
              { step: 4, title: 'Get Stamped', description: 'Visit any affiliated Commissioner office' },
            ].map(({ step, title, description }) => (
              <div key={step} className="text-center">
                <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-lg">
                  {step}
                </div>
                <h3 className="font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Social Proof */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Affiliated Commissioner Offices
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Collect your stamped affidavit from any of our partner locations across Trinidad & Tobago.
            </p>
          </div>

          {/* Partner Logos Placeholder */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
            {['Port of Spain', 'San Fernando', 'Chaguanas', 'Arima'].map((location) => (
              <div key={location} className="flex flex-col items-center p-6 rounded-xl bg-slate-50 border">
                <Building2 className="h-10 w-10 text-primary/40 mb-3" />
                <span className="text-sm font-medium text-muted-foreground">{location}</span>
              </div>
            ))}
          </div>

          {/* Trust Badge */}
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="py-6 px-8 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">Legally Compliant</h4>
                  <p className="text-sm text-muted-foreground">
                    All affidavits prepared in accordance with the Statutory Declarations Act, Ch 7:04 of the Laws of Trinidad & Tobago.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
              Ready to Get Your Affidavit?
            </h2>
            <p className="text-primary-foreground/80 mb-8">
              Skip the wait. Get your legally compliant document in minutes, not days.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-base h-12 px-8" asChild>
                <Link to={ROUTES.AFFIDAVIT_TYPES}>
                  Start My Affidavit
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base h-12 px-8 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to={ROUTES.DECISION_TREE}>
                  <HelpCircle className="mr-2 h-5 w-5" />
                  Help Me Choose
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
