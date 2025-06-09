import SwapInterface from "@/components/swap-interface";
import BackgroundGradient from "@/components/background-gradient";
import { Button } from "@/components/ui/button";
import Header from "@/components/DashNav";

export default function Home() {
  return (
    <main className="flex flex-col relative overflow-hidden">
      <BackgroundGradient />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <Header />
        <div className="mt-20">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-white/80 text-sm">
                Introducing Spectrum: Intelligent authenticators
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              The gateway to
              <br />
              <span className="italic font-light">secure</span> applications
            </h1>

            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto leading-relaxed">
              With a few lines of code you can integrate any app within any
              language, and any framework.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button className="bg-white text-black hover:bg-white/90 px-8 py-3 rounded-full font-medium">
                Get started
              </Button>
            </div>
          </div>
          <SwapInterface />
        </div>
      </div>
    </main>
  );
}
