import "./globals.css";

export const metadata = {
  title: "Turrion — martus.ai witness console",
  description: "Watch a cross-system causal chain reconstruct and the agent conflict surface.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
