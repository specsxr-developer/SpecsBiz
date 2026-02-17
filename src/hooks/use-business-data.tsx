
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  collection, 
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  getDocs,
  writeBatch,
  increment
} from 'firebase/firestore';
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { 
  setDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from '@/firebase/non-blocking-updates';

const LOCAL_KEYS = {
  PRODUCTS: 'specsbiz_local_products',
  SHOP_PRODUCTS: 'specsbiz_local_shop_products',
  SALES: 'specsbiz_local_sales',
  CUSTOMERS: 'specsbiz_local_customers',
  PROCUREMENTS: 'specsbiz_local_procurements',
  SHOP_CONFIG: 'specsbiz_local_shop_config',
  CURRENCY: 'specsbiz_settings_currency',
  LANGUAGE: 'specsbiz_settings_language',
  AI_API_KEY: 'specsbiz_settings_ai_api_key',
  AI_MODEL: 'specsbiz_settings_ai_model',
};

interface BusinessContextType {
  products: any[];
  shopProducts: any[];
  sales: any[];
  customers: any[];
  procurements: any[];
  shopConfig: any | null;
  isLoading: boolean;
  currency: string;
  language: 'en' | 'bn';
  aiApiKey: string;
  aiModel: string;
  actions: {
    addProduct: (product: any) => void;
    updateProduct: (productId: string, data: any) => void;
    deleteProduct: (productId: string) => void;
    addShopProduct: (product: any) => void;
    updateShopProduct: (productId: string, data: any) => void;
    deleteShopProduct: (productId: string) => void;
    addSale: (sale: any) => void;
    deleteSale: (saleId: string) => void;
    addCustomer: (customer: any) => void;
    updateCustomer: (customerId: string, data: any) => void;
    deleteCustomer: (customerId: string) => void;
    addBakiRecord: (customerId: string, record: any) => void;
    updateBakiRecord: (customerId: string, recordId: string, updates: any, oldAmount: number, productId?: string, oldQty?: number) => void;
    payBakiRecord: (customerId: string, recordId: string, amountToPay: number, currentRecord: any) => void;
    deleteBakiRecord: (customerId: string, recordId: string, remainingAmount: number, productId?: string, qty?: number) => void;
    addRestock: (productId: string, qty: number, buyPrice: number, sellPrice: number, note?: string) => void;
    deleteProcurement: (procId: string) => void;
    syncInventoryToProcurement: () => Promise<void>;
    updateShopConfig: (data: any) => void;
    setCurrency: (val: string) => void;
    setLanguage: (lang: 'en' | 'bn') => void;
    setAiConfig: (key: string, model: string) => void;
    resetAllData: () => Promise<void>;
  };
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const [localProducts, setLocalProducts] = useState<any[]>([]);
  const [localShopProducts, setLocalShopProducts] = useState<any[]>([]);
  const [localSales, setLocalSales] = useState<any[]>([]);
  const [localCustomers, setLocalCustomers] = useState<any[]>([]);
  const [localProcurements, setLocalProcurements] = useState<any[]>([]);
  const [localShopConfig, setLocalShopConfig] = useState<any>(null);
  const [currency, setCurrencyState] = useState('৳');
  const [language, setLanguageState] = useState<'en' | 'bn'>('bn');
  const [aiApiKey, setAiApiKeyState] = useState('');
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const p = localStorage.getItem(LOCAL_KEYS.PRODUCTS);
        const sp = localStorage.getItem(LOCAL_KEYS.SHOP_PRODUCTS);
        const s = localStorage.getItem(LOCAL_KEYS.SALES);
        const c = localStorage.getItem(LOCAL_KEYS.CUSTOMERS);
        const pr = localStorage.getItem(LOCAL_KEYS.PROCUREMENTS);
        const sc = localStorage.getItem(LOCAL_KEYS.SHOP_CONFIG);
        const curr = localStorage.getItem(LOCAL_KEYS.CURRENCY);
        const lang = localStorage.getItem(LOCAL_KEYS.LANGUAGE) as 'en' | 'bn';
        const akey = localStorage.getItem(LOCAL_KEYS.AI_API_KEY);
        const amodel = localStorage.getItem(LOCAL_KEYS.AI_MODEL);
        
        if (p) setLocalProducts(JSON.parse(p));
        if (sp) setLocalShopProducts(JSON.parse(sp));
        if (s) setLocalSales(JSON.parse(s));
        if (c) setLocalCustomers(JSON.parse(c));
        if (pr) setLocalProcurements(JSON.parse(pr));
        if (sc) setLocalShopConfig(JSON.parse(sc));
        if (curr) setCurrencyState(curr);
        if (lang) setLanguageState(lang);
        if (akey) setAiApiKeyState(akey);
        if (amodel) setAiModel(amodel);
      } catch (e) {
        console.error("Error loading local data", e);
      }
    }
  }, []);

  const productsQuery = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return query(collection(db, 'users', user.uid, 'products'), orderBy('name'));
  }, [user?.uid, db]);

  const shopProductsQuery = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return query(collection(db, 'users', user.uid, 'shopProducts'), orderBy('name'));
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

  const shopConfigRef = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return doc(db, 'users', user.uid, 'shopConfig', 'default');
  }, [user?.uid, db]);

  const { data: fbProducts, isLoading: pLoading } = useCollection(productsQuery);
  const { data: fbShopProducts, isLoading: spLoading } = useCollection(shopProductsQuery);
  const { data: fbSales, isLoading: sLoading } = useCollection(salesQuery);
  const { data: fbCustomers, isLoading: cLoading } = useCollection(customersQuery);
  const { data: fbProc, isLoading: prLoading } = useCollection(procQuery);
  const { data: fbShopConfig } = useDoc(shopConfigRef);

  const products = user ? (fbProducts || []) : localProducts;
  const shopProducts = user ? (fbShopProducts || []) : localShopProducts;
  const sales = user ? (fbSales || []) : localSales;
  const customers = user ? (fbCustomers || []) : localCustomers;
  const procurements = user ? (fbProc || []) : localProcurements;
  const shopConfig = user ? fbShopConfig : localShopConfig;
  const isLoading = isUserLoading || (user && (pLoading || spLoading || sLoading || cLoading || prLoading));

  // --- ACTIONS ---

  const addProduct = useCallback((product: any) => {
    const id = product.id || Date.now().toString();
    const data = { ...product, id };
    if (user?.uid && db) {
      setDocumentNonBlocking(doc(db, 'users', user.uid, 'products', id), data, { merge: true });
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

  // SPECIAL WEBSITE PRODUCT SYSTEM (Fully Independent)
  const addShopProduct = useCallback((product: any) => {
    const id = product.id || `web-${Date.now()}`;
    const data = { ...product, id };
    if (user?.uid && db) {
      setDocumentNonBlocking(doc(db, 'users', user.uid, 'shopProducts', id), data, { merge: true });
    } else {
      setLocalShopProducts(prev => {
        const updated = [data, ...prev];
        localStorage.setItem(LOCAL_KEYS.SHOP_PRODUCTS, JSON.stringify(updated));
        return updated;
      });
    }
  }, [user?.uid, db]);

  const updateShopProduct = useCallback((productId: string, data: any) => {
    if (user?.uid && db) {
      setDocumentNonBlocking(doc(db, 'users', user.uid, 'shopProducts', productId), data, { merge: true });
    } else {
      setLocalShopProducts(prev => {
        const updated = prev.map(p => p.id === productId ? { ...p, ...data } : p);
        localStorage.setItem(LOCAL_KEYS.SHOP_PRODUCTS, JSON.stringify(updated));
        return updated;
      });
    }
  }, [user?.uid, db]);

  const deleteShopProduct = useCallback((productId: string) => {
    if (user?.uid && db) {
      deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'shopProducts', productId));
    } else {
      setLocalShopProducts(prev => {
        const updated = prev.filter(p => p.id !== productId);
        localStorage.setItem(LOCAL_KEYS.SHOP_PRODUCTS, JSON.stringify(updated));
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
          updateDocumentNonBlocking(productRef, {
            stock: increment(-item.quantity)
          });
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
  }, [user?.uid, db]);

  const deleteSale = useCallback((saleId: string) => {
    const saleToDelete = sales.find(s => s.id === saleId);
    if (!saleToDelete) return;

    if (user?.uid && db) {
      deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'sales', saleId));
      if (!saleToDelete.isBakiPayment && saleToDelete.items) {
        saleToDelete.items.forEach((item: any) => {
          const productRef = doc(db, 'users', user.uid, 'products', item.id);
          updateDocumentNonBlocking(productRef, {
            stock: increment(item.quantity)
          });
        });
      }
    } else {
      setLocalSales(prev => {
        const updated = prev.filter(s => s.id !== saleId);
        localStorage.setItem(LOCAL_KEYS.SALES, JSON.stringify(updated));
        return updated;
      });
    }
  }, [user?.uid, db, sales]);

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
    const recordId = Date.now().toString();
    const data = { ...record, id: recordId, takenDate: new Date().toISOString(), paidAmount: 0, status: 'pending' };
    
    if (user?.uid && db) {
      setDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId, 'bakiRecords', recordId), data, { merge: true });
      updateDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId), {
        totalDue: increment(data.amount)
      });
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
  }, [user?.uid, db, localCustomers]);

  const updateBakiRecord = useCallback((customerId: string, recordId: string, updates: any, oldAmount: number, productId?: string, oldQty?: number) => {
    if (user?.uid && db) {
      updateDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId, 'bakiRecords', recordId), updates);
      if (updates.amount !== undefined && updates.amount !== oldAmount) {
        updateDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId), {
          totalDue: increment(updates.amount - oldAmount)
        });
      }
    } else {
      const updatedCustomers = localCustomers.map(c => {
        if (c.id === customerId) {
          const records = (c.bakiRecords || []).map((r: any) => r.id === recordId ? { ...r, ...updates } : r);
          return { ...c, totalDue: Math.max(0, (c.totalDue || 0) - oldAmount + (updates.amount || oldAmount)), bakiRecords: records };
        }
        return c;
      });
      setLocalCustomers(updatedCustomers);
      localStorage.setItem(LOCAL_KEYS.CUSTOMERS, JSON.stringify(updatedCustomers));
    }
  }, [user?.uid, db, localCustomers]);

  const payBakiRecord = useCallback((customerId: string, recordId: string, amountToPay: number, currentRecord: any) => {
    const newPaidAmount = (currentRecord.paidAmount || 0) + amountToPay;
    const isFullyPaid = newPaidAmount >= currentRecord.amount;
    
    const saleData = {
      total: amountToPay,
      profit: 0, 
      items: [{ name: `Baki Payment: ${currentRecord.productName}`, quantity: 1, sellingPrice: amountToPay }],
      isBakiPayment: true,
      bakiProductName: currentRecord.productName,
      customerId: customerId,
      saleDate: new Date().toISOString()
    };
    addSale(saleData);

    if (user?.uid && db) {
      updateDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId, 'bakiRecords', recordId), {
        paidAmount: newPaidAmount,
        status: isFullyPaid ? 'paid' : 'pending'
      });
      updateDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId), {
        totalDue: increment(-amountToPay)
      });
    } else {
      const updatedCustomers = localCustomers.map(c => {
        if (c.id === customerId) {
          const records = (c.bakiRecords || []).map((r: any) => r.id === recordId ? { ...r, paidAmount: newPaidAmount, status: isFullyPaid ? 'paid' : 'pending' } : r);
          return { ...c, totalDue: Math.max(0, (c.totalDue || 0) - amountToPay), bakiRecords: records };
        }
        return c;
      });
      setLocalCustomers(updatedCustomers);
      localStorage.setItem(LOCAL_KEYS.CUSTOMERS, JSON.stringify(updatedCustomers));
    }
  }, [user?.uid, db, localCustomers, addSale]);

  const deleteBakiRecord = useCallback((customerId: string, recordId: string, remainingAmount: number) => {
    if (user?.uid && db) {
      deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId, 'bakiRecords', recordId));
      updateDocumentNonBlocking(doc(db, 'users', user.uid, 'customers', customerId), {
        totalDue: increment(-remainingAmount)
      });
    } else {
      const updatedCustomers = localCustomers.map(c => {
        if (c.id === customerId) {
          const records = (c.bakiRecords || []).filter((r: any) => r.id !== recordId);
          return { ...c, totalDue: Math.max(0, (c.totalDue || 0) - remainingAmount), bakiRecords: records };
        }
        return c;
      });
      setLocalCustomers(updatedCustomers);
      localStorage.setItem(LOCAL_KEYS.CUSTOMERS, JSON.stringify(updatedCustomers));
    }
  }, [user?.uid, db, localCustomers]);

  const addRestock = useCallback((productId: string, qty: number, buyPrice: number, sellPrice: number, note?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const procId = Date.now().toString();
    const procData = {
      id: procId,
      productId,
      productName: product.name,
      quantity: qty,
      buyPrice: buyPrice,
      totalCost: qty * buyPrice,
      date: new Date().toISOString(),
      type: 'restock',
      note: note || ''
    };
    if (user?.uid && db) {
      setDocumentNonBlocking(doc(db, 'users', user.uid, 'procurements', procId), procData, { merge: true });
      updateDocumentNonBlocking(doc(db, 'users', user.uid, 'products', productId), {
        stock: increment(qty),
        purchasePrice: buyPrice,
        sellingPrice: sellPrice
      });
    } else {
      setLocalProcurements(prev => {
        const updated = [procData, ...prev];
        localStorage.setItem(LOCAL_KEYS.PROCUREMENTS, JSON.stringify(updated));
        return updated;
      });
      setLocalProducts(prev => {
        const updated = prev.map(p => p.id === productId ? { ...p, stock: (p.stock || 0) + qty, purchasePrice: buyPrice, sellingPrice: sellPrice } : p);
        localStorage.setItem(LOCAL_KEYS.PRODUCTS, JSON.stringify(updated));
        return updated;
      });
    }
  }, [user?.uid, db, products]);

  const deleteProcurement = useCallback((procId: string) => {
    const proc = procurements.find(p => p.id === procId);
    if (!proc) return;
    if (user?.uid && db) {
      deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'procurements', procId));
      if (proc.productId) {
        updateDocumentNonBlocking(doc(db, 'users', user.uid, 'products', proc.productId), {
          stock: increment(-proc.quantity)
        });
      }
    } else {
      setLocalProcurements(prev => {
        const updated = prev.filter(p => p.id !== procId);
        localStorage.setItem(LOCAL_KEYS.PROCUREMENTS, JSON.stringify(updated));
        return updated;
      });
    }
  }, [user?.uid, db, procurements]);

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

  const updateShopConfig = useCallback((data: any) => {
    if (user?.uid && db) {
      setDocumentNonBlocking(doc(db, 'users', user.uid, 'shopConfig', 'default'), data, { merge: true });
    } else {
      setLocalShopConfig(data);
      localStorage.setItem(LOCAL_KEYS.SHOP_CONFIG, JSON.stringify(data));
    }
  }, [user?.uid, db]);

  const setCurrency = useCallback((val: string) => {
    setCurrencyState(val);
    localStorage.setItem(LOCAL_KEYS.CURRENCY, val);
  }, []);

  const setLanguage = useCallback((lang: 'en' | 'bn') => {
    setLanguageState(lang);
    localStorage.setItem(LOCAL_KEYS.LANGUAGE, lang);
  }, []);

  const setAiConfig = useCallback((key: string, model: string) => {
    setAiApiKeyState(key);
    setAiModel(model);
    localStorage.setItem(LOCAL_KEYS.AI_API_KEY, key);
    localStorage.setItem(LOCAL_KEYS.AI_MODEL, model);
  }, []);

  const resetAllData = useCallback(async () => {
    localStorage.clear();
    if (user?.uid && db) {
      const collections = ['products', 'shopProducts', 'sales', 'customers', 'procurements', 'shopConfig'];
      for (const collName of collections) {
        const collRef = collection(db, 'users', user.uid, collName);
        const snapshot = await getDocs(collRef);
        const batch = writeBatch(db);
        snapshot.docs.forEach(docSnap => { batch.delete(docSnap.ref); });
        await batch.commit();
      }
    }
    window.location.reload();
  }, [user?.uid, db]);

  const value = {
    products,
    shopProducts,
    sales,
    customers,
    procurements,
    shopConfig,
    isLoading,
    currency,
    language,
    aiApiKey,
    aiModel,
    actions: {
      addProduct,
      updateProduct,
      deleteProduct,
      addShopProduct,
      updateShopProduct,
      deleteShopProduct,
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
      deleteProcurement,
      syncInventoryToProcurement,
      updateShopConfig,
      setCurrency,
      setLanguage,
      setAiConfig,
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
