import { forwardRef } from 'react';

const Button = forwardRef(function Button({ children, className = '', variant = 'primary', ...props }, ref) {
  const variants = {
    primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow',
    secondary: 'border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  };
  return <button ref={ref} className={`inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>{children}</button>;
});

export default Button;
