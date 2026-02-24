// Home page - Cedar Sells

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-800 mb-4">Cedar Sells</h1>
        <p className="text-lg text-green-600 mb-8">
          Investment Properties in Lafayette, Baton Rouge & Surrounding Areas
        </p>
        <Link
          href="/listings"
          className="bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
        >
          View Properties
        </Link>
      </div>
    </div>
  );
}
