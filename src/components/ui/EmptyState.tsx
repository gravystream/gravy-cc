import React from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-[#1E1E1E] flex items-center justify-center mb-6 text-[#444444]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2 font-quicksand">{title}</h3>
      {description && (
        <p className="text-sm text-[#808080] max-w-xs mb-8">{description}</p>
      )}
      {action && (
        <div className="flex gap-3">
          <Button variant="primary" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
          {secondaryAction && (
            <Button variant="ghost" size="md" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
