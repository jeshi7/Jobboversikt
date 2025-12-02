import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Søknadsoversikt - Job Tracker",
  description: "Minimalistisk oversikt over jobbsøknader",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

