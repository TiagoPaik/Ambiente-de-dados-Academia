'use client';
import { ButtonHTMLAttributes } from 'react';

export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = '', ...rest } = props;
  return (
    <button
      {...rest}
      className={
        "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold " +
        "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] transition shadow-sm " +
        "disabled:opacity-50 disabled:pointer-events-none " + className
      }
    />
  );
}
