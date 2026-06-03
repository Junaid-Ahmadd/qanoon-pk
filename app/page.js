import ConsoleClient from './ConsoleClient'

export const metadata = {
  title: 'Qanoon.pk — Automated Crowd-sourced Legal Chat & Document Directory',
  description:
    'Search and chat with Punjab legal documents (Bare Acts, Eviction Petitions, case laws) grounded using Gemini 2.5 Flash and Supabase.',
}

export default function HomePage() {
  return <ConsoleClient />
}
