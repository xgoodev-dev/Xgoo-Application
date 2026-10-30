import { Loader2, Mic, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HubBookingAiBar({
  value,
  onChange,
  onSubmit,
  onVoice,
  loading,
  recording,
  placeholder,
  testIdPrefix,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onVoice: () => void;
  loading?: boolean;
  recording?: boolean;
  placeholder: string;
  testIdPrefix: string;
}) {
  return (
    <div className="flex gap-2 border-b border-dashed pb-3">
      <Sparkles className="mt-2.5 h-3.5 w-3.5 shrink-0 text-[#FF4907]" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
        }}
        placeholder={placeholder}
        className="text-sm"
        disabled={loading}
        data-testid={`input-ai-${testIdPrefix}`}
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={onVoice}
        className={recording ? "text-red-500" : ""}
        data-testid={`button-mic-${testIdPrefix}`}
      >
        <Mic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={onSubmit}
        disabled={loading || !value.trim()}
        data-testid={`button-ai-${testIdPrefix}`}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}
