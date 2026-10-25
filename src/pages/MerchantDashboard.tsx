import React, { useState, useEffect } from 'react';
import {
  Tractor, Plus, Edit3, Trash2, PackageCheck, TrendingUp,
  MapPin, Check, X, RefreshCw, AlertCircle, Calendar, Store, Save
} from 'lucide-react';
import { api } from '../services/api';
import { Product, Category } from '../types';
import { useAuth } from '../context/AuthContext';

export const MerchantDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'profile'>('products');

  // Stats
  const [stats, setStats] = useState<any>(null);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchantOrders, setMerchantOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Add / Edit Product Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [prodName, setProdName] = useState<string>('');
  const [prodCatId, setProdCatId] = useState<number>(1);
  const [prodDesc, setProdDesc] = useState<string>('');
  const [prodImageUrl, setProdImageUrl] = useState<string>('');
  const [prodPrice, setProdPrice] = useState<number>(30);
  const [prodUnit, setProdUnit] = useState<string>('kg');
  const [prodStock, setProdStock] = useState<number>(50);
  const [prodFarmLocation, setProdFarmLocation] = useState<string>('Shadnagar Rural');
  const [prodHarvestDate, setProdHarvestDate] = useState<string>('Harvested today at dawn');
  const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false);

  // Profile Form state
  const [farmName, setFarmName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [farmAddress, setFarmAddress] = useState<string>('');
  const [village, setVillage] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsData, prods, cats, orders, prof] = await Promise.all([
        api.getMerchantStats(),
        api.getMyProducts(),
        api.getCategories(),
        api.getMerchantOrders(),
        api.getMerchantProfile()
      ]);
      setStats(statsData);
      setMyProducts(prods);
      setCategories(cats);
      setMerchantOrders(orders);

      if (prof) {
        setFarmName(prof.farm_or_shop_name || '');
        setContactPerson(prof.contact_person || '');
        setFarmAddress(prof.farm_address || '');
        setVillage(prof.village || '');
        setDistrict(prof.district || '');
        setState(prof.state || '');
        setProdFarmLocation(`${prof.village}, ${prof.district}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setProdName('');
    setProdCatId(categories[0]?.id || 1);
    setProdDesc('');
    setProdImageUrl('');
    setProdPrice(30);
    setProdUnit('kg');
    setProdStock(50);
    setProdHarvestDate('Harvested this morning');
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProductId(p.id);
    setProdName(p.name);
    setProdCatId(p.category_id);
    setProdDesc(p.description || '');
    setProdImageUrl(p.image_url || '');
    setProdPrice(p.price_per_unit);
    setProdUnit(p.unit_type);
    setProdStock(p.stock_quantity);
    setProdFarmLocation(p.farm_location);
    setProdHarvestDate(p.harvest_date || '');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProduct(true);
      if (editingProductId) {
        await api.updateProduct(editingProductId, {
          name: prodName,
          category_id: prodCatId,
          description: prodDesc,
          image_url: prodImageUrl || undefined,
          price_per_unit: Number(prodPrice),
          unit_type: prodUnit,
          stock_quantity: Number(prodStock),
          farm_location: prodFarmLocation,
          harvest_date: prodHarvestDate,
        });
      } else {
        await api.createProduct({
          name: prodName,
          category_id: prodCatId,
          description: prodDesc,
          image_url: prodImageUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
          price_per_unit: Number(prodPrice),
          unit_type: prodUnit,
          stock_quantity: Number(prodStock),
          farm_location: prodFarmLocation,
          harvest_date: prodHarvestDate,
          is_featured: false,
        });
      }

      setIsProductModalOpen(false);
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to remove this product listing?')) return;
    try {
      await api.deleteProduct(productId);
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await api.updateMerchantOrderStatus(orderId, newStatus);
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      setProfileSavedMsg(null);
      await api.updateMerchantProfile({
        farm_or_shop_name: farmName,
        contact_person: contactPerson,
        farm_address: farmAddress,
        village,
        district,
        state,
      });
      setProfileSavedMsg('Farm profile saved successfully!');
      setTimeout(() => setProfileSavedMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
      {/* Farmer Welcome Header & Status */}
      <div className="bg-gradient-to-r from-amber-800 to-amber-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-amber-100">
            <Tractor className="w-3.5 h-3.5" /> Farmer Merchant Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            {farmName || 'My Farm Dashboard'}
          </h1>
          <p className="text-xs text-amber-100">
            Welcome back, <strong>{contactPerson || user?.full_name}</strong> • Direct crop sales without commission
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="py-3 px-5 bg-white hover:bg-amber-50 text-amber-950 font-extrabold text-sm rounded-2xl shadow-lg transition active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-5 h-5 text-amber-700" /> Add New Crop Produce
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-stone-500 uppercase">Total Products</span>
          <p className="text-3xl font-black text-stone-900">{stats?.total_products || 0}</p>
          <span className="text-[11px] text-emerald-700 font-semibold">Active in marketplace</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-stone-500 uppercase">Customer Orders</span>
          <p className="text-3xl font-black text-amber-800">{stats?.total_orders || 0}</p>
          <span className="text-[11px] text-amber-700 font-semibold">
            {stats?.active_orders || 0} pending dispatch
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-stone-500 uppercase">Total Sales Revenue</span>
          <p className="text-3xl font-black text-emerald-700">₹{stats?.total_revenue || 0}</p>
          <span className="text-[11px] text-emerald-700 font-semibold">Direct farmer payout</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-stone-500 uppercase">Verification Status</span>
          <p className="text-xl font-black text-stone-900 mt-1 capitalize">
            {stats?.verification_status === 'approved' ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <Check className="w-5 h-5" /> Verified
              </span>
            ) : (
              <span className="text-amber-600">Pending Review</span>
            )}
          </p>
          <span className="text-[11px] text-stone-500">APMC / KCC Verified</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 gap-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition ${
            activeTab === 'products'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          My Crop Produce ({myProducts.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition ${
            activeTab === 'orders'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Customer Orders ({merchantOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition ${
            activeTab === 'profile'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Farm & Shop Profile
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: My Products List */}
      {/* ======================================================== */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">Manage Your Listed Harvest Produce</h2>
            <button
              onClick={handleOpenAddModal}
              className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Produce
            </button>
          </div>

          {myProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
              <div className="text-4xl">🌱</div>
              <h3 className="text-base font-bold text-stone-800">No Crops Listed Yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Add your first farm produce to start receiving orders from city households!
              </p>
              <button
                onClick={handleOpenAddModal}
                className="py-2.5 px-6 bg-amber-600 text-white font-bold text-xs rounded-xl shadow"
              >
                Add My First Crop
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase">
                    <tr>
                      <th className="p-4">Crop Produce</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Selling Price</th>
                      <th className="p-4">Available Stock</th>
                      <th className="p-4">Harvest Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {myProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-amber-50/40 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                            />
                            <div>
                              <p className="font-bold text-stone-900 text-sm">{p.name}</p>
                              <p className="text-[11px] text-stone-500">{p.farm_location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-stone-700">
                          {p.category_name}
                        </td>
                        <td className="p-4">
                          <span className="font-extrabold text-stone-900 text-sm">
                            ₹{p.price_per_unit}
                          </span>
                          <span className="text-stone-500"> / {p.unit_type}</span>
                        </td>
                        <td className="p-4 font-bold">
                          <span className={p.stock_quantity > 0 ? 'text-emerald-700' : 'text-red-600'}>
                            {p.stock_quantity} {p.unit_type}
                          </span>
                        </td>
                        <td className="p-4 text-stone-600">
                          {p.harvest_date || 'Fresh'}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-2 text-stone-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition"
                            title="Edit Price or Stock"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Remove Crop"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: Customer Orders List */}
      {/* ======================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-stone-900">Orders Received From Buyers</h2>

          {merchantOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
              <div className="text-4xl">📦</div>
              <h3 className="text-base font-bold text-stone-800">No Orders Received Yet</h3>
              <p className="text-xs text-stone-500">
                When consumers order your fresh produce, order notifications will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {merchantOrders.map((o) => (
                <div
                  key={o.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-amber-800">{o.order_number}</span>
                      <p className="text-xs text-stone-500">
                        Customer: <strong className="text-stone-900">{o.customer_name}</strong> ({o.customer_mobile})
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900">
                        Status: {o.status}
                      </span>
                      <span className="text-base font-extrabold text-stone-900">
                        Your Total: ₹{o.merchant_subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Customer items belonging to this farmer */}
                  <div className="p-3.5 bg-stone-50 rounded-xl space-y-1.5 text-xs">
                    <p className="font-bold text-stone-700">Ordered Produce:</p>
                    {o.merchant_items.map((it: any) => (
                      <div key={it.id} className="flex justify-between text-stone-800">
                        <span>{it.product_name} ({it.quantity} {it.unit_type} × ₹{it.unit_price})</span>
                        <span className="font-bold">₹{it.line_total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Customer Delivery Address */}
                  <div className="text-xs text-stone-600 space-y-0.5">
                    <p className="font-semibold text-stone-800">Deliver To:</p>
                    <p>{o.delivery_address?.address_line}, {o.delivery_address?.village_town}, {o.delivery_address?.district}</p>
                    <p className="text-stone-500">Preferred Slot: {o.delivery_slot}</p>
                  </div>

                  {/* Action buttons: Update status */}
                  <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-stone-500 mr-2">Update Order Status:</span>
                    <button
                      onClick={() => handleUpdateOrderStatus(o.id, 'Accepted by Seller')}
                      className="py-1.5 px-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200"
                    >
                      ✓ Accept Order
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(o.id, 'Packed')}
                      className="py-1.5 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200"
                    >
                      📦 Pack Harvest
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(o.id, 'Out for Delivery')}
                      className="py-1.5 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200"
                    >
                      🚚 Out for Delivery
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(o.id, 'Delivered')}
                      className="py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200"
                    >
                      🏡 Mark Delivered
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: Farm Profile Settings */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4 max-w-xl">
          <h2 className="text-lg font-bold text-stone-900">Manage Farm & Shop Profile</h2>

          {profileSavedMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
              {profileSavedMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Farm or Business Name *</label>
            <input
              type="text"
              required
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Contact Person Name *</label>
            <input
              type="text"
              required
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Farm / Mandi Address *</label>
            <textarea
              rows={2}
              required
              value={farmAddress}
              onChange={(e) => setFarmAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Village *</label>
              <input
                type="text"
                required
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">District *</label>
              <input
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">State *</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="py-3 px-6 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow transition"
          >
            {isSavingProfile ? 'Saving...' : 'Save Farm Profile'}
          </button>
        </form>
      )}

      {/* ======================================================== */}
      {/* Modal: Add / Edit Product */}
      {/* ======================================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-lg font-bold text-stone-900">
                {editingProductId ? 'Edit Crop Produce' : 'Add New Farm Produce'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Produce Name *</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Fresh Red Tomatoes"
                  className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Category *</label>
                  <select
                    value={prodCatId}
                    onChange={(e) => setProdCatId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Unit Type *</label>
                  <select
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl bg-white"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="500 g">500 g (Grams)</option>
                    <option value="bunch">bunch</option>
                    <option value="piece">piece</option>
                    <option value="litre">litre</option>
                    <option value="bag">bag</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Price per Unit (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Available Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Produce Image URL (Optional)</label>
                <input
                  type="url"
                  value={prodImageUrl}
                  onChange={(e) => setProdImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Farm Location *</label>
                  <input
                    type="text"
                    required
                    value={prodFarmLocation}
                    onChange={(e) => setProdFarmLocation(e.target.value)}
                    placeholder="e.g. Shadnagar Rural"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Harvest Date / Freshness</label>
                  <input
                    type="text"
                    value={prodHarvestDate}
                    onChange={(e) => setProdHarvestDate(e.target.value)}
                    placeholder="e.g. Harvested this morning"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Naturally grown, crisp, chemical-free..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingProduct}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow transition"
              >
                {isSavingProduct ? 'Saving Produce...' : 'Save & Publish Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
