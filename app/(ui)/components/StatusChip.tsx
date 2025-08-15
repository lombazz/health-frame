interface StatusChipProps {
  status: 'low' | 'normal' | 'high' | 'unknown';
  children: React.ReactNode;
}

export default function StatusChip({ status, children }: StatusChipProps) {
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'low': 
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'normal': 
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'high': 
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default: 
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusClasses(status)}`}>
      {children}
    </span>
  );
}
