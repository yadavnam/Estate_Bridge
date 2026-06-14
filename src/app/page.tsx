import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import PropertySearchBox from "@/components/ui/PropertySearchBox";
import { ArrowRight, Star, Shield, TrendingUp, MapPin } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black flex flex-col selection:bg-gold selection:text-black">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative min-h-[90vh] flex flex-col justify-center pt-20">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80"
              alt="Luxury Mansion"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black"></div>
          </div>

          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
            <div className="text-center max-w-4xl mx-auto">
              <span className="inline-block py-1 px-3 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-semibold tracking-wider uppercase mb-6 animate-fade-in">
                Redefining Real Estate
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Find Your Dream Home. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-200">
                  Faster & Smarter.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                The exclusive platform bridging the gap between elite dealers and discerning buyers. Discover unparalleled luxury properties.
              </p>
            </div>

            <PropertySearchBox />
          </div>
        </section>

        {/* Portals Section */}
        <section className="py-24 bg-black relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/5 via-black to-black pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Tailored For Your Journey</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Whether you are looking to acquire a new asset or expand your real estate empire, we have the right tools for you.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Customer Portal */}
              <div className="glass-card rounded-3xl p-10 hover:border-gold/30 transition-all duration-500 group">
                <div className="bg-gold/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Star className="text-gold h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">For Buyers</h3>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  Browse verified premium properties, schedule exclusive site visits, and negotiate directly with trusted dealers. Your dream home awaits.
                </p>
                <Link href="/login" className="inline-flex items-center text-gold font-semibold group-hover:text-gold-hover transition-colors">
                  Explore Properties <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Dealer Portal */}
              <div className="glass-card rounded-3xl p-10 hover:border-gold/30 transition-all duration-500 group">
                <div className="bg-gold/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <TrendingUp className="text-gold h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">For Dealers</h3>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  List your inventory, access high-intent verified leads, and manage your deals with our advanced pipeline tools.
                </p>
                <Link href="/login" className="inline-flex items-center text-gold font-semibold group-hover:text-gold-hover transition-colors">
                  Grow Your Business <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Properties (Mock) */}
        <section className="py-24 bg-zinc-950 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Exclusive Listings</h2>
                <p className="text-gray-400">Curated properties handpicked for excellence.</p>
              </div>
              <Link href="#" className="hidden md:flex items-center text-gold hover:text-gold-hover transition-colors font-medium">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { img: "https://images.unsplash.com/photo-1613490900233-151c5fcfa644?auto=format&fit=crop&w=800&q=80", title: "Skyline Penthouse", price: "₹ 15.5 Cr", loc: "South Mumbai" },
                { img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80", title: "Oceanfront Villa", price: "₹ 22.0 Cr", loc: "Worli Sea Face" },
                { img: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80", title: "Golf Course Estate", price: "₹ 18.2 Cr", loc: "Gurgaon" },
              ].map((item, i) => (
                <div key={i} className="glass-card rounded-2xl overflow-hidden group cursor-pointer">
                  <div className="relative h-64 overflow-hidden">
                    <Image src={item.img} alt={item.title} fill className="object-cover transform group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                      <span className="text-gold text-sm font-semibold flex items-center gap-1"><Shield className="h-3 w-3" /> Verified</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-gray-400 text-sm flex items-center gap-1"><MapPin className="h-4 w-4" /> {item.loc}</span>
                      <span className="text-gold font-bold text-lg">{item.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
