import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/workspace/Header";

export const metadata: Metadata = {
  title: "LoopLab: Learning Based Interventions for Repeated Decisions in Business Processes",
  description:
    "An interactive research workbench for BPMN modeling, browser token simulation, and policy evaluation of repeated business process decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}

