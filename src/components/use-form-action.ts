"use client";

import { startTransition, useActionState, type FormEvent } from "react";

/**
 * Como useActionState, pero envía el formulario sin que React lo vacíe:
 * si el servidor devuelve un error, el usuario no pierde lo que había escrito.
 */
export function useFormAction<S>(action: (state: S | undefined, data: FormData) => Promise<S>, confirmMessage?: string) {
  const [state, dispatch, pending] = useActionState<S | undefined, FormData>(action, undefined);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  };
  return [state, onSubmit, pending] as const;
}
