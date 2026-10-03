import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/Navbar';
import { ProductGrid } from '@/components/ProductGrid';
import { FOOTER_NOTES } from '@/config/siteNotes';

const Index = () => {

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center py-16 mb-12">
          <h1 className="text-5xl lg:text-6xl font-display font-bold text-foreground mb-6">
            Premium Collection
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover exquisite ghagra and jewellery pieces for your special occasions
          </p>
        </section>

        {/* Product Gallery */}
        <section>
          <ProductGrid />
        </section>
      </main>

      {/* Footer notes */}
      <footer className="border-t border-border mt-8">
        <div className="container mx-auto px-4 py-6">
          <p className="text-sm font-semibold text-destructive mb-2 text-center">Important notes</p>
          <ul className="space-y-1 text-center">
            {FOOTER_NOTES.map(note => (
              <li key={note} className="text-sm text-destructive">{note}</li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  );
};

export default Index;