import { SyntheticEvent } from "react";
import { useMutation } from "react-query";
import { CartType, UPDATE_CART } from "../../graphql/cart";
import { getClient, graphqlFetcher, QueryKeys } from "../../queryClient";

const CartItem = ({ id, imageUrl, price, title, amount }: CartType) => {
  const queryClient = getClient();
  const { mutate: updateCart } = useMutation(
    ({ id, amount }: { id: string; amount: number }) =>
      graphqlFetcher(UPDATE_CART, { id, amount }),
    {
      onMutate: async ({ id, amount }) => {
        await queryClient.cancelQueries(QueryKeys.CART);
        const { cart: prevCart } = queryClient.getQueryData<{
          cart: CartType[];
        }>(QueryKeys.CART) || { cart: [] };
        if (!prevCart) return null;

        const targetIndex = prevCart.findIndex(
          (cartItem) => cartItem.id === id
        );
        if (targetIndex === undefined || targetIndex < 0) return prevCart;

        const newCart = [...prevCart];
        newCart.splice(targetIndex, 1, { ...newCart[targetIndex], amount });
        queryClient.setQueryData(QueryKeys.CART, { cart: newCart });
        return prevCart;
      },
      onSuccess: ({ updateCart }) => {
        const { cart: prevCart } = queryClient.getQueryData<{
          cart: CartType[];
        }>(QueryKeys.CART) || { cart: [] };
        const targetIndex = prevCart?.findIndex(
          (cartItem) => cartItem.id === updateCart.id
        );
        if (!prevCart || targetIndex === undefined || targetIndex < 0) return;

        const newCart = [...prevCart];
        newCart.splice(targetIndex, 1, updateCart);
        queryClient.setQueryData(QueryKeys.CART, { cart: newCart });
      },
    }
  );

  const handleUpdateAmount = (e: SyntheticEvent) => {
    const amount = Number((e.target as HTMLInputElement).value);
    if (amount < 1) return;
    updateCart({ id, amount });
  };

  return (
    <li className="cart-item">
      <img className="cart-item__image" src={imageUrl} />
      <p className="cart-item__price">{price}</p>
      <p className="cart-item__title">{title}</p>
      <input
        type="number"
        className="cart-item__amount"
        value={amount}
        onChange={handleUpdateAmount}
      />
    </li>
  );
};

export default CartItem;
