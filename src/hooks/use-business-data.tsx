
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  collection, 
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  getDocs,
  writeBatch
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
  LANGUAGE: 'specsbiz_settings_language',
};

interface BusinessContextType {
  products: any[];
  sales: any[];
  customers: any[];
  isLoading: boolean;
  currency: string;
  language: 'en' | 'bn';
  actions: {
    addProduct: (product: any) => void;
    updateProduct: (productId: string, data: any) => void;
    deleteProduct: (productId: string) => void;
    addSale: (sale: any) => void;
    deleteSale: (saleId: string) => void;
    addCustomer: (customer: any) => void;
    updateCustomer: (customerId: string, data: any) => void;
    deleteCustomer: (customerId: string) => void;
    addBakiRecord: (customerId: string, record: any) => void;
    payBakiRecord: (customerId: string, recordId: string, amountToPay: number, currentRecord: any) => void;
    deleteBakiRecord: (customerId: string, recordId: string, remainingAmount: number) => void;
    setCurrency: (val: string) => void;
    setLanguage: (lang: 'en' | 'bn') => void;
    resetAllData: () => Promise<void>;
  };
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  // State for Local Data
  const [localProducts, setLocalProducts] = useState<any[]>([]);
  const [localSales, setLocalSales] = useState<any[]>([]);
  const [localCustomers, setLocalCustomers] = useState<any[]>([]);
  const [currency, setCurrencyState] = useState('৳');
  const [language, setLanguageState] = useState<'en' | 'bn'>('bn');

  // Load from Local Storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const p = localStorage.getItem(LOCAL_KEYS.PRODUCTS);
        const s = localStorage.getItem(LOCAL_KEYS.SALES);
        const c = localStorage.getItem(LOCAL_KEYS.CUSTOMERS);
        const curr = localStorage.getItem(LOCAL_KEYS.CURRENCY);
        const lang = localStorage.getItem(LOCAL_KEYS.LANGUAGE) as 'en' | 'bn';
        
        if (p) setLocalProducts(JSON.parse(p));
        if (s) setLocalSales(JSON.parse(s));
        if (c) setLocalCustomers(JSON.parse(c));
        if (curr) setCurrencyState(curr);
        if (lang) setLanguageState(lang);
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
      if (data.items && !data.isBakiPayment) {
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
      if (!data.isBakiPayment) {
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
    }
  }, [user?.uid, db, products]);

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

  const addBakiRecord = useCallback((customerId: string, record: any) => {
    const recordId = Date.now().toString();
    const data = { ...record, id: recordId, takenDate: new Date().toISOString(), paidAmount: 0, status: 'pending' };
    
    if (user?.uid && db) {
      addDocumentNonBlocking(collection(db, 'users', user.uid, 'customers', customerId, 'bakiRecords'), data);
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        updateDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId), {
          totalDue: (customer.totalDue || 0) + data.amount
        });
      }
    } else {
      const updatedCustomers = localCustomers.map(c => {
        if (c.id === customerId) {
          const records = c.bakiRecords || [];
          return { 
            ...c, 
            totalDue: (c.totalDue || 0) + data.amount,
            bakiRecords: [data, ...records]
          };
        }
        return c;
      });
      setLocalCustomers(updatedCustomers);
      localStorage.setItem(LOCAL_KEYS.CUSTOMERS, JSON.stringify(updatedCustomers));
    }
  }, [user?.uid, db, customers, localCustomers]);

  const payBakiRecord = useCallback((customerId: string, recordId: string, amountToPay: number, currentRecord: any) => {
    const newPaidAmount = (currentRecord.paidAmount || 0) + amountToPay;
    const isFullyPaid = newPaidAmount >= currentRecord.amount;
    const remaining = Math.max(0, currentRecord.amount - newPaidAmount);
    
    // Add to Sales
    const saleData = {
      total: amountToPay,
      profit: 0, 
      items: [{ name: `Baki Payment: ${currentRecord.productName}`, quantity: 1, sellingPrice: amountToPay }],
      isBakiPayment: true,
      bakiProductName: currentRecord.productName,
      remainingAmount: remaining,
      customerId: customerId,
      saleDate: new Date().toISOString()
    };
    addSale(saleData);

    if (user?.uid && db) {
      const recordRef = doc(db, 'users', user.uid, 'customers', customerId, 'bakiRecords', recordId);
      updateDocumentNonBlocking(recordRef, {
        paidAmount: newPaidAmount,
        status: isFullyPaid ? 'paid' : 'pending'
      });
      
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        updateDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId), {
          totalDue: Math.max(0, (customer.totalDue || 0) - amountToPay)
        });
      }
    } else {
      const updatedCustomers = localCustomers.map(c => {
        if (c.id === customerId) {
          const records = (c.bakiRecords || []).map((r: any) => {
            if (r.id === recordId) {
              return { 
                ...r, 
                paidAmount: newPaidAmount, 
                status: isFullyPaid ? 'paid' : 'pending' 
              };
            }
            return r;
          });
          return { 
            ...c, 
            totalDue: Math.max(0, (c.totalDue || 0) - amountToPay),
            bakiRecords: records
          };
        }
        return c;
      });
      setLocalCustomers(updatedCustomers);
      localStorage.setItem(LOCAL_KEYS.CUSTOMERS, JSON.stringify(updatedCustomers));
    }
  }, [user?.uid, db, customers, localCustomers, addSale]);

  const deleteBakiRecord = useCallback((customerId: string, recordId: string, remainingAmount: number) => {
    if (user?.uid && db) {
      deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId, 'bakiRecords', recordId));
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        updateDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId), {
          totalDue: Math.max(0, (customer.totalDue || 0) - remainingAmount)
        });
      }
    } else {
      const updatedCustomers = localCustomers.map(c => {
        if (c.id === customerId) {
          const records = (c.bakiRecords || []).filter((r: any) => r.id !== recordId);
          return { 
            ...c, 
            totalDue: Math.max(0, (c.totalDue || 0) - remainingAmount),
            bakiRecords: records
          };
        }
        return c;
      });
      setLocalCustomers(updatedCustomers);
      localStorage.setItem(LOCAL_KEYS.CUSTOMERS, JSON.stringify(updatedCustomers));
    }
  }, [user?.uid, db, customers, localCustomers]);

  const setCurrency = useCallback((val: string) => {
    setCurrencyState(val);
    localStorage.setItem(LOCAL_KEYS.CURRENCY, val);
  }, []);

  const setLanguage = useCallback((lang: 'en' | 'bn') => {
    setLanguageState(lang);
    localStorage.setItem(LOCAL_KEYS.LANGUAGE, lang);
  }, []);

  const deleteSale = useCallback((saleId: string) => {
    const saleToDelete = sales.find(s => s.id === saleId);
    if (!saleToDelete) return;

    if (user?.uid && db) {
      deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'sales', saleId));
      if (!saleToDelete.isBakiPayment && saleToDelete.items) {
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
        const updated = prev.filter(s => s.id !== saleId);
        localStorage.setItem(LOCAL_KEYS.SALES, JSON.stringify(updated));
        return updated;
      });
      if (!saleToDelete.isBakiPayment) {
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
    }
  }, [user?.uid, db, sales, products]);

  const resetAllData = useCallback(async () => {
    localStorage.removeItem(LOCAL_KEYS.PRODUCTS);
    localStorage.removeItem(LOCAL_KEYS.SALES);
    localStorage.removeItem(LOCAL_KEYS.CUSTOMERS);
    setLocalProducts([]);
    setLocalSales([]);
    setLocalCustomers([]);

    if (user?.uid && db) {
      const collections = ['products', 'sales', 'customers'];
      for (const collName of collections) {
        const collRef = collection(db, 'users', user.uid, collName);
        const snapshot = await getDocs(collRef);
        const batch = writeBatch(db);
        snapshot.docs.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
    }
    
    window.location.reload();
  }, [user?.uid, db]);

  const value = {
    products,
    sales,
    customers,
    isLoading,
    currency,
    language,
    actions: {
      addProduct,
      updateProduct,
      deleteProduct,
      addSale,
      deleteSale,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addBakiRecord,
      payBakiRecord,
      deleteBakiRecord,
      setCurrency,
      setLanguage,
      resetAllData
    }
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessData() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusinessData must be used within a BusinessProvider');
  }
  return context;
}
