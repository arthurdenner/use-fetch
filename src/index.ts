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

type Action<T> =
  | { type: 'FETCH_ABORTED' }
  | { type: 'FETCH_ERROR'; payload: Error }
  | { type: 'FETCH_INIT'; payload: AbortController }
  | { type: 'FETCH_SUCCESS'; payload: T };

const reducer = <T>(
  state: useFetchState<T>,
  action: Action<T>
): useFetchState<T> => {
  switch (action.type) {
    case 'FETCH_ABORTED': {
      return {
        ...state,
        error: undefined,
        loading: false,
        canceled: true,
      };
    }
    case 'FETCH_ERROR': {
      return {
        ...state,
        error: action.payload,
        loading: false,
        canceled: false,
      };
    }
    case 'FETCH_INIT': {
      return {
        ...state,
        controller: action.payload,
        error: undefined,
        loading: true,
        canceled: false,
      };
    }
    case 'FETCH_SUCCESS': {
      return {
        ...state,
        data: action.payload,
        loading: false,
        canceled: false,
      };
    }
    default: {
      return state;
    }
  }
};

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
  const [state, dispatch] = useReducer<
    React.Reducer<useFetchState<T>, Action<T>>
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
              dispatch({
                type: 'FETCH_SUCCESS',
                payload: JSON.parse(cached),
              });

              return;
            } else {
              localStorage.removeItem(localStorageKey);
              localStorage.removeItem(`${localStorageKey}:ts`);
            }
          }
        }

        dispatch({ type: 'FETCH_INIT', payload: controller });

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

        dispatch({
          type: 'FETCH_SUCCESS',
          payload: response,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          dispatch({ type: 'FETCH_ERROR', payload: err });
        } else {
          dispatch({ type: 'FETCH_ABORTED' });
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
