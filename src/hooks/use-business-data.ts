
'use client';

import { useState, useEffect, useCallback } from 'react';
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

const LOCAL_KEYS = {
  PRODUCTS: 'specsbiz_local_products',
  SALES: 'specsbiz_local_sales',
  CUSTOMERS: 'specsbiz_local_customers',
  CURRENCY: 'specsbiz_settings_currency',
};

export function useBusinessData() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  // State for Local Data
  const [localProducts, setLocalProducts] = useState<any[]>([]);
  const [localSales, setLocalSales] = useState<any[]>([]);
  const [localCustomers, setLocalCustomers] = useState<any[]>([]);
  const [currency, setCurrencyState] = useState('৳');

  // Load from Local Storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const p = localStorage.getItem(LOCAL_KEYS.PRODUCTS);
        const s = localStorage.getItem(LOCAL_KEYS.SALES);
        const c = localStorage.getItem(LOCAL_KEYS.CUSTOMERS);
        const curr = localStorage.getItem(LOCAL_KEYS.CURRENCY);
        
        if (p) setLocalProducts(JSON.parse(p));
        if (s) setLocalSales(JSON.parse(s));
        if (c) setLocalCustomers(JSON.parse(c));
        if (curr) setCurrencyState(curr);
      } catch (e) {
        console.error("Error loading local data", e);
      }
    }
  }, []);

  // Firestore Queries (Memoized)
  const productsQuery = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return query(collection(db, 'users', user.uid, 'products'), orderBy('name'));
  }, [user?.uid, db]);

  const salesQuery = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return query(collection(db, 'users', user.uid, 'sales'), orderBy('saleDate', 'desc'));
  }, [user?.uid, db]);

  const customersQuery = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return query(collection(db, 'users', user.uid, 'customers'), orderBy('firstName'));
  }, [user?.uid, db]);

  const { data: fbProducts, isLoading: pLoading } = useCollection(productsQuery);
  const { data: fbSales, isLoading: sLoading } = useCollection(salesQuery);
  const { data: fbCustomers, isLoading: cLoading } = useCollection(customersQuery);

  // Unified Data
  const products = user ? (fbProducts || []) : localProducts;
  const sales = user ? (fbSales || []) : localSales;
  const customers = user ? (fbCustomers || []) : localCustomers;
  const isLoading = isUserLoading || (user && (pLoading || sLoading || cLoading));

  // --- Actions ---

  const addProduct = useCallback((product: any) => {
    const id = product.id || Date.now().toString();
    const data = { ...product, id };
    if (user?.uid && db) {
      addDocumentNonBlocking(collection(db, 'users', user.uid, 'products'), data);
    } else {
      setLocalProducts(prev => {
        const updated = [data, ...prev];
        localStorage.setItem(LOCAL_KEYS.PRODUCTS, JSON.stringify(updated));
        return updated;
      });
    }
  }, [user?.uid, db]);

  const updateProduct = useCallback((productId: string, data: any) => {
    if (user?.uid && db) {
      updateDocumentNonBlocking(doc(db, 'users', user.uid, 'products', productId), data);
    } else {
      setLocalProducts(prev => {
        const updated = prev.map(p => p.id === productId ? { ...p, ...data } : p);
        localStorage.setItem(LOCAL_KEYS.PRODUCTS, JSON.stringify(updated));
        return updated;
      });
    }
  }, [user?.uid, db]);

  const deleteProduct = useCallback((productId: string) => {
    if (user?.uid && db) {
      deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'products', productId));
    } else {
      setLocalProducts(prev => {
        const updated = prev.filter(p => p.id !== productId);
        localStorage.setItem(LOCAL_KEYS.PRODUCTS, JSON.stringify(updated));
        return updated;
      });
    }
  }, [user?.uid, db]);

  const addSale = useCallback((sale: any) => {
    const id = sale.id || Date.now().toString();
    const data = { ...sale, id, saleDate: new Date().toISOString() };
    
    if (user?.uid && db) {
      addDocumentNonBlocking(collection(db, 'users', user.uid, 'sales'), data);
      
      // Update stock for each product in sale
      if (data.items) {
        data.items.forEach((item: any) => {
          const productRef = doc(db, 'users', user.uid, 'products', item.id);
          const currentProduct = products.find(p => p.id === item.id);
          if (currentProduct) {
            updateDocumentNonBlocking(productRef, {
              stock: Math.max(0, currentProduct.stock - item.quantity)
            });
          }
        });
      }
    } else {
      setLocalSales(prev => {
        const updated = [data, ...prev];
        localStorage.setItem(LOCAL_KEYS.SALES, JSON.stringify(updated));
        return updated;
      });
      
      // Local stock update
      setLocalProducts(prev => {
        const updatedProducts = prev.map(p => {
          const saleItem = data.items?.find((i: any) => i.id === p.id);
          if (saleItem) {
            return { ...p, stock: Math.max(0, p.stock - saleItem.quantity) };
          }
          return p;
        });
        localStorage.setItem(LOCAL_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
        return updatedProducts;
      });
    }
  }, [user?.uid, db, products]);

  const deleteSale = useCallback((saleId: string) => {
    const saleToDelete = sales.find(s => s.id === saleId);
    if (!saleToDelete) return;

    if (user?.uid && db) {
      deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'sales', saleId));
      
      // Revert stock
      if (saleToDelete.items) {
        saleToDelete.items.forEach((item: any) => {
          const productRef = doc(db, 'users', user.uid, 'products', item.id);
          const currentProduct = products.find(p => p.id === item.id);
          if (currentProduct) {
            updateDocumentNonBlocking(productRef, {
              stock: currentProduct.stock + item.quantity
            });
          }
        });
      }
    } else {
      setLocalSales(prev => {
        const updatedSales = prev.filter(s => s.id !== saleId);
        localStorage.setItem(LOCAL_KEYS.SALES, JSON.stringify(updatedSales));
        return updatedSales;
      });

      // Revert local stock
      setLocalProducts(prev => {
        const updatedProducts = prev.map(p => {
          const saleItem = saleToDelete.items?.find((i: any) => i.id === p.id);
          if (saleItem) {
            return { ...p, stock: p.stock + saleItem.quantity };
          }
          return p;
        });
        localStorage.setItem(LOCAL_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
        return updatedProducts;
      });
    }
  }, [user?.uid, db, sales, products]);

  const addCustomer = useCallback((customer: any) => {
    const id = customer.id || Date.now().toString();
    const data = { ...customer, id };
    if (user?.uid && db) {
      addDocumentNonBlocking(collection(db, 'users', user.uid, 'customers'), data);
    } else {
      setLocalCustomers(prev => {
        const updated = [data, ...prev];
        localStorage.setItem(LOCAL_KEYS.CUSTOMERS, JSON.stringify(updated));
        return updated;
      });
    }
  }, [user?.uid, db]);

  const updateCustomer = useCallback((customerId: string, data: any) => {
    if (user?.uid && db) {
      updateDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId), data);
    } else {
      setLocalCustomers(prev => {
        const updated = prev.map(c => c.id === customerId ? { ...c, ...data } : c);
        localStorage.setItem(LOCAL_KEYS.CUSTOMERS, JSON.stringify(updated));
        return updated;
      });
    }
  }, [user?.uid, db]);

  const deleteCustomer = useCallback((customerId: string) => {
    if (user?.uid && db) {
      deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId));
    } else {
      setLocalCustomers(prev => {
        const updated = prev.filter(c => c.id !== customerId);
        localStorage.setItem(LOCAL_KEYS.CUSTOMERS, JSON.stringify(updated));
        return updated;
      });
    }
  }, [user?.uid, db]);

  const setCurrency = useCallback((val: string) => {
    setCurrencyState(val);
    localStorage.setItem(LOCAL_KEYS.CURRENCY, val);
  }, []);

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
