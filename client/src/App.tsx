/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { broadcast, addListener } from "./lib/bc";
import { UserProfile, Product, Order, Review } from "./types";
import { Auth } from "./components/Auth";
import { FarmerDashboard } from "./components/FarmerDashboard";
import { BuyerInterface } from "./components/BuyerInterface";
import { AdminDashboard } from "./components/AdminDashboard";
import { Layout } from "./components/Layout";
import { Loader2 } from "lucide-react";
import { div } from "framer-motion/client";

// Initial Mock Data
const INITIAL_PRODUCTS: Product[] = [
  {
    id: "p1",
    sellerId: "farmer-id",
    sellerName: "Juan Dela Cruz",
    name: "Fresh Samar Rice",
    price: 50,
    quantity: 100,
    category: "rice",
    imageUrl: "https://picsum.photos/seed/rice/400/300",
    description: "High-quality organic rice from the fields of Calbiga.",
    farmerBio:
      "Farmer Juan has been cultivating the fertile lands of Calbiga for over 20 years. He is dedicated to preserving traditional Samar rice varieties.",
    farmingPractices: ["Organic Fertilizers", "Crop Rotation", "No Pesticides"],
    municipality: "Calbiga",
    createdAt: new Date().toISOString(),
  },
  {
    id: "p2",
    sellerId: "farmer-id",
    sellerName: "Juan Dela Cruz",
    name: "Organic Sweet Potatoes",
    price: 35,
    quantity: 50,
    category: "root crops",
    imageUrl: "https://picsum.photos/seed/potato/400/300",
    description: "Sweet and nutritious root crops harvested daily.",
    farmerBio:
      "Farmer Juan has been cultivating the fertile lands of Calbiga for over 20 years. He is dedicated to preserving traditional Samar rice varieties.",
    farmingPractices: ["Organic Fertilizers", "Crop Rotation", "No Pesticides"],
    municipality: "Calbiga",
    createdAt: new Date().toISOString(),
  },
];

export default function App() {
  const [users, setUsers] = useState<UserProfile[]>([
    {
      uid: "admin-id",
      email: "admin@example.com",
      displayName: "System Admin",
      role: "admin",
      isApproved: true,
      createdAt: new Date().toISOString(),
    },
    {
      uid: "farmer-id",
      email: "farmer@example.com",
      displayName: "Juan Dela Cruz",
      role: "farmer",
      municipality: "Catbalogan",
      isApproved: true,
      createdAt: new Date().toISOString(),
    },
    {
      uid: "buyer-id",
      email: "buyer@example.com",
      displayName: "Maria Clara",
      role: "buyer",
      municipality: "Calbayog",
      isApproved: true,
      createdAt: new Date().toISOString(),
    },
    // Removed hardcoded dummy pending users (Pedro Penduko, Liza Soberano)
  ]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "o1",
      buyerId: "buyer-id",
      buyerName: "Maria Clara",
      sellerId: "farmer-id",
      sellerName: "Juan Dela Cruz",
      productId: "p1",
      productName: "Premium Samar Rice",
      quantity: 2,
      totalPrice: 240,
      status: "delivered",
      deliveryDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: "o2",
      buyerId: "buyer-id",
      buyerName: "Maria Clara",
      sellerId: "farmer-id",
      sellerName: "Juan Dela Cruz",
      productId: "p2",
      productName: "Sweet Potatoes (Kamote)",
      quantity: 1,
      totalPrice: 45,
      status: "delivered",
      deliveryDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: "o3",
      buyerId: "buyer-id",
      buyerName: "Maria Clara",
      sellerId: "farmer-id",
      sellerName: "Juan Dela Cruz",
      productId: "p3",
      productName: "Fresh Calamansi",
      quantity: 5,
      totalPrice: 150,
      status: "pending",
      deliveryDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: "o4",
      buyerId: "buyer-id",
      buyerName: "Maria Clara",
      sellerId: "farmer-id",
      sellerName: "Juan Dela Cruz",
      productId: "p4",
      productName: "Fresh Calamansi",
      quantity: 3,
      totalPrice: 90,
      status: "collected",
      deliveryDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ]);
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: "r1",
      orderId: "o1",
      buyerId: "buyer-id",
      buyerName: "Maria Clara",
      sellerId: "farmer-id",
      productId: "p1",
      rating: 5,
      comment: "The rice is very fresh and high quality! Highly recommended.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "r2",
      orderId: "o2",
      buyerId: "buyer-id",
      buyerName: "Maria Clara",
      sellerId: "farmer-id",
      productId: "p2",
      rating: 4,
      comment: "Sweet potatoes are good, but some were small.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [activeView, setActiveView] = useState("dashboard");

  const handleLogin = (profile: UserProfile) => {
    setUsers((prev) => {
      if (prev.find((u) => u.uid === profile.uid)) return prev;
      return [...prev, profile];
    });
    // persist session
    try {
      localStorage.setItem("profile", JSON.stringify(profile));
    } catch {}
    setUser(profile);
    setActiveView("dashboard");
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem("idToken");
    localStorage.removeItem("profile");
  };

  const addProduct = (product: Omit<Product, "id" | "createdAt">) => {
    const API = ((import.meta.env.VITE_API_BASE as string) || "http://localhost:4000").replace(/\/+$/, '');
    const token = localStorage.getItem("idToken");
    fetch(`${API}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(product),
    })
      .then(async (res) => {
        if (!res.ok) {
          console.error("Failed to create product");
          return;
        }
        const data = await res.json();
        const p = data.product;
        setProducts((prev) => [{ ...p, createdAt: p.createdAt }, ...prev]);
      })
      .catch((err) => console.error("Add product error:", err));
  };

  // On mount: restore session, load products, orders and users (if admin)
  useEffect(() => {
    const API = ((import.meta.env.VITE_API_BASE as string) || "http://localhost:4000").replace(/\/+$/, '');
    try {
      const stored = localStorage.getItem("profile");
      const token = localStorage.getItem("idToken");
      if (stored) {
        const profile = JSON.parse(stored) as UserProfile;
        setUser(profile);
      }

      fetch(`${API}/products`)
        .then((r) => r.json())
        .then((d) => {
          if (d && Array.isArray(d.products))
            setProducts(
              d.products.map((p: any) => ({ ...p, id: p.id || p._id })),
            );
        })
        .catch((e) => console.error("Fetch products error", e));

      if (token) {
        fetch(`${API}/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((d) => {
            if (d && Array.isArray(d.orders))
              setOrders(
                d.orders.map((o: any) => ({ ...o, id: o.id || o._id })),
              );
          })
          .catch((e) => console.error("Fetch orders error", e));
      }

      const storedProfile = localStorage.getItem("profile");
      if (storedProfile) {
        const p = JSON.parse(storedProfile) as UserProfile;
        if (p.role === "admin") {
          const token = localStorage.getItem("idToken");
          fetch(`${API}/users`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.json())
            .then((d) => {
              if (d && Array.isArray(d.users)) setUsers(d.users);
            })
            .catch((e) => console.error("Fetch users error", e));
        }
      }

      // Listen for cross-tab updates via BroadcastChannel
      const off = addListener(async (msg) => {
        try {
          if (!msg || !msg.type) return;
          if (msg.type === 'products:refresh') {
            try {
              const r = await fetch(`${API}/products`);
              const d = await r.json();
              if (d && Array.isArray(d.products)) setProducts(d.products.map((p: any) => ({ ...p, id: p.id || p._id })));
            } catch (e) {
              console.error('BC refresh products error', e);
            }
          }
          if (msg.type === 'user:updated') {
            const profile = msg.payload as UserProfile;
            if (!profile || !profile.uid) return;
            setUsers((prev) => {
              if (prev.find((u) => u.uid === profile.uid)) return prev.map(u => u.uid === profile.uid ? { ...u, ...profile } : u);
              return [...prev, profile];
            });
            setProducts((prev) => prev.map(p => p.sellerId === profile.uid ? { ...p, municipality: (profile as any).municipality || p.municipality, location: (profile as any).location || p.location } : p));
            if (user?.uid === profile.uid) setUser(profile);
          }
        } catch (e) {
          console.error('BC handler exception', e);
        }
      });
    } catch (e) {
      console.error("Session restore error", e);
    }
  }, []);

  // Listen for order updates dispatched from child components (BuyerInterface) and merge into state
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        // @ts-ignore
        const detail = ev.detail;
        if (!detail || !detail.id) return;
        setOrders((prev) =>
          prev.map((o) => (o.id === detail.id ? { ...o, ...detail } : o)),
        );
      } catch (e) {
        console.error("order:updated handler error", e);
      }
    };
    window.addEventListener("order:updated", handler as EventListener);
    return () =>
      window.removeEventListener("order:updated", handler as EventListener);
  }, []);

  const deleteProduct = (id: string) => {
    const API = ((import.meta.env.VITE_API_BASE as string) || "http://localhost:4000").replace(/\/+$/, '');
    const token = localStorage.getItem("idToken");
    fetch(`${API}/products/${id}`, {
      method: "DELETE",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
      .then(async (res) => {
        if (!res.ok) {
          console.error("Failed to delete product");
          return;
        }
        setProducts((prev) => prev.filter((p) => p.id !== id));
      })
      .catch((err) => console.error("Delete product error:", err));
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const API = ((import.meta.env.VITE_API_BASE as string) || "http://localhost:4000").replace(/\/+$/, '');
    const token = localStorage.getItem("idToken");
    fetch(`${API}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(updates),
    })
      .then(async (res) => {
        if (!res.ok) {
          console.error("Failed to update product");
          return;
        }
        const data = await res.json();
        const updated = data.product;
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updated } : p)),
        );
      })
      .catch((err) => console.error("Update product error:", err));
  };

  const addOrder = (newOrders: Omit<Order, "id" | "createdAt">[]) => {
    const API = ((import.meta.env.VITE_API_BASE as string) || "http://localhost:4000").replace(/\/+$/, '');
    const token = localStorage.getItem("idToken");
    fetch(`${API}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(newOrders),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("Failed to place orders", err);
          return;
        }
        const data = await res.json();
        // data.results -> array with { ok: true, order, remaining }
        const placed = data.results
          .filter((r: any) => r.ok)
          .map((r: any) => r.order);
        setOrders((prev) => [...placed, ...prev]);
      })
      .catch((err) => console.error("Place order error:", err));
  };

  const addReview = (review: Omit<Review, "id" | "createdAt">) => {
    const newReview: Review = {
      ...review,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    setReviews([...reviews, newReview]);
  };

  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    const API = ((import.meta.env.VITE_API_BASE as string) || "http://localhost:4000").replace(/\/+$/, '');
    const token = localStorage.getItem("idToken");
    fetch(`${API}/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("Failed to update order status", err);
          return;
        }
        const data = await res.json();
        const updated = data.order || data;
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)),
        );
      })
      .catch((err) => {
        console.error("Update order status error:", err);
      });
  };

  const updateUser = (uid: string, updates: Partial<UserProfile>) => {
    // Persist change to backend (if available) and update local state
    const API = ((import.meta.env.VITE_API_BASE as string) || "http://localhost:4000").replace(/\/+$/, '');
    const token = localStorage.getItem("idToken");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch(`${API}/users/${uid}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updates),
    })
      .then(async (res) => {
        if (!res.ok) {
          console.error("Failed to update user on server");
          return;
        }
        const data = await res.json();
        const updated = data.profile;
        setUsers((prev) =>
          prev.map((u) => (u.uid === uid ? { ...u, ...updated } : u)),
        );
        // propagate location/municipality changes to products sold by this user
        setProducts((prev) =>
          prev.map((p) =>
            p.sellerId === uid
              ? {
                  ...p,
                  municipality: (updated as any).municipality || p.municipality,
                  location: (updated as any).location || p.location,
                }
              : p,
          ),
        );
        // Refresh products from server to pick up any DB-side propagation
        try {
          fetch(`${API}/products`)
            .then((r) => r.json())
            .then((d) => {
              if (d && Array.isArray(d.products))
                setProducts(d.products.map((p: any) => ({ ...p, id: p.id || p._id })));
            })
            .catch((e) => console.error('Refresh products error', e));
        } catch (e) {
          console.error('Refresh products exception', e);
        }
        // broadcast update to other tabs
        try {
          broadcast('user:updated', updated);
          broadcast('products:refresh', { by: uid, ts: Date.now() });
        } catch (e) {}
        if (user?.uid === uid) setUser({ ...user, ...updated } as UserProfile);
      })
      .catch((err) => {
        console.error("Update user error:", err);
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={handleLogin} />;
  }

  const renderContent = () => {
    switch (user.role) {
      case "farmer":
        if (!user.isApproved) {
          return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-stone-100 shadow-sm">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900 mb-2">
                Account Pending Approval
              </h2>
              <p className="text-stone-500 max-w-md mx-auto">
                Your farmer account has been created successfully. For security
                and quality assurance, our administrators need to review and
                approve your account before you can start listing products.
              </p>
              <div className="mt-8 p-4 bg-stone-50 rounded-xl border border-stone-100 text-sm text-stone-600">
                You will be able to access your dashboard once an admin approves
                your request.
              </div>
            </div>
          );
        }
        return (
          <FarmerDashboard
            user={user}
            products={products.filter((p) => p.sellerId === user.uid)}
            orders={orders.filter((o) => o.sellerId === user.uid)}
            reviews={reviews.filter((r) => r.sellerId === user.uid)}
            onAddProduct={addProduct}
            onDeleteProduct={deleteProduct}
            onUpdateProduct={updateProduct}
            onUpdateOrderStatus={updateOrderStatus}
            onUpdateUser={updateUser}
            activeView={activeView}
          />
        );
      case "buyer":
        return (
          <BuyerInterface
            user={user}
            products={products.filter((p) => {
              const seller = users.find((u) => u.uid === p.sellerId);
              return seller ? seller.isApproved !== false : true;
            })}
            orders={orders.filter((o) => o.buyerId === user.uid)}
            reviews={reviews}
            onPlaceOrder={addOrder}
            onAddReview={addReview}
            onSignOut={handleSignOut}
            onUpdateUser={updateUser}
          />
        );
      case "admin":
        return (
          <AdminDashboard
            user={user}
            products={products}
            orders={orders}
            users={users}
            onUpdateUser={updateUser}
            activeView={activeView}
          />
        );
      default:
        return <div>Invalid Role</div>;
    }
  };

  const pendingApprovalsCount = users.filter(
    (u) => u.role === "farmer" && u.isApproved === undefined,
  ).length;

  return (
    <Layout
      user={user}
      onSignOut={handleSignOut}
      activeView={activeView}
      onViewChange={setActiveView}
      pendingApprovalsCount={pendingApprovalsCount}
    >
      {renderContent()}
    </Layout>
  );
}
