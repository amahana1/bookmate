import { createBrowserRouter, Outlet, ScrollRestoration } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { NotFound } from './pages/NotFound';
import { RequireAuth } from './auth/RequireAuth';
import { RequireAdmin } from './auth/RequireAdmin';
import { Signup } from './pages/Signup';
import { Login } from './pages/Login';
import { ResetPassword } from './pages/ResetPassword';
import { ConfirmEmail } from './pages/ConfirmEmail';
import { Account } from './pages/Account';
import { Home } from './pages/Home';
import { Books } from './pages/Books';
import { BookForm } from './pages/BookForm';
import { MyLoans } from './pages/MyLoans';
import { BookPage } from './pages/BookPage';
import { LoanPage } from './pages/LoanPage';
import { useWaitingCount } from './auth/useWaiting';
import { About, Contact, HowItWorks, Impressum, Privacy, Rules } from './pages/Content';
import { Admin } from './pages/Admin';

function Layout() {
  const waiting = useWaitingCount();
  return (
    <>
      <Header waiting={waiting} />
      <main id="main" className="page container" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/books', element: <Books /> },
      { path: '/books/:id', element: <BookPage /> },
      { path: '/books/:id/edit', element: <RequireAuth><BookForm /></RequireAuth> },
      { path: '/add', element: <BookForm /> },
      { path: '/how-it-works', element: <HowItWorks /> },
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      { path: '/me', element: <RequireAuth><MyLoans /></RequireAuth> },
      { path: '/account', element: <RequireAuth><Account /></RequireAuth> },
      { path: '/about', element: <About /> },
      { path: '/rules', element: <Rules /> },
      { path: '/contact', element: <Contact /> },
      { path: '/privacy', element: <Privacy /> },
      { path: '/impressum', element: <Impressum /> },
      { path: '/loans/:id', element: <RequireAuth><LoanPage /></RequireAuth> },
      { path: '/reset-password', element: <ResetPassword /> },
      { path: '/confirm-email', element: <ConfirmEmail /> },
      { path: '/admin', element: <RequireAdmin><Admin /></RequireAdmin> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
