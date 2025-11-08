import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { Link } from 'wouter';

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/terrismart-logo.png" alt="TerriSmart" className="h-8 w-auto" />
            </div>
            <p className="text-sm text-muted-foreground">
              Smart territory management for modern real estate professionals.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#features" className="hover-elevate inline-block px-2 py-1 rounded-md" data-testid="link-footer-features">Features</Link></li>
              <li><Link href="#how-it-works" className="hover-elevate inline-block px-2 py-1 rounded-md" data-testid="link-footer-how">How It Works</Link></li>
              <li><Link href="#pricing" className="hover-elevate inline-block px-2 py-1 rounded-md" data-testid="link-footer-pricing">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover-elevate inline-block px-2 py-1 rounded-md" data-testid="link-footer-docs">Documentation</a></li>
              <li><a href="#" className="hover-elevate inline-block px-2 py-1 rounded-md" data-testid="link-footer-support">Support</a></li>
              <li><a href="#" className="hover-elevate inline-block px-2 py-1 rounded-md" data-testid="link-footer-changelog">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover-elevate inline-block px-2 py-1 rounded-md" data-testid="link-footer-privacy">Privacy Policy</a></li>
              <li><a href="#" className="hover-elevate inline-block px-2 py-1 rounded-md" data-testid="link-footer-terms">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 TerriSmart. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover-elevate p-2 rounded-md" data-testid="link-github">
              <Github className="h-5 w-5" />
            </a>
            <a href="#" className="hover-elevate p-2 rounded-md" data-testid="link-twitter">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="hover-elevate p-2 rounded-md" data-testid="link-linkedin">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="#" className="hover-elevate p-2 rounded-md" data-testid="link-email">
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
