export default function Footer() {
  return (
    <footer className="bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center text-gray-600">
          <p>
            &copy; {new Date().getFullYear()} suenyiyang.com. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
