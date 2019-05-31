import { useCallback, useEffect, useReducer, useRef } from 'react';
import stringHash from '@sindresorhus/string-hash';

type useFetchParams<T> = {
  cacheKey?: string;
  expiryTime?: number;
  initialData: T;
  isJsonP?: boolean;
  options?: RequestInit;
  url: string;
};

type useFetchState<T> = {
  data: T;
  error?: Error;
  loading: boolean;
  canceled: boolean;
};

const reducer = <T>(
  currentState: useFetchState<T>,
  newState: Partial<useFetchState<T>>
): useFetchState<T> => ({ ...currentState, ...newState });

function useFetch<T>({
  cacheKey,
  expiryTime,
  initialData,
  isJsonP,
  options,
  url,
}: useFetchParams<T>) {
  const controllerRef = useRef(new AbortController());
  const mountedRef = useRef(false);
  const [state, setState] = useReducer<
    React.Reducer<useFetchState<T>, Partial<useFetchState<T>>>
  >(reducer, {
    data: initialData,
    error: undefined,
    loading: true,
    canceled: false,
  });
  const safeSetState = (newState: Partial<useFetchState<T>>) => {
    if (mountedRef.current) {
      setState(newState);
    }
  };

  const memoizedFetch = useCallback(() => {
    async function fetchCallback() {
      const controller = new AbortController();
      const signal = controller.signal;
      let localStorageKey = '';

      controllerRef.current = controller;

      try {
        if (expiryTime) {
          localStorageKey = cacheKey || `useFetch:${stringHash(url)}`;
          const cached = localStorage.getItem(localStorageKey);
          const whenCached = localStorage.getItem(`${localStorageKey}:ts`);

          if (cached !== null && whenCached !== null) {
            const age = (Date.now() - Number(whenCached)) / 1000;

            if (age < expiryTime) {
              safeSetState({
                data: JSON.parse(cached),
                loading: false,
                canceled: false,
              });

              return;
            } else {
              localStorage.removeItem(localStorageKey);
              localStorage.removeItem(`${localStorageKey}:ts`);
            }
          }
        }

        safeSetState({
          error: undefined,
          loading: true,
          canceled: false,
        });

        const fetchResponse = await fetch(url, { ...options, signal });

        let response: T;

        if (isJsonP) {
          response = await fetchResponse
            .text()
            .then(responseText =>
              JSON.parse(responseText.replace(/\/\*\*\/\w+\(|\);/g, ''))
            );
        } else {
          response = await fetchResponse.json();
        }

        if (expiryTime) {
          localStorage.setItem(localStorageKey, JSON.stringify(response));
          localStorage.setItem(`${localStorageKey}:ts`, Date.now().toString());
        }

        safeSetState({
          data: response,
          loading: false,
          canceled: false,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          safeSetState({
            error: err,
            loading: false,
            canceled: false,
          });
        } else {
          safeSetState({
            error: undefined,
            loading: false,
            canceled: true,
          });
        }
      }
    }

    return fetchCallback();
  }, [cacheKey, expiryTime, isJsonP, options, url]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    memoizedFetch();

    return () => controllerRef.current.abort();
  }, [memoizedFetch]);

  return {
    ...state,
    abort: () => controllerRef.current.abort(),
    start: () => {
      controllerRef.current.abort();
      memoizedFetch();
    },
  };
}

export default useFetch;
