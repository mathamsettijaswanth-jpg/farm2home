import React, { useState, useEffect } from 'react';
import {
  Shield, Users, Tractor, ShoppingCart, DollarSign,
  CheckCircle, XCircle, Trash2, Settings, AlertTriangle,
  RefreshCw, Check, X, ShieldAlert, CreditCard
} from 'lucide-react';
import { api } from '../services/api';
import { AdminStats, DeliverySettings, Order } from '../types';

export const ManagementDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'merchants' | 'customers' | 'products' | 'orders' | 'payments' | 'settings'>('overview');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Settings form
  const [baseFee, setBaseFee] = useState<number>(30);
  const [freeThreshold, setFreeThreshold] = useState<number>(300);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [statsData, merchs, custs, prods, ords, pymts, dsettings] = await Promise.all([
        api.getAdminStats(),
        api.getAdminMerchants(),
        api.getAdminCustomers(),
        api.getProducts(),
        api.getAdminOrders(),
        api.getAdminPayments(),
        api.getDeliverySettings(),
      ]);
      setStats(statsData);
      setMerchants(merchs);
      setCustomers(custs);
      setProducts(prods);
      setOrders(ords);
      setPayments(pymts);
      setDeliverySettings(dsettings);
      if (dsettings) {
        setBaseFee(dsettings.base_delivery_fee);
        setFreeThreshold(dsettings.free_delivery_threshold);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMerchantVerification = async (merchantId: number, status: 'approved' | 'rejected') => {
    const reason = status === 'rejected' ? prompt('Enter rejection reason:') || 'Incomplete documentation' : undefined;
    try {
      await api.updateMerchantVerification(merchantId, status, reason);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update merchant verification');
    }
  };

  const handleToggleUserStatus = async (userId: number, currentActive: boolean) => {
    const action = currentActive ? 'suspend' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this account?`)) return;
    try {
      await api.toggleUserStatus(userId, !currentActive);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleModerateProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to moderate and remove this listing?')) return;
    try {
      await api.moderateDeleteProduct(productId);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove product');
    }
  };

  const handleSaveDeliverySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateDeliverySettings({
        base_delivery_fee: Number(baseFee),
        free_delivery_threshold: Number(freeThreshold),
      });
      setSettingsMsg('Delivery settings updated across platform!');
      setTimeout(() => setSettingsMsg(null), 3000);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-purple-200">
            <Shield className="w-3.5 h-3.5" /> Administrative Governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Farm2Home Platform Management</h1>
          <p className="text-xs text-purple-200">
            Kisan approvals, customer accounts, catalog moderation, and simulated finance logs.
          </p>
        </div>

        <button
          onClick={loadAllData}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition border border-white/20"
          title="Refresh Management Data"
        >
          <RefreshCw className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[11px] font-bold text-stone-500 uppercase">Customers</span>
          <p className="text-2xl font-black text-stone-900 mt-1">{stats?.total_customers || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[11px] font-bold text-stone-500 uppercase">Farmers / Merchants</span>
          <p className="text-2xl font-black text-amber-700 mt-1">{stats?.total_merchants || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[11px] font-bold text-stone-500 uppercase">Pending Farmers</span>
          <p className="text-2xl font-black text-red-600 mt-1">{stats?.pending_merchants || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[11px] font-bold text-stone-500 uppercase">Total Orders</span>
          <p className="text-2xl font-black text-blue-700 mt-1">{stats?.total_orders || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[11px] font-bold text-stone-500 uppercase">Simulated GMV</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">₹{stats?.total_revenue || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 shrink-0 ${
            activeTab === 'overview' ? 'border-purple-700 text-purple-900' : 'border-transparent text-stone-500'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('merchants')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 shrink-0 ${
            activeTab === 'merchants' ? 'border-purple-700 text-purple-900' : 'border-transparent text-stone-500'
          }`}
        >
          Farmers & Approvals ({merchants.length})
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 shrink-0 ${
            activeTab === 'customers' ? 'border-purple-700 text-purple-900' : 'border-transparent text-stone-500'
          }`}
        >
          Customers ({customers.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 shrink-0 ${
            activeTab === 'products' ? 'border-purple-700 text-purple-900' : 'border-transparent text-stone-500'
          }`}
        >
          Product Catalog ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 shrink-0 ${
            activeTab === 'orders' ? 'border-purple-700 text-purple-900' : 'border-transparent text-stone-500'
          }`}
        >
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 shrink-0 ${
            activeTab === 'payments' ? 'border-purple-700 text-purple-900' : 'border-transparent text-stone-500'
          }`}
        >
          Demo Payments ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 shrink-0 ${
            activeTab === 'settings' ? 'border-purple-700 text-purple-900' : 'border-transparent text-stone-500'
          }`}
        >
          Platform Delivery Fee
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: Farmers & Merchants Approvals */}
      {/* ======================================================== */}
      {activeTab === 'merchants' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900">Farmer & Seller Applications</h3>
            <span className="text-xs text-stone-500">Approve or reject farmer onboarding</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase">
                <tr>
                  <th className="p-4">Farm / Seller</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Crops</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Account</th>
                  <th className="p-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {merchants.map((m) => (
                  <tr key={m.id} className="hover:bg-purple-50/30">
                    <td className="p-4">
                      <p className="font-bold text-stone-900 text-sm">{m.farm_name}</p>
                      <p className="text-[11px] text-stone-500">{m.full_name} • {m.mobile}</p>
                    </td>
                    <td className="p-4 text-stone-700">
                      {m.village}, {m.district}, {m.state}
                    </td>
                    <td className="p-4 font-semibold text-stone-600">
                      {m.product_count} active listings
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                        m.verification_status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.verification_status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {m.verification_status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`font-semibold ${m.is_active ? 'text-emerald-700' : 'text-red-600'}`}>
                        {m.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {m.verification_status !== 'approved' && (
                        <button
                          onClick={() => handleMerchantVerification(m.id, 'approved')}
                          className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px]"
                        >
                          Approve
                        </button>
                      )}
                      {m.verification_status !== 'rejected' && (
                        <button
                          onClick={() => handleMerchantVerification(m.id, 'rejected')}
                          className="py-1 px-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[11px]"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleUserStatus(m.id, m.is_active)}
                        className="py-1 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold text-[11px]"
                      >
                        {m.is_active ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: Customers Management */}
      {/* ======================================================== */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900">Registered Customers</h3>
            <span className="text-xs text-stone-500">{customers.length} households registered</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Total Orders</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Account Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-purple-50/30">
                    <td className="p-4 font-bold text-stone-900 text-sm">
                      {c.full_name}
                    </td>
                    <td className="p-4 text-stone-600">
                      <p>{c.email}</p>
                      <p className="text-[11px] text-stone-400">{c.mobile}</p>
                    </td>
                    <td className="p-4 text-stone-700">
                      {c.village_town}, {c.district}
                    </td>
                    <td className="p-4 font-bold text-emerald-800">
                      {c.order_count} orders
                    </td>
                    <td className="p-4">
                      <span className={`font-semibold ${c.is_active ? 'text-emerald-700' : 'text-red-600'}`}>
                        {c.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleUserStatus(c.id, c.is_active)}
                        className={`py-1 px-3 rounded-lg font-bold text-[11px] ${
                          c.is_active
                            ? 'bg-red-50 hover:bg-red-100 text-red-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {c.is_active ? 'Suspend Account' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: Product Catalog Moderation */}
      {/* ======================================================== */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900">Platform Produce Moderation</h3>
            <span className="text-xs text-stone-500">Remove defective or inappropriate crop listings</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Seller Farm</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-purple-50/30">
                    <td className="p-4 font-bold text-stone-900 text-sm">
                      {p.name}
                    </td>
                    <td className="p-4 text-stone-600">{p.category_name}</td>
                    <td className="p-4 font-extrabold text-stone-900">₹{p.price_per_unit} / {p.unit_type}</td>
                    <td className="p-4 text-stone-700">{p.merchant_farm || p.merchant_name}</td>
                    <td className="p-4 font-semibold text-emerald-800">{p.stock_quantity} {p.unit_type}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleModerateProduct(p.id)}
                        className="py-1 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-bold text-[11px]"
                      >
                        Remove Listing
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: Demo Payments Inspection */}
      {/* ======================================================== */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm space-y-4">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900">Simulated Payment Logs</h3>
              <p className="text-xs text-stone-500">Demo payment records for audits and simulations</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
              Demo Simulation Only
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase">
                <tr>
                  <th className="p-4">Tx Reference</th>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-purple-50/30">
                    <td className="p-4 font-bold text-stone-900">{p.transaction_ref}</td>
                    <td className="p-4 text-stone-600">{p.order_number}</td>
                    <td className="p-4 font-sans">{p.customer_name}</td>
                    <td className="p-4 font-sans font-bold">{p.payment_method}</td>
                    <td className="p-4 font-black text-emerald-700">₹{p.amount}</td>
                    <td className="p-4 font-sans">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        p.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 font-sans text-stone-400 text-[11px]">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: Platform Delivery Fee Settings */}
      {/* ======================================================== */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveDeliverySettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-5 max-w-lg">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-stone-900">Platform-Wide Delivery Configuration</h3>
            <p className="text-xs text-stone-500">Configure delivery charges and free delivery threshold</p>
          </div>

          {settingsMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
              {settingsMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Base Delivery Fee (₹)</label>
            <input
              type="number"
              min="0"
              step="5"
              value={baseFee}
              onChange={(e) => setBaseFee(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-[11px] text-stone-400 mt-1">Standard rate charged for orders below threshold.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Free Delivery Threshold (₹)</label>
            <input
              type="number"
              min="50"
              step="50"
              value={freeThreshold}
              onChange={(e) => setFreeThreshold(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-[11px] text-stone-400 mt-1">Orders above this amount unlock automatic free delivery.</p>
          </div>

          <button
            type="submit"
            className="py-3 px-6 bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm rounded-xl shadow transition"
          >
            Save Delivery Settings
          </button>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 0: Overview Summary */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 space-y-4">
            <h3 className="text-base font-bold text-stone-900">Recent Customer Orders</h3>
            <div className="divide-y divide-stone-100">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900">{o.order_number}</span>
                    <p className="text-stone-500">{o.items.length} items • Status: {o.status}</p>
                  </div>
                  <span className="font-extrabold text-emerald-700">₹{o.total_amount}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 space-y-4">
            <h3 className="text-base font-bold text-stone-900">Recent Merchant Registrations</h3>
            <div className="divide-y divide-stone-100">
              {merchants.slice(0, 5).map((m) => (
                <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900">{m.farm_name}</span>
                    <p className="text-stone-500">{m.village}, {m.district}</p>
                  </div>
                  <span className="font-bold capitalize text-amber-700">{m.verification_status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
