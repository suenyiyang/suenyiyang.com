import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            suenyiyang.com
          </Link>
          <div className="space-x-6">
            <Link to="/" className="hover:text-gray-600">
              Home
            </Link>
            <Link to="/about" className="hover:text-gray-600">
              About
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
