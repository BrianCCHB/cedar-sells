// Home page - redirects to listings - Cedar Sells

import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to listings page as the main experience
  redirect('/listings');
}
