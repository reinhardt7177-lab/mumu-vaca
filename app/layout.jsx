import "./globals.css";
import { FirebaseAnalyticsBootstrap } from "@/components/firebase/firebase-analytics-bootstrap";

export const metadata = {
  title: "슬기로운 방학 요정",
  description: "초등학생을 위한 따뜻한 방학 관리 서비스"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-fairy-cream text-fairy-ink antialiased">
        <FirebaseAnalyticsBootstrap />
        {children}
      </body>
    </html>
  );
}
