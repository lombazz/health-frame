import { ReactNode, ButtonHTMLAttributes } from 'react';
import Link from 'next/link';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  href?: string;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  href, 
  className = '',
  ...props 
}: ButtonProps) {
  const baseClasses = "inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium transition shadow-sm";
  
  const variantClasses = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200"
  };

  const fullClassName = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={fullClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button className={fullClassName} {...props}>
      {children}
    </button>
  );
}
