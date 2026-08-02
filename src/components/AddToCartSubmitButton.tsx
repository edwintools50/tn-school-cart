"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ShoppingCart, Check } from "lucide-react";

// The surrounding <form action={addToCartAction}> stays a plain Server
// Component form — only this button needs to be a Client Component, since
// useFormStatus reads the status of its nearest ancestor <form>.
export default function AddToCartSubmitButton({
  className,
  iconSize = 16,
}: {
  className: string;
  iconSize?: number;
}) {
  const { pending } = useFormStatus();
  const [justAdded, setJustAdded] = useState(false);
  const prevPending = useRef(pending);

  useEffect(() => {
    if (prevPending.current && !pending) {
      setJustAdded(true);
      const timer = setTimeout(() => setJustAdded(false), 1800);
      prevPending.current = pending;
      return () => clearTimeout(timer);
    }
    prevPending.current = pending;
  }, [pending]);

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (
        "Adding…"
      ) : justAdded ? (
        <>
          <Check size={iconSize} />
          Added to cart
        </>
      ) : (
        <>
          <ShoppingCart size={iconSize} />
          Add to cart
        </>
      )}
    </button>
  );
}
