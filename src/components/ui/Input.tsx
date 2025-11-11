'use client';
import { InputHTMLAttributes } from 'react';

export default function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props;
  return (
    <input
      {...rest}
      className={
        "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[15px] " +
        "text-gray-900 placeholder:text-gray-400 " +
        "focus:outline-none focus:ring-2 focus:ring-blue-600 " + className
      }
    />
  );
}
