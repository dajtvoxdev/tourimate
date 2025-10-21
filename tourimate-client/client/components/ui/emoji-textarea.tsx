import * as React from "react";
import InputEmoji from "react-input-emoji";
import { cn } from "@/lib/utils";

export interface EmojiTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
  maxLength?: number;
}

const EmojiTextarea = React.forwardRef<HTMLDivElement, EmojiTextareaProps>(
  ({ className, value, onChange, placeholder, rows = 3, disabled, maxLength, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <div 
          className={cn(
            "border border-input rounded-md bg-background",
            disabled && "opacity-60 cursor-not-allowed"
          )}
          style={{ minHeight: `${rows * 20 + 16}px` }}
        >
          <InputEmoji
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            cleanOnEnter
            onEnter={() => {}} // Prevent form submission on enter
            maxLength={maxLength}
            shouldReturn={false}
            shouldConvertEmojiToImage={false}
            inputClass="emoji-input w-full p-3 text-sm focus:outline-none bg-transparent resize-none"
          />
        </div>
      </div>
    );
  },
);

EmojiTextarea.displayName = "EmojiTextarea";

export { EmojiTextarea };
