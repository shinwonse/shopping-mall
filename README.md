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

### 3.1 GraphQL 사용해보기
