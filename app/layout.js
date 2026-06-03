import { Noto_Nastaliq_Urdu, Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoNastaliq = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  variable: '--font-urdu',
  weight: ['400', '700'],
});

export const metadata = {
  title: 'Qanoon.pk — Free Legal Guides for Every Pakistani',
  description:
    'Community-driven legal guides, law references, and document templates for Pakistan. Starting with tenant and landlord rights in Punjab.',
  keywords: 'Pakistan law, tenant rights, landlord rights, Punjab, legal guide, قانون',
  openGraph: {
    title: 'Qanoon.pk',
    description: 'Free legal guides for every Pakistani',
    locale: 'ur_PK',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${notoNastaliq.variable}`}>
      <body className="bg-white text-gray-900 font-sans antialiased min-h-screen flex flex-col">
        {/* Navigation */}
        <header className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-[#1a5c38] flex items-center justify-center">
                <span className="text-white text-sm font-bold">ق</span>
              </div>
              <span className="font-bold text-lg text-[#1a5c38] group-hover:text-[#14472c] transition-colors">
                Qanoon.pk
              </span>
            </Link>
            <nav className="flex items-center gap-2">
              <Link
                href="/studio"
                className="text-xs sm:text-sm px-3 py-1.5 rounded-lg text-gray-600 hover:text-[#1a5c38] hover:bg-green-50 transition-all font-medium"
              >
                Sanity Studio
              </Link>
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-gray-100 bg-gray-50 mt-16">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-[#1a5c38] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">ق</span>
                  </div>
                  <span className="font-bold text-[#1a5c38]">Qanoon.pk</span>
                </div>
                <p className="text-sm text-gray-500">Free legal guides for every Pakistani.</p>
                <p
                  className="text-sm text-gray-500 mt-1 font-urdu"
                  dir="rtl"
                  lang="ur"
                >
                  ہر پاکستانی کے لیے مفت قانونی رہنمائی
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Disclaimer</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  All content on Qanoon.pk is legal <strong>information</strong>, not legal{' '}
                  <strong>advice</strong>. Always consult a qualified lawyer for your specific situation.
                </p>
                <p
                  className="text-xs text-gray-500 mt-2 font-urdu leading-loose"
                  dir="rtl"
                  lang="ur"
                >
                  یہ قانونی معلومات ہیں، قانونی مشورہ نہیں۔ اپنی صورت حال کے لیے وکیل سے رجوع کریں۔
                </p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4 text-center">
              <p className="text-xs text-gray-400">
                © {new Date().getFullYear()} Qanoon.pk — Community-driven. No login required. No ads.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
