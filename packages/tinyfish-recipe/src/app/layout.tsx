import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PCC Enterprise Onboarder",
  description: "Turn any enterprise into a live PCC operator in 90 seconds — powered by TinyFish."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
