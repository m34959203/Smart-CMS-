import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to Kazakh version by default
  redirect('/kz');
}
