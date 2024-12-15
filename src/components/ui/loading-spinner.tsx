interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function LoadingSpinner({
  className = "",
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-800 ${className}`}
      {...props}
    />
  );
}
