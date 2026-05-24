import React from "react";
import clsx from "clsx";
import { LoaderCircle } from "lucide-react";
import { motion } from "framer-motion";

const variantClasses = {
  primary: "button-ui-primary text-white",
  secondary: "button-ui-secondary",
  ghost: "button-ui-ghost",
  danger: "button-ui-danger text-white",
};

const sizeClasses = {
  sm: "min-h-[38px] px-3.5 text-sm",
  md: "min-h-[44px] px-4.5 text-sm",
  lg: "min-h-[48px] px-5 text-sm",
};

export default function Button({
  type = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className,
  icon: Icon,
  children,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={isDisabled ? undefined : { y: -1, scale: 1.01 }}
      whileTap={isDisabled ? undefined : { scale: 0.99 }}
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
      type={type}
      disabled={isDisabled}
      className={clsx(
        "button-ui inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-brand-300/50 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{children}</span>
    </motion.button>
  );
}
