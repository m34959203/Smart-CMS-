import { TengriHeader } from '@/components/tengri-header';
import { TengriFooter } from '@/components/tengri-footer';

export const metadata = {
  title: 'Аймақ ақшамы - Қоғамдық-саяси желілік басылым',
  description: 'Аймақ ақшамы - қоғамдық-саяси желілік басылым',
};

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: 'kz' | 'ru' };
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <TengriHeader lang={params.lang} />
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
      <TengriFooter lang={params.lang} />
    </div>
  );
}

export async function generateStaticParams() {
  return [{ lang: 'kz' }, { lang: 'ru' }];
}
