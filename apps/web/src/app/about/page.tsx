import { redirect } from 'next/navigation';

export default function AboutPage() {
  // Redirect to the bilingual about page
  redirect('/ru/about');
}
