# shopping-mall

리액트로 만들어보는 간단한 쇼핑몰

## 1. 시작

#### 1.1 Vite 프로젝트 만들기

`yarn create vite`

#### 1.2 vite-plugin-next-react-router 설치

플러그인 설치를 통해 **_Next.js_** 가 사용하는 라우팅 방식 사용하기

설치 이후에 `yarn dev`로 서버를 작동해보면 `routes.tsx` 파일 생성됨

```typescript
import React from "react";
import GlobalLayout from "./pages/_layout";

const DynamicIndex = React.lazy(() => import("./pages/index"));
const DynamicProductsIndex = React.lazy(() => import("./pages/products/index"));
const DynamicProductsId = React.lazy(() => import("./pages/products/[id]"));

export const routes = [
  {
    path: "/",
    element: <GlobalLayout />,
    children: [
      { path: "/", element: <DynamicIndex />, index: true },
      { path: "/products", element: <DynamicProductsIndex />, index: true },
      { path: "/products/:id", element: <DynamicProductsId /> },
    ],
  },
];

export const pages = [
  { route: "/" },
  { route: "/products" },
  { route: "/products/:id" },
];
```

## 2. 상품 페이지 만들기

https://fakestoreapi.com/ 를 이용하여 상품 페이지를 구현하도록 함

#### 2.1 react-query 사용하기

`app.tsx`에 `QueryClientProvider` 와 `ReactQueryDevtools` 작성

그리고 다음과 같이 `queryClient.ts`를 작성함

```typescript
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "react-query";

type AnyOBJ = { [key: string]: any };

// 즉시 실행 함수
export const getClient = (() => {
  let client: QueryClient | null = null;
  return () => {
    if (!client) client = new QueryClient({});
    return client;
  };
})();

const BASE_URL = "https://fakestoreapi.com";

export const fetcher = async ({
  method,
  path,
  body,
  params,
}: {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  body?: AnyOBJ;
  params?: AnyOBJ;
}) => {
  try {
    const url = `${BASE_URL}${path}`;
    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": BASE_URL,
      },
    };
    const res = await fetch(url, fetchOptions);
    const json = await res.json();
    return json;
  } catch (err) {
    console.error(err);
  }
};

export const QueryKeys = {
  PRODUCTS: "PRODUCTS",
};
```

`fetcher` 작성을 유의깊게 볼 것

#### 2.2 스타일은 간단하게 Sass로

#### 2.3 상품상세 페이지

```typescript
export const fetcher = async ({
  method,
  path,
  body,
  params,
}: {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  body?: AnyOBJ;
  params?: AnyOBJ;
}) => {
  try {
    let url = `${BASE_URL}${path}`;
    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": BASE_URL,
      },
    };
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += "?" + searchParams.toString();
    }

    if (body) fetchOptions.body = JSON.stringify(body);

    const res = await fetch(url, fetchOptions);
    const json = await res.json();
    return json;
  } catch (err) {
    console.error(err);
  }
};
```

`fetcher` 함수에 위와 같이 `params` 조건 추가

```typescript
import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import { fetcher, QueryKeys } from "../../queryClient";
import { Product } from "../../types";
import ProductDetail from "../../components/product/detail";

const ProductDetailPage = () => {
  const { id } = useParams();
  const { data } = useQuery<Product>([QueryKeys.PRODUCTS, id], () =>
    fetcher({
      method: "GET",
      path: `/products/${id}`,
    })
  );

  if (!data) return null;

  return (
    <div>
      <h2>상품상세</h2>
      <ProductDetail item={data} />
    </div>
  );
};

export default ProductDetailPage;
```

위와 같이 `params`로 넘어온 id를 키 배열에 추가하여 제품 하나의 정보만 가져올 수 있음

#### react-query cache 정책

```typescript
export const getClient = (() => {
  let client: QueryClient | null = null;
  return () => {
    if (!client)
      client = new QueryClient({
        defaultOptions: {
          queries: {
            cacheTime: 1000 * 60 * 60 * 24,
            staleTime: 1000 * 60,
            refetchOnMount: false,
            refetchOnReconnect: false,
            refetchOnWindowFocus: false,
          },
        },
      });
    return client;
  };
})();
```

`react-query`는 여러가지 옵션을 제공하는데 그 중 `cacheTime`을 설정할 수 있음. 이를 통해 같은 쿼리 키로 불러오는 데이터들을 여러번 `useQuery`로 불러오더라도 이미 요청했어서 캐시가 남아있으면 더 이상 불러오지 않아서 효율적.

## 3. mock API로 데이터통신 준비하기

### 3.1 msw 세팅하기

```typescript
import { graphql } from "msw";
import GET_PRODUCTS, { GET_PRODUCT } from "../graphql/products";
import { v4 as uuid } from "uuid";

const mockProducts = Array.from({ length: 20 }).map((_, i) => ({
  id: uuid(),
  imageUrl: `https://placeimg.com/200/150/${i + 1}`,
  price: 50000,
  title: `임시상품${i + 1}`,
  description: `임시상세내용${i + 1}`,
  createdAt: new Date(1645735501883 + i * 1000 * 60 * 60 * 10).toString(),
}));

export const handlers = [
  graphql.query(GET_PRODUCTS, (req, res, ctx) => {
    return res(
      ctx.data({
        products: mockProducts,
      })
    );
  }),
  graphql.query(GET_PRODUCT, (req, res, ctx) => {
    return res(ctx.data(mockProducts[0]));
  }),
];
```

위와 같이 `handler` 작성

### 3.2 GraphQL 사용해보기

기존에 있던 `types.ts`파일을 삭제하고 따로 `graphql/products.ts`파일 생성
`queryClient`를 아래와 같이 작성

```typescript
export const graphqlFetcher = (query: RequestDocument, variables = {}) =>
  request(BASE_URL, query, variables);

export const QueryKeys = {
  PRODUCTS: "PRODUCTS",
};
```

### 3.3 데이터 불러오기

```typescript
const { data } = useQuery<Products>(QueryKeys.PRODUCTS, () =>
  graphqlFetcher(GET_PRODUCTS)
);
```

위처럼 데이터를 불러올 수 있음

### 3.4 장바구니 mocking하기

상태 관리를 위해 `recoil`도입

```typescript
import { atom, selectorFamily, useRecoilValue } from "recoil";

// map 객체에 대해서 알아보자!
// 타입은 number이거나 undefined이거나
const cartState = atom<Map<string, number>>({
  key: "cartState",
  default: new Map(),
});

export const cartItemSelector = selectorFamily<number | undefined, string>({
  key: "cartItem",
  get:
    (id: string) =>
    ({ get }) => {
      const carts = get(cartState);
      return carts.get(id);
    },
  set:
    (id: string) =>
    ({ get, set }, newValue) => {
      if (typeof newValue === "number") {
        const newCart = new Map([...get(cartState)]);
        newCart.set(id, newValue);
        set(cartState, newCart);
      }
    },
});
```

id에 따라 장바구니의 상태를 불러오거나 상태를 업데이트할 수 있는 코드 작성
