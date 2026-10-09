import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import Hero from "@/components/sections/Hero";
import Process from "@/components/sections/Process";
import Services from "@/components/sections/Services";
import TimeCalculator from "@/components/TimeCalculator";

export default function Home() {
  return (
    <main>
      <Hero />
      <Services />
      <TimeCalculator />
      <Process />
      <About />
      <Contact />
    </main>
  );
}
