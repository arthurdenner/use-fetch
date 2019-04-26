# use-fetch

[![npm](https://img.shields.io/npm/v/use-fetch.svg)](https://www.npmjs.org/package/use-fetch)
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg)](#contributors)
[![gzip size](https://img.badgesize.io/https://unpkg.com/use-fetch/dist/use-fetch.umd.js?compression=gzip)](https://unpkg.com/use-fetch/dist/use-fetch.umd.js)
[![install size](https://packagephobia.now.sh/badge?p=use-fetch)](https://packagephobia.now.sh/result?p=use-fetch)

React hook to fetch data with useful features.

## Install

```
yarn add use-fetch
```

```
npm i use-fetch
```

## Usage

```javascript
import React from 'react';
import useFetch from 'use-fetch';

function App() {
  const { data: users, error, loading } = useFetch({
    initialState: [],
    url: 'https://jsonplaceholder.typicode.com/users',
  });

  if (error) {
    console.log(error);
    return <div>An error occured!</div>;
  }

  if (loading) {
    return <div>It's loading...</div>;
  }

  return (
    <div>
      <ul>
        {users.map(user => (
          <li>{name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Features

- TypeScript-friendly
- JSONP support
- localStorage cache support
  - You don't pass a `cacheKey`, the hash of the URL will be used
- Abort request support

## Config

| name        | type        | required | description                             |
| ----------- | ----------- | -------- | --------------------------------------- |
| cacheKey    | string      | no       | localStorage key to store the response  |
| expiryTime  | number      | no       | amount of time to cache the response    |
| initialData | T           | yes      | initial data for the hook               |
| isJsonP     | boolean     | no       | indicates if the URL returns JSONP data |
| options     | RequestInit | no       | options accepted by the `fetch` API     |
| url         | string      | yes      | URL to be fetched                       |

## Return

| name       | type            | description                                     |
| ---------- | --------------- | ----------------------------------------------- |
| controller | AbortController | AbortController instance of the current request |
| data       | T               | data returned from the request                  |
| error      | Error           | error occurred on the request                   |
| loading    | boolean         | indicates if the request is being made          |
| canceled   | boolean         | indicates if the request was canceled           |

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="https://github.com/arthurdenner"><img src="https://avatars0.githubusercontent.com/u/13774309?v=4" width="100px;" alt="Arthur Denner"/><br /><sub><b>Arthur Denner</b></sub></a><br /><a href="https://github.com/arthurdenner/use-fetch/commits?author=arthurdenner" title="Code">💻</a> <a href="#design-arthurdenner" title="Design">🎨</a> <a href="https://github.com/arthurdenner/use-fetch/commits?author=arthurdenner" title="Documentation">📖</a> <a href="#example-arthurdenner" title="Examples">💡</a> <a href="#ideas-arthurdenner" title="Ideas, Planning, & Feedback">🤔</a> <a href="#maintenance-arthurdenner" title="Maintenance">🚧</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## License

MIT © [Arthur Denner](https://github.com/arthurdenner/)
