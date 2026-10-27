"use client";

import type { ComponentProps } from "react";

/** Botón de envío que pide confirmación antes de mandar el formulario. */
export function ConfirmSubmit({ message, ...props }: ComponentProps<"button"> & { message: string }) {
  return (
    <button
      type="submit"
      aria-label={props.title}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      {...props}
    />
  );
}
