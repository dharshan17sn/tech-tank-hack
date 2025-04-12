import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-green-600 text-white py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">KrishiSaarthi</h1>
          <div className="space-x-2">
            <Link href="/login">
              <Button variant="outline" className="text-black  hover:bg-green-700">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="text-black hover:bg-green-700">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-20 bg-gradient-to-b from-green-50 to-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-green-800 mb-6">Welcome to KrishiSaarthi</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-10">
              Connecting farmers, soil testing companies, seed providers, and market agents on a single platform to
              revolutionize agriculture.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  Get Started
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Our Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  title: "Soil Testing",
                  description: "Request soil tests and receive detailed reports",
                  icon: "🧪",
                },
                {
                  title: "Crop Feeds",
                  description: "Share farming challenges and get community solutions",
                  icon: "🌾",
                },
                {
                  title: "Market Insights",
                  description: "Track crop prices and market trends",
                  icon: "📈",
                },
                {
                  title: "Crop Bidding",
                  description: "Get the best price for your produce through our bidding system",
                  icon: "🏷️",
                },
              ].map((feature, index) => (
                <div key={index} className="bg-green-50 p-6 rounded-lg text-center hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-green-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold">KrishiSaarthi</h2>
              <p className="text-gray-400">Empowering agriculture through technology</p>
            </div>
            <div className="flex gap-4">
              <Link href="/about" className="text-gray-300 hover:text-white">
                About
              </Link>
              <Link href="/contact" className="text-gray-300 hover:text-white">
                Contact
              </Link>
              <Link href="/privacy" className="text-gray-300 hover:text-white">
                Privacy
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-400">
            &copy; {new Date().getFullYear()} KrishiSaarthi. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
