
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
  setDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from '@/firebase/non-blocking-updates';

const LOCAL_KEYS = {
  PRODUCTS: 'specsbiz_local_products',
  SALES: 'specsbiz_local_sales',
  CUSTOMERS: 'specsbiz_local_customers',
  PROCUREMENTS: 'specsbiz_local_procurements',
  CURRENCY: 'specsbiz_settings_currency',
  LANGUAGE: 'specsbiz_settings_language',
};

interface BusinessContextType {
  products: any[];
  sales: any[];
  customers: any[];
  procurements: any[];
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
    updateBakiRecord: (customerId: string, recordId: string, updates: any, oldAmount: number, productId?: string, oldQty?: number) => void;
    payBakiRecord: (customerId: string, recordId: string, amountToPay: number, currentRecord: any) => void;
    deleteBakiRecord: (customerId: string, recordId: string, remainingAmount: number, productId?: string, qty?: number) => void;
    addRestock: (productId: string, qty: number, buyPrice: number) => void;
    syncInventoryToProcurement: () => Promise<void>;
    setCurrency: (val: string) => void;
    setLanguage: (lang: 'en' | 'bn') => void;
    resetAllData: () => Promise<void>;
  };
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const [localProducts, setLocalProducts] = useState<any[]>([]);
  const [localSales, setLocalSales] = useState<any[]>([]);
  const [localCustomers, setLocalCustomers] = useState<any[]>([]);
  const [localProcurements, setLocalProcurements] = useState<any[]>([]);
  const [currency, setCurrencyState] = useState('৳');
  const [language, setLanguageState] = useState<'en' | 'bn'>('bn');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const p = localStorage.getItem(LOCAL_KEYS.PRODUCTS);
        const s = localStorage.getItem(LOCAL_KEYS.SALES);
        const c = localStorage.getItem(LOCAL_KEYS.CUSTOMERS);
        const pr = localStorage.getItem(LOCAL_KEYS.PROCUREMENTS);
        const curr = localStorage.getItem(LOCAL_KEYS.CURRENCY);
        const lang = localStorage.getItem(LOCAL_KEYS.LANGUAGE) as 'en' | 'bn';
        
        if (p) setLocalProducts(JSON.parse(p));
        if (s) setLocalSales(JSON.parse(s));
        if (c) setLocalCustomers(JSON.parse(c));
        if (pr) setLocalProcurements(JSON.parse(pr));
        if (curr) setCurrencyState(curr);
        if (lang) setLanguageState(lang);
      } catch (e) {
        console.error("Error loading local data", e);
      }
    }
  }, []);

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

  const procQuery = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return query(collection(db, 'users', user.uid, 'procurements'), orderBy('date', 'desc'));
  }, [user?.uid, db]);

  const { data: fbProducts, isLoading: pLoading } = useCollection(productsQuery);
  const { data: fbSales, isLoading: sLoading } = useCollection(salesQuery);
  const { data: fbCustomers, isLoading: cLoading } = useCollection(customersQuery);
  const { data: fbProc, isLoading: prLoading } = useCollection(procQuery);

  const products = user ? (fbProducts || []) : localProducts;
  const sales = user ? (fbSales || []) : localSales;
  const customers = user ? (fbCustomers || []) : localCustomers;
  const procurements = user ? (fbProc || []) : localProcurements;
  const isLoading = isUserLoading || (user && (pLoading || sLoading || cLoading || prLoading));

  const addProduct = useCallback((product: any) => {
    const id = product.id || Date.now().toString();
    const data = { ...product, id };
    
    const procId = 'init-' + id;
    const qty = parseFloat(product.stock) || 0;
    const bPrice = parseFloat(product.purchasePrice) || 0;
    const procData = {
      id: procId,
      productId: id,
      productName: product.name,
      quantity: qty,
      buyPrice: bPrice,
      totalCost: qty * bPrice,
      date: new Date().toISOString(),
      type: 'initial'
    };

    if (user?.uid && db) {
      setDocumentNonBlocking(doc(db, 'users', user.uid, 'products', id), data, { merge: true });
      if (qty > 0) {
        setDocumentNonBlocking(doc(db, 'users', user.uid, 'procurements', procId), procData, { merge: true });
      }
    } else {
      setLocalProducts(prev => {
        const updated = [data, ...prev];
        localStorage.setItem(LOCAL_KEYS.PRODUCTS, JSON.stringify(updated));
        return updated;
      });
      if (qty > 0) {
        setLocalProcurements(prev => {
          const updated = [procData, ...prev];
          localStorage.setItem(LOCAL_KEYS.PROCUREMENTS, JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, [user?.uid, db]);

  const addRestock = useCallback((productId: string, qty: number, buyPrice: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newStock = (product.stock || 0) + qty;
    const procId = Date.now().toString();
    const procData = {
      id: procId,
      productId,
      productName: product.name,
      quantity: qty,
      buyPrice: buyPrice,
      totalCost: qty * buyPrice,
      date: new Date().toISOString(),
      type: 'restock'
    };

    if (user?.uid && db) {
      setDocumentNonBlocking(doc(db, 'users', user.uid, 'procurements', procId), procData, { merge: true });
      updateDocumentNonBlocking(doc(db, 'users', user.uid, 'products', productId), {
        stock: newStock,
        purchasePrice: buyPrice
      });
    } else {
      setLocalProcurements(prev => {
        const updated = [procData, ...prev];
        localStorage.setItem(LOCAL_KEYS.PROCUREMENTS, JSON.stringify(updated));
        return updated;
      });
      setLocalProducts(prev => {
        const updated = prev.map(p => p.id === productId ? { ...p, stock: newStock, purchasePrice: buyPrice } : p);
        localStorage.setItem(LOCAL_KEYS.PRODUCTS, JSON.stringify(updated));
        return updated;
      });
    }
  }, [user?.uid, db, products]);

  const syncInventoryToProcurement = useCallback(async () => {
    const batchData: any[] = [];
    products.forEach(p => {
      const exists = procurements.find(pr => pr.productId === p.id);
      if (!exists && p.stock > 0) {
        batchData.push({
          id: 'sync-' + p.id,
          productId: p.id,
          productName: p.name,
          quantity: p.stock,
          buyPrice: p.purchasePrice || 0,
          totalCost: (p.stock * (p.purchasePrice || 0)),
          date: new Date().toISOString(),
          type: 'sync'
        });
      }
    });

    if (batchData.length === 0) return;

    if (user?.uid && db) {
      const batch = writeBatch(db);
      batchData.forEach(item => {
        const ref = doc(db, 'users', user.uid, 'procurements', item.id);
        batch.set(ref, item);
      });
      await batch.commit();
    } else {
      setLocalProcurements(prev => {
        const updated = [...batchData, ...prev];
        localStorage.setItem(LOCAL_KEYS.PROCUREMENTS, JSON.stringify(updated));
        return updated;
      });
    }
  }, [user?.uid, db, products, procurements]);

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
      setDocumentNonBlocking(doc(db, 'users', user.uid, 'sales', id), data, { merge: true });
      if (data.items && !data.isBakiPayment) {
        data.items.forEach((item: any) => {
          const productRef = doc(db, 'users', user.uid, 'products', item.id);
          const currentProduct = products.find(p => p.id === item.id);
          if (currentProduct) {
            updateDocumentNonBlocking(productRef, {
              stock: Math.max(0, (currentProduct.stock || 0) - item.quantity)
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
              return { ...p, stock: Math.max(0, (p.stock || 0) - saleItem.quantity) };
            }
            return p;
          });
          localStorage.setItem(LOCAL_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
          return updatedProducts;
        });
      }
    }
  }, [user?.uid, db, products]);

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
              stock: (currentProduct.stock || 0) + item.quantity
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
              return { ...p, stock: (p.stock || 0) + saleItem.quantity };
            }
            return p;
          });
          localStorage.setItem(LOCAL_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
          return updatedProducts;
        });
      }
    }
  }, [user?.uid, db, sales, products]);

  const addCustomer = useCallback((customer: any) => {
    const id = customer.id || Date.now().toString();
    const data = { ...customer, id };
    if (user?.uid && db) {
      setDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', id), data, { merge: true });
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
    const recordId = record.id || Date.now().toString();
    const data = { ...record, id: recordId, takenDate: new Date().toISOString(), paidAmount: 0, status: 'pending' };
    
    if (user?.uid && db) {
      setDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId, 'bakiRecords', recordId), data, { merge: true });
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        updateDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId), {
          totalDue: (customer.totalDue || 0) + data.amount
        });
      }
      if (record.productId) {
        const product = products.find(p => p.id === record.productId);
        if (product) {
          updateDocumentNonBlocking(doc(db, 'users', user.uid, 'products', record.productId), {
            stock: Math.max(0, (product.stock || 0) - (record.quantity || 1))
          });
        }
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
      if (record.productId) {
        setLocalProducts(prev => {
          const updated = prev.map(p => p.id === record.productId ? { ...p, stock: Math.max(0, (p.stock || 0) - (record.quantity || 1)) } : p);
          localStorage.setItem(LOCAL_KEYS.PRODUCTS, JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, [user?.uid, db, customers, localCustomers, products]);

  const updateBakiRecord = useCallback((customerId: string, recordId: string, updates: any, oldAmount: number, productId?: string, oldQty?: number) => {
    if (user?.uid && db) {
      updateDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId, 'bakiRecords', recordId), updates);
      
      if (updates.amount !== undefined && updates.amount !== oldAmount) {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
          const diff = updates.amount - oldAmount;
          updateDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId), {
            totalDue: Math.max(0, (customer.totalDue || 0) + diff)
          });
        }
      }

      if (productId && updates.quantity !== undefined && oldQty !== undefined) {
        const product = products.find(p => p.id === productId);
        if (product) {
          const qtyDiff = updates.quantity - oldQty;
          updateDocumentNonBlocking(doc(db, 'users', user.uid, 'products', productId), {
            stock: Math.max(0, (product.stock || 0) - qtyDiff)
          });
        }
      }
    } else {
      const updatedCustomers = localCustomers.map(c => {
        if (c.id === customerId) {
          const records = (c.bakiRecords || []).map((r: any) => r.id === recordId ? { ...r, ...updates } : r);
          let newTotal = c.totalDue || 0;
          if (updates.amount !== undefined) {
            newTotal = newTotal - oldAmount + updates.amount;
          }
          return { ...c, totalDue: Math.max(0, newTotal), bakiRecords: records };
        }
        return c;
      });
      setLocalCustomers(updatedCustomers);
      localStorage.setItem(LOCAL_KEYS.CUSTOMERS, JSON.stringify(updatedCustomers));

      if (productId && updates.quantity !== undefined && oldQty !== undefined) {
        setLocalProducts(prev => {
          const qtyDiff = updates.quantity - oldQty;
          const updated = prev.map(p => p.id === productId ? { ...p, stock: Math.max(0, (p.stock || 0) - qtyDiff) } : p);
          localStorage.setItem(LOCAL_KEYS.PRODUCTS, JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, [user?.uid, db, customers, localCustomers, products]);

  const payBakiRecord = useCallback((customerId: string, recordId: string, amountToPay: number, currentRecord: any) => {
    const newPaidAmount = (currentRecord.paidAmount || 0) + amountToPay;
    const isFullyPaid = newPaidAmount >= currentRecord.amount;
    const remaining = Math.max(0, currentRecord.amount - newPaidAmount);
    
    const saleData = {
      total: amountToPay,
      profit: 0, 
      items: [{ name: `Baki Payment: ${currentRecord.productName}`, quantity: 1, sellingPrice: amountToPay }],
      isBakiPayment: true,
      bakiRecordId: recordId,
      bakiProductName: currentRecord.productName,
      remainingAmount: remaining,
      customerId: customerId,
      saleDate: new Date().toISOString()
    };
    addSale(saleData);

    if (user?.uid && db) {
      updateDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId, 'bakiRecords', recordId), {
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

  const deleteBakiRecord = useCallback((customerId: string, recordId: string, remainingAmount: number, productId?: string, qty?: number) => {
    if (user?.uid && db) {
      deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId, 'bakiRecords', recordId));
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        updateDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId), {
          totalDue: Math.max(0, (customer.totalDue || 0) - remainingAmount)
        });
      }
      if (productId && qty) {
        const product = products.find(p => p.id === productId);
        if (product) {
          updateDocumentNonBlocking(doc(db, 'users', user.uid, 'products', productId), {
            stock: (product.stock || 0) + qty
          });
        }
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
      if (productId && qty) {
        setLocalProducts(prev => {
          const updated = prev.map(p => p.id === productId ? { ...p, stock: (p.stock || 0) + qty } : p);
          localStorage.setItem(LOCAL_KEYS.PRODUCTS, JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, [user?.uid, db, customers, localCustomers, products]);

  const setCurrency = useCallback((val: string) => {
    setCurrencyState(val);
    localStorage.setItem(LOCAL_KEYS.CURRENCY, val);
  }, []);

  const setLanguage = useCallback((lang: 'en' | 'bn') => {
    setLanguageState(lang);
    localStorage.setItem(LOCAL_KEYS.LANGUAGE, lang);
  }, []);

  const resetAllData = useCallback(async () => {
    localStorage.removeItem(LOCAL_KEYS.PRODUCTS);
    localStorage.removeItem(LOCAL_KEYS.SALES);
    localStorage.removeItem(LOCAL_KEYS.CUSTOMERS);
    localStorage.removeItem(LOCAL_KEYS.PROCUREMENTS);
    setLocalProducts([]);
    setLocalSales([]);
    setLocalCustomers([]);
    setLocalProcurements([]);

    if (user?.uid && db) {
      const collections = ['products', 'sales', 'customers', 'procurements'];
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
    procurements,
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
      updateBakiRecord,
      payBakiRecord,
      deleteBakiRecord,
      addRestock,
      syncInventoryToProcurement,
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
