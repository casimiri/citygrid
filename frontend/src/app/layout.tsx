import {ReactNode} from 'react';
import { Inter } from 'next/font/google'
import './[locale]/globals.css'

const inter = Inter({ subsets: ['latin'] })

type Props = {
  children: ReactNode;
};

// This is the required root layout for Next.js 13+ App Router
export default function RootLayout({children}: Props) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}