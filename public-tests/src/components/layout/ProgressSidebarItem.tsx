import { cn } from "../../lib/utils";
import { colors } from "./utils";
import { useParticipantStore } from '../../stores/participantStore';

export function ProgressSidebarItem({ step, index, isCurrent, isAnswered, totalSteps }: {
    step: unknown;
    index: number;
    isCurrent: boolean;
    isAnswered: boolean;
    totalSteps: number;
  }) {
    let dotColor, lineColor, textColor;
  
    if (isCurrent) {
      dotColor = colors.current;
      textColor = colors.textCurrent;
      lineColor = isAnswered ? colors.lineAnswered : colors.linePending;
    } else if (isAnswered) {
      dotColor = colors.answered;
      textColor = colors.textAnswered;
      lineColor = colors.lineAnswered;
    } else {
      dotColor = colors.pending;
      textColor = colors.textPending;
      lineColor = colors.linePending;
    }

    const canClick = isAnswered && !isCurrent;

    if (typeof step !== 'object' || step === null || !('id' in step) || !('name' in step)) {
      return null;
    }
    const stepObj = step as { id: string; name: string };
    return (
      <div
        key={stepObj.id}
        className={cn(
          "relative flex items-start w-full text-left mb-4 pb-4 last:mb-0 last:pb-0",
          canClick && "cursor-pointer group hover:bg-green-50",
          !canClick && "cursor-default"
        )}
        onClick={canClick ? () => { 
          useParticipantStore.getState().setCurrentStepIndex(index);
        } : undefined}
        role={canClick ? "button" : undefined}
        tabIndex={canClick ? 0 : undefined}
        aria-disabled={!canClick}
      >
        {index < totalSteps - 1 && (
          <div
            className={cn(
              "absolute left-[7px] top-[22px] bottom-[-22px] w-0.5",
              lineColor
            )}
            aria-hidden="true"
          />
        )}
        <div className="flex-shrink-0 relative z-10">
          <div
            className={cn(
              "w-4 h-4 rounded-full transition-colors duration-300",
              dotColor,
              isCurrent && `ring-2 ring-offset-2 ${colors.ringCurrent} ${colors.current}`,
              canClick && "group-hover:ring-2 group-hover:ring-offset-2 group-hover:ring-green-300"
            )}
            aria-current={isCurrent ? 'step' : undefined}
          />
        </div>
        <div className="ml-3 md:ml-4">
          <span
            className={cn(
              "text-sm font-medium transition-colors duration-300",
              textColor,
              canClick && "group-hover:text-green-700"
            )}
          >
            {stepObj.name}
          </span>
        </div>
      </div>
    );
  }