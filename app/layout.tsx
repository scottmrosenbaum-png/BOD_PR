import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Business of Drinks | PR Generator',
  description: 'Professional PR tools for the spirits, wine, and beverage industry.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect and Link for Anton Font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Anton&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className={inter.className}>
        {/* Simple Header Wrapper */}
        <header className="w-full py-4 px-8 border-b border-zinc-100 bg-white sticky top-0 z-50">
          <div className="max-w-[1400px] mx-auto flex justify-between items-center">
            <span className="font-['Anton'] text-2xl uppercase tracking-tighter">
              Business <span className="text-[#FF8C00]">of</span> Drinks
            </span>
            <div className="hidden md:flex gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              <span>Podcast</span>
              <span>Newsletter</span>
              <span>PR Tool</span>
            </div>
          </div>
        </header>

        {children}
        
        <footer className="w-full py-12 border-t border-zinc-100 mt-12 bg-zinc-50">
          <div className="max-w-[1400px] mx-auto px-8 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              © 2026 Business of Drinks. All Rights Reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}