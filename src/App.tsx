/**
 * App.tsx
 * Root component — wraps the app in ErrorBoundary and Toast provider,
 * renders Navbar, all feature sections, and Footer.
 */

import { ErrorBoundary }  from './components/ErrorBoundary';
import { ToastProvider }  from './components/Toast';
import { Navbar }         from './components/Navbar';
import { Footer }         from './components/Footer';
import { HomePage }       from './features/home';
import { BookingPage }    from './features/booking';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className="min-h-screen font-sans antialiased">
          <Navbar />
          <main>
            <HomePage />
            <BookingPage />
          </main>
          <Footer />
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
