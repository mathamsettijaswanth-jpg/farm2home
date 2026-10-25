import React, { useState, useEffect } from 'react';
import {
  PackageCheck, Clock, CheckCircle2, Truck, XCircle,
  RefreshCw, MapPin, Calendar, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Order } from '../types';

export const OrdersPage: React.FC<{ onBackToHome: () => void }> = ({ onBackToHome }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const data = await api.getMyOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order? Harvested stock will be restored to the farmers.')) {
      return;
    }
    try {
      setCancellingId(orderId);
      await api.cancelOrder(orderId);
      await loadOrders();
    } catch (err: any) {
      alert(err.message || 'Could not cancel order.');
    } finally {
      setCancellingId(null);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">✓ Delivered</span>;
      case 'Cancelled':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">✕ Cancelled</span>;
      case 'Out for Delivery':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">🚚 Out for Delivery</span>;
      case 'Packed':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">📦 Packed</span>;
      case 'Accepted by Seller':
        return <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-bold">👨‍🌾 Accepted by Farmer</span>;
      default:
        return <span className="px-3 py-1 bg-stone-100 text-stone-800 rounded-full text-xs font-bold">⏳ {status}</span>;
    }
  };

  const getStepProgressIndex = (status: string) => {
    const sequence = ['Pending', 'Confirmed', 'Accepted by Seller', 'Packed', 'Out for Delivery', 'Delivered'];
    const idx = sequence.indexOf(status);
    return idx === -1 ? 1 : idx;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900">My Orders & Live Tracking</h1>
          <p className="text-xs text-stone-500">Track and manage your fresh harvest deliveries</p>
        </div>
        <button
          onClick={loadOrders}
          className="p-2 text-stone-500 hover:text-emerald-700 bg-white rounded-xl border border-stone-200 shadow-sm"
          title="Refresh Orders"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs text-stone-500 font-semibold">Loading your order history...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
          <div className="text-4xl">📦</div>
          <h3 className="text-base font-bold text-stone-800">No Orders Yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            You haven't ordered any fresh harvest yet. Browse our farm vegetables and fruits!
          </p>
          <button
            onClick={onBackToHome}
            className="mt-2 py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow"
          >
            Explore Fresh Harvest
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const stepIdx = getStepProgressIndex(order.status);
            const isCancelled = order.status === 'Cancelled';
            const canCancel = ['Pending', 'Confirmed'].includes(order.status);

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 space-y-5"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
                  <div>
                    <span className="text-xs font-bold text-emerald-800">Order ID</span>
                    <h3 className="text-lg font-black text-stone-900">{order.order_number}</h3>
                    <p className="text-[11px] text-stone-400">
                      Placed on {new Date(order.created_at).toLocaleDateString()} at{' '}
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {renderStatusBadge(order.status)}
                    <span className="text-xl font-black text-stone-900">₹{order.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Tracking Progress Bar */}
                {!isCancelled && (
                  <div className="space-y-2 py-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Live Delivery Progress</p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { title: 'Confirmed', icon: '📝' },
                        { title: 'Accepted', icon: '👨‍🌾' },
                        { title: 'Packed', icon: '📦' },
                        { title: 'Delivered', icon: '🏡' },
                      ].map((st, i) => {
                        const isDone = stepIdx >= (i + 1);
                        return (
                          <div key={i} className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 shadow-sm ${
                                isDone
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-stone-100 text-stone-400 border border-stone-200'
                              }`}
                            >
                              {st.icon}
                            </div>
                            <span className={`text-[11px] font-semibold ${isDone ? 'text-emerald-950' : 'text-stone-400'}`}>
                              {st.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Items Ordered Snapshot */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-2">
                  <span className="text-xs font-bold text-stone-700">Harvest Items</span>
                  <div className="divide-y divide-stone-200/60">
                    {order.items.map((it) => (
                      <div key={it.id} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-stone-900">{it.product_name}</span>
                          <span className="text-stone-500 ml-2">
                            ({it.quantity} {it.unit_type} × ₹{it.unit_price})
                          </span>
                        </div>
                        <span className="font-extrabold text-stone-800">₹{it.line_total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Snapshot & Cancellation */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 text-xs text-stone-600">
                  <div className="space-y-0.5">
                    <p className="flex items-center gap-1 font-semibold text-stone-800">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      {order.delivery_address?.address_line}, {order.delivery_address?.village_town}
                    </p>
                    <p className="text-[11px] text-stone-500">Slot: {order.delivery_slot}</p>
                  </div>

                  {canCancel && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancellingId === order.id}
                      className="py-2 px-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
