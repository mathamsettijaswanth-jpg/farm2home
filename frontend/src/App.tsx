import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { LocationModal } from './components/LocationModal';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { MerchantDashboard } from './pages/MerchantDashboard';
import { ManagementDashboard } from './pages/ManagementDashboard';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);

  const renderActiveView = () => {
    switch (currentTab) {
      case 'auth':
        return (
          <AuthPage
            onSuccess={() => {
              // After login, navigate based on role
              if (user?.role === 'merchant') {
                setCurrentTab('merchant-dashboard');
              } else if (user?.role === 'management') {
                setCurrentTab('admin-dashboard');
              } else {
                setCurrentTab('home');
              }
            }}
            onBackToHome={() => setCurrentTab('home')}
          />
        );

      case 'checkout':
        return (
          <CheckoutPage
            onBackToShopping={() => setCurrentTab('home')}
            onViewOrders={() => setCurrentTab('orders')}
          />
        );

      case 'orders':
        return (
          <OrdersPage
            onBackToHome={() => setCurrentTab('home')}
          />
        );

      case 'merchant-dashboard':
        if (!user || user.role !== 'merchant') {
          return (
            <AuthPage
              onSuccess={() => setCurrentTab('merchant-dashboard')}
              onBackToHome={() => setCurrentTab('home')}
            />
          );
        }
        return <MerchantDashboard />;

      case 'admin-dashboard':
        if (!user || user.role !== 'management') {
          return (
            <AuthPage
              onSuccess={() => setCurrentTab('admin-dashboard')}
              onBackToHome={() => setCurrentTab('home')}
            />
          );
        }
        return <ManagementDashboard />;

      case 'home':
      default:
        return (
          <HomePage
            onLoginPrompt={() => setCurrentTab('auth')}
            onOpenLocation={() => setIsLocationModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcf9]">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderActiveView()}
      </main>

      <Footer />

      {/* Global Shopping Cart Drawer */}
      <CartDrawer
        onCheckout={() => setCurrentTab('checkout')}
      />

      {/* Global Location Selector Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
