// src/hooks/useOptimizedFirestore.js

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  onSnapshot,
  getDocs,
  getDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Hook Firestore optimisé avec :
 * - Pagination
 * - Cache intelligent
 * - Debouncing
 * - Virtual scrolling support
 * - Prefetching
 */
export const useOptimizedFirestore = (collectionName, options = {}) => {
  const {
    filters = [],
    orderByFields = [],
    pageSize = 20,
    realtime = true,
    transform = (item) => item,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 60 * 1000, // 1 minute
    enabled = true,
    prefetchNext = true,
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  
  // Cache
  const cacheRef = useRef(new Map());
  const lastDocRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Fonction pour générer une clé de cache
  const getCacheKey = useCallback(() => {
    return `${collectionName}_${JSON.stringify(filters)}_${JSON.stringify(orderByFields)}_${page}`;
  }, [collectionName, filters, orderByFields, page]);

  // Vérifier le cache
  const checkCache = useCallback(() => {
    const cacheKey = getCacheKey();
    const cached = cacheRef.current.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.data;
    }
    
    return null;
  }, [getCacheKey, cacheTime]);

  // Sauvegarder dans le cache
  const saveToCache = useCallback((cacheData) => {
    const cacheKey = getCacheKey();
    cacheRef.current.set(cacheKey, {
      data: cacheData,
      timestamp: Date.now()
    });
    
    // Nettoyer les anciennes entrées du cache
    if (cacheRef.current.size > 50) {
      const oldestKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(oldestKey);
    }
  }, [getCacheKey]);

  // Construire la requête Firestore
  const buildQuery = useCallback((startAfterDoc = null) => {
    try {
      let q = collection(db, collectionName);
      
      // Appliquer les filtres
      filters.forEach(([field, operator, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          q = query(q, where(field, operator, value));
        }
      });
      
      // Appliquer le tri
      orderByFields.forEach(([field, direction = 'asc']) => {
        q = query(q, orderBy(field, direction));
      });
      
      // Pagination
      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }
      
      q = query(q, limit(pageSize));
      
      return q;
    } catch (err) {
      console.error('Erreur construction requête:', err);
      throw err;
    }
  }, [collectionName, filters, orderByFields, pageSize]);

  // Charger les données
  const loadData = useCallback(async (isNextPage = false) => {
    if (!enabled) return;
    
    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    // Vérifier le cache
    const cached = checkCache();
    if (cached && !isNextPage) {
      setData(cached);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const q = buildQuery(isNextPage ? lastDocRef.current : null);
      
      if (realtime) {
        // Mode temps réel
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
        
        unsubscribeRef.current = onSnapshot(
          q,
          (snapshot) => {
            const items = snapshot.docs.map(docSnap => {
              const data = transform({ id: docSnap.id, ...docSnap.data() });
              
              // Convertir les Timestamps
              Object.keys(data).forEach(key => {
                if (data[key] instanceof Timestamp) {
                  data[key] = data[key].toDate();
                }
              });
              
              return data;
            });
            
            // Mettre à jour lastDoc pour la pagination
            if (snapshot.docs.length > 0) {
              lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
            }
            
            setHasMore(snapshot.docs.length === pageSize);
            
            if (isNextPage) {
              setData(prev => [...prev, ...items]);
            } else {
              setData(items);
              saveToCache(items);
            }
            
            setLoading(false);
          },
          (err) => {
            console.error('Erreur temps réel:', err);
            setError(err.message);
            setLoading(false);
          }
        );
      } else {
        // Chargement unique
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(docSnap => {
          const data = transform({ id: docSnap.id, ...docSnap.data() });
          
          Object.keys(data).forEach(key => {
            if (data[key] instanceof Timestamp) {
              data[key] = data[key].toDate();
            }
          });
          
          return data;
        });
        
        if (snapshot.docs.length > 0) {
          lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
        }
        
        setHasMore(snapshot.docs.length === pageSize);
        
        if (isNextPage) {
          setData(prev => [...prev, ...items]);
        } else {
          setData(items);
          saveToCache(items);
        }
        
        setLoading(false);
        
        // Prefetch la page suivante si activé
        if (prefetchNext && snapshot.docs.length === pageSize) {
          setTimeout(() => prefetchNextPage(), 1000);
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Erreur chargement données:', err);
        setError(err.message);
        setLoading(false);
      }
    }
  }, [enabled, checkCache, buildQuery, realtime, pageSize, transform, saveToCache, prefetchNext]);

  // Prefetch de la page suivante
  const prefetchNextPage = useCallback(async () => {
    if (!lastDocRef.current || !hasMore) return;
    
    try {
      const q = buildQuery(lastDocRef.current);
      const snapshot = await getDocs(q);
      
      // Stocker dans le cache
      const items = snapshot.docs.map(docSnap => 
        transform({ id: docSnap.id, ...docSnap.data() })
      );
      
      const nextPageKey = `${collectionName}_${JSON.stringify(filters)}_${JSON.stringify(orderByFields)}_${page + 1}`;
      cacheRef.current.set(nextPageKey, {
        data: items,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('Erreur prefetch:', err);
    }
  }, [buildQuery, collectionName, filters, orderByFields, page, transform, hasMore]);

  // Charger la page suivante
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  // Rafraîchir les données
  const refresh = useCallback(() => {
    lastDocRef.current = null;
    setPage(0);
    setData([]);
    cacheRef.current.clear();
    loadData(false);
  }, [loadData]);

  // Effet pour charger les données
  useEffect(() => {
    if (page === 0) {
      loadData(false);
    } else {
      loadData(true);
    }
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [page, enabled]);

  // Nettoyer à la destruction
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    page,
    totalLoaded: data.length,
  };
};

/**
 * Hook pour un document unique avec cache
 */
export const useOptimizedDocument = (collectionName, documentId, options = {}) => {
  const {
    realtime = true,
    transform = (item) => item,
    cacheTime = 5 * 60 * 1000,
    enabled = true,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const cacheRef = useRef(new Map());
  const unsubscribeRef = useRef(null);

  const cacheKey = `${collectionName}_${documentId}`;

  useEffect(() => {
    if (!enabled || !documentId) {
      setLoading(false);
      return;
    }

    // Vérifier le cache
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    const docRef = doc(db, collectionName, documentId);

    if (realtime) {
      unsubscribeRef.current = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const transformedData = transform({ 
              id: docSnap.id, 
              ...docSnap.data() 
            });
            
            // Convertir les Timestamps
            Object.keys(transformedData).forEach(key => {
              if (transformedData[key] instanceof Timestamp) {
                transformedData[key] = transformedData[key].toDate();
              }
            });
            
            setData(transformedData);
            
            // Sauvegarder dans le cache
            cacheRef.current.set(cacheKey, {
              data: transformedData,
              timestamp: Date.now()
            });
          } else {
            setData(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error('Erreur document:', err);
          setError(err.message);
          setLoading(false);
        }
      );
    } else {
      getDoc(docRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const transformedData = transform({ 
              id: docSnap.id, 
              ...docSnap.data() 
            });
            
            Object.keys(transformedData).forEach(key => {
              if (transformedData[key] instanceof Timestamp) {
                transformedData[key] = transformedData[key].toDate();
              }
            });
            
            setData(transformedData);
            
            cacheRef.current.set(cacheKey, {
              data: transformedData,
              timestamp: Date.now()
            });
          } else {
            setData(null);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('Erreur document:', err);
          setError(err.message);
          setLoading(false);
        });
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [collectionName, documentId, realtime, transform, cacheTime, enabled, cacheKey]);

  return { data, loading, error };
};

/**
 * Hook pour le debouncing
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook pour l'intersection observer (infinite scroll)
 */
export const useIntersectionObserver = (callback, options = {}) => {
  const { threshold = 0.1, root = null, rootMargin = '0px' } = options;
  const targetRef = useRef(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      { threshold, root, rootMargin }
    );

    observer.observe(target);

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [callback, threshold, root, rootMargin]);

  return targetRef;
};

export default useOptimizedFirestore;