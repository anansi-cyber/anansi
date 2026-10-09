import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import Hero from "@/components/sections/Hero";
import Process from "@/components/sections/Process";
import Services from "@/components/sections/Services";

export default function Home() {
  return (
    <main>
      <Hero />
      <Services />
      <Process />
      <About />
      <Contact />
    </main>
  );
}
