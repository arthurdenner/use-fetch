import { useCallback, useEffect, useMemo, useReducer } from 'react';
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
  controller: AbortController;
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
  const initialReducerState = useMemo<useFetchState<T>>(
    () => ({
      controller: new AbortController(),
      data: initialData,
      error: undefined,
      loading: true,
      canceled: false,
    }),
    [initialData]
  );
  const [state, setState] = useReducer<
    React.Reducer<useFetchState<T>, Partial<useFetchState<T>>>
  >(reducer, initialReducerState);

  const memoizedFetch = useCallback(() => {
    async function fetchCallback() {
      const controller = new AbortController();
      const signal = controller.signal;
      let localStorageKey = '';

      try {
        if (expiryTime) {
          localStorageKey = cacheKey || `useFetch:${stringHash(url)}`;
          const cached = localStorage.getItem(localStorageKey);
          const whenCached = localStorage.getItem(`${localStorageKey}:ts`);

          if (cached !== null && whenCached !== null) {
            const age = (Date.now() - Number(whenCached)) / 1000;

            if (age < expiryTime) {
              setState({
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

        setState({
          controller,
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

        setState({
          data: response,
          loading: false,
          canceled: false,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          setState({
            error: err,
            loading: false,
            canceled: false,
          });
        } else {
          setState({
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
    memoizedFetch();
  }, [memoizedFetch]);

  return {
    ...state,
    abort: () => {
      state.controller.abort();
    },
    start: () => {
      state.controller.abort();

      // Wait for the next tick to fire the request again
      setTimeout(memoizedFetch, 0);
    },
  };
}

export default useFetch;
