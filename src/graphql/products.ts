import { gql } from "graphql-request";

export type Product = {
  id: string;
  imageUrl: string;
  price: number;
  title: string;
  description: string;
  createdAt: string;
};

export type Products = {
  products: Product[];
};

const GET_PRODUCTS = gql`
  query GET_PRODUCTS {
    id
    imageUrl
    price
    title
    description
    createdAt
  }
`;

export const GET_PRODUCT = gql`
  query GET_PRODUCT($od: string) {
    id
    imageUrl
    price
    title
    description
    createdAt
  }
`;

export default GET_PRODUCTS;
