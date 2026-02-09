
'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  query, 
  orderBy, 
} from 'firebase/firestore';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from '@/firebase/non-blocking-updates';

export function useBusinessData() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  // Local Storage Keys
  const LOCAL_KEYS = {
    PRODUCTS: 'specsbiz_local_products',
    SALES: 'specsbiz_local_sales',
    CUSTOMERS: 'specsbiz_local_customers',
    CURRENCY: 'specsbiz_settings_currency',
  };

  // State for Local Data
  const [localProducts, setLocalProducts] = useState<any[]>([]);
  const [localSales, setLocalSales] = useState<any[]>([]);
  const [localCustomers, setLocalCustomers] = useState<any[]>([]);
  const [currency, setCurrencyState] = useState('৳');

  // Load from Local Storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = localStorage.getItem(LOCAL_KEYS.PRODUCTS);
      const s = localStorage.getItem(LOCAL_KEYS.SALES);
      const c = localStorage.getItem(LOCAL_KEYS.CUSTOMERS);
      const curr = localStorage.getItem(LOCAL_KEYS.CURRENCY);
      
      if (p) setLocalProducts(JSON.parse(p));
      if (s) setLocalSales(JSON.parse(s));
      if (c) setLocalCustomers(JSON.parse(c));
      if (curr) setCurrencyState(curr);
    }
  }, []);

  // Firestore Queries (Memoized)
  const productsQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(collection(db, 'users', user.uid, 'products'), orderBy('name'));
  }, [user, db]);

  const salesQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(collection(db, 'users', user.uid, 'sales'), orderBy('saleDate', 'desc'));
  }, [user, db]);

  const customersQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(collection(db, 'users', user.uid, 'customers'), orderBy('firstName'));
  }, [user, db]);

  const { data: fbProducts, isLoading: pLoading } = useCollection(productsQuery);
  const { data: fbSales, isLoading: sLoading } = useCollection(salesQuery);
  const { data: fbCustomers, isLoading: cLoading } = useCollection(customersQuery);

  // Unified Data
  const products = user ? (fbProducts || []) : localProducts;
  const sales = user ? (fbSales || []) : localSales;
  const customers = user ? (fbCustomers || []) : localCustomers;
  const isLoading = isUserLoading || (user && (pLoading || sLoading || cLoading));

  // --- Actions ---

  const addProduct = (product: any) => {
    const id = product.id || Date.now().toString();
    const data = { ...product, id };
    if (user && db) {
      addDocumentNonBlocking(collection(db, 'users', user.uid, 'products'), data);
    } else {
      const updated = [data, ...localProducts];
      setLocalProducts(updated);
      localStorage.setItem(LOCAL_KEYS.PRODUCTS, JSON.stringify(updated));
    }
  };

  const updateProduct = (productId: string, data: any) => {
    if (user && db) {
      updateDocumentNonBlocking(doc(db, 'users', user.uid, 'products', productId), data);
    } else {
      const updated = localProducts.map(p => p.id === productId ? { ...p, ...data } : p);
      setLocalProducts(updated);
      localStorage.setItem(LOCAL_KEYS.PRODUCTS, JSON.stringify(updated));
    }
  };

  const deleteProduct = (productId: string) => {
    if (user && db) {
      deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'products', productId));
    } else {
      const updated = localProducts.filter(p => p.id !== productId);
      setLocalProducts(updated);
      localStorage.setItem(LOCAL_KEYS.PRODUCTS, JSON.stringify(updated));
    }
  };

  const addSale = (sale: any) => {
    const id = sale.id || Date.now().toString();
    const data = { ...sale, id, saleDate: new Date().toISOString() };
    if (user && db) {
      addDocumentNonBlocking(collection(db, 'users', user.uid, 'sales'), data);
      
      // Update stock for each product in sale
      if (data.items) {
        data.items.forEach((item: any) => {
          const productRef = doc(db, 'users', user.uid, 'products', item.id);
          const currentProduct = fbProducts?.find(p => p.id === item.id);
          if (currentProduct) {
            updateDocumentNonBlocking(productRef, {
              stock: Math.max(0, currentProduct.stock - item.quantity)
            });
          }
        });
      }
    } else {
      const updated = [data, ...localSales];
      setLocalSales(updated);
      localStorage.setItem(LOCAL_KEYS.SALES, JSON.stringify(updated));
      
      // Local stock update
      const updatedProducts = localProducts.map(p => {
        const saleItem = data.items?.find((i: any) => i.id === p.id);
        if (saleItem) {
          return { ...p, stock: Math.max(0, p.stock - saleItem.quantity) };
        }
        return p;
      });
      setLocalProducts(updatedProducts);
      localStorage.setItem(LOCAL_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
    }
  };

  const deleteSale = (saleId: string) => {
    const saleToDelete = sales.find(s => s.id === saleId);
    if (!saleToDelete) return;

    if (user && db) {
      deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'sales', saleId));
      
      // Revert stock
      if (saleToDelete.items) {
        saleToDelete.items.forEach((item: any) => {
          const productRef = doc(db, 'users', user.uid, 'products', item.id);
          const currentProduct = fbProducts?.find(p => p.id === item.id);
          if (currentProduct) {
            updateDocumentNonBlocking(productRef, {
              stock: currentProduct.stock + item.quantity
            });
          }
        });
      }
    } else {
      const updatedSales = localSales.filter(s => s.id !== saleId);
      setLocalSales(updatedSales);
      localStorage.setItem(LOCAL_KEYS.SALES, JSON.stringify(updatedSales));

      // Revert local stock
      const updatedProducts = localProducts.map(p => {
        const saleItem = saleToDelete.items?.find((i: any) => i.id === p.id);
        if (saleItem) {
          return { ...p, stock: p.stock + saleItem.quantity };
        }
        return p;
      });
      setLocalProducts(updatedProducts);
      localStorage.setItem(LOCAL_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
    }
  };

  const addCustomer = (customer: any) => {
    const id = customer.id || Date.now().toString();
    const data = { ...customer, id };
    if (user && db) {
      addDocumentNonBlocking(collection(db, 'users', user.uid, 'customers'), data);
    } else {
      const updated = [data, ...localCustomers];
      setLocalCustomers(updated);
      localStorage.setItem(LOCAL_KEYS.CUSTOMERS, JSON.stringify(updated));
    }
  };

  const updateCustomer = (customerId: string, data: any) => {
    if (user && db) {
      updateDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId), data);
    } else {
      const updated = localCustomers.map(c => c.id === customerId ? { ...c, ...data } : c);
      setLocalCustomers(updated);
      localStorage.setItem(LOCAL_KEYS.CUSTOMERS, JSON.stringify(updated));
    }
  };

  const deleteCustomer = (customerId: string) => {
    if (user && db) {
      deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId));
    } else {
      const updated = localCustomers.filter(c => c.id !== customerId);
      setLocalCustomers(updated);
      localStorage.setItem(LOCAL_KEYS.CUSTOMERS, JSON.stringify(updated));
    }
  };

  const setCurrency = (val: string) => {
    setCurrencyState(val);
    localStorage.setItem(LOCAL_KEYS.CURRENCY, val);
  };

  return {
    products,
    sales,
    customers,
    isLoading,
    currency,
    actions: {
      addProduct,
      updateProduct,
      deleteProduct,
      addSale,
      deleteSale,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      setCurrency
    }
  };
}
