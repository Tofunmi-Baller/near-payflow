import { getInitials, getAvatarColor } from "../../lib/format";

const sizes = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-xs",
  lg: "w-11 h-11 text-sm",
};

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  return (
    <div
      className={`${sizes[size]} ${getAvatarColor(name)} rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
