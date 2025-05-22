import { Outlet } from "react-router-dom";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import "./index.css";

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-primary-white">
      <Header />
      <main className="flex-grow prose container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
