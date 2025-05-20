import { Outlet } from "react-router-dom";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
