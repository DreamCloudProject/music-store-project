import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils";

const filterTriggerClasses =
  "inline-flex items-center justify-center h-auto pt-[5.5px] pb-[9.5px] px-5 rounded-[60px] gap-0 text-center text-base font-normal leading-[1.15] tracking-[0.001em] border border-white bg-transparent text-white cursor-pointer select-none hover:bg-transparent hover:border-[#D9B6FF] hover:text-[#D9B6FF] active:bg-transparent active:border-[#AD61FF] active:text-[#AD61FF] focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-transparent focus-visible:border-[#D9B6FF] focus-visible:text-[#D9B6FF]";

const contentShellClasses =
  "w-auto min-w-[200px] max-w-[300%] bg-[#313131] border-0 shadow-none rounded-[12px] p-[34px]";
const scrollableListClasses =
  "tracks-filter-list flex flex-col gap-7 h-[calc(5*1.2em+4*28px+1px)] min-h-0 min-w-0 overflow-y-auto pr-5 outline-none font-normal text-xl leading-[1.2] text-white";
const horizontalListClasses = "flex flex-row gap-6";

const itemBaseClasses =
  "flex items-center gap-3 cursor-pointer select-text text-xl leading-[1.2] text-white outline-none transition-colors !bg-transparent focus:!bg-transparent hover:!text-[#D9B6FF] data-[highlighted]:!bg-[rgba(182,114,255,0.2)] data-[highlighted]:text-[#D9B6FF] rounded-sm px-0 py-0";

const itemCheckedClasses =
  "text-[#B672FF] underline underline-offset-[3px] hover:no-underline hover:!text-[#D9B6FF] data-[highlighted]:text-[#D9B6FF]";

export interface FilterSelectOption {
  value: string;
  label: string;
}

export interface FilterSelectPropsMulti {
  multiselect: true;
  options: FilterSelectOption[];
  selected: string[];
  onSelectedChange: (values: string[]) => void;
  triggerLabel: string;
  horizontal?: boolean;
  showControls?: boolean;
  "aria-label"?: string;
  className?: string;
}

export interface FilterSelectPropsSingle {
  multiselect: false;
  options: FilterSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  triggerLabel: string;
  horizontal?: boolean;
  showControls?: boolean;
  "aria-label"?: string;
  className?: string;
}

export type FilterSelectProps =
  | FilterSelectPropsMulti
  | FilterSelectPropsSingle;

export function FilterSelect(props: FilterSelectProps) {
  const {
    options,
    triggerLabel,
    horizontal = false,
    showControls = false,
    "aria-label": ariaLabel,
    className,
  } = props;

  const isMulti = props.multiselect;
  const selectedSet = isMulti ? new Set(props.selected) : null;
  const count = selectedSet?.size ?? 0;
  const showBadge = isMulti && count > 0;

  const isVertical = !horizontal;
  const checkboxControlClasses = showControls
    ? "pl-[31px] pr-0 [&>span]:left-0 [&>span]:h-[19px] [&>span]:w-[19px] [&>span]:rounded-sm [&>span]:border [&>span]:border-current [&_svg]:text-current [&_svg]:size-[15px] [&_svg]:stroke-[3]"
    : "[&>span]:hidden pl-0 pr-0";
  const radioControlClasses = showControls
    ? "pl-[31px] pr-0 [&>span]:left-0 [&>span]:h-[19px] [&>span]:w-[19px] [&>span]:rounded-full [&>span]:border [&>span]:border-current [&_svg]:hidden"
    : "[&>span]:hidden pl-0 pr-0";
  const singleListClass = cn(
    isVertical ? "flex flex-col gap-7" : horizontalListClasses,
    "m-0 p-0",
  );

  const triggerAriaLabel = isMulti
    ? (ariaLabel ??
      (count ? `${triggerLabel}, ${count} в наборе` : triggerLabel))
    : ariaLabel;

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={filterTriggerClasses}
            aria-label={triggerAriaLabel}
          >
            {triggerLabel}
          </Button>
        </DropdownMenuTrigger>
        {showBadge && (
          <Badge
            variant="default"
            className="absolute -top-2 -right-2 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#AD61FF] pt-[7px] pb-[10px] px-0 text-[13px] text-white border-0 leading-none"
          >
            {count}
          </Badge>
        )}
        <DropdownMenuContent
          align="start"
          sideOffset={10}
          className={contentShellClasses}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <>
            {isMulti && selectedSet ? (
              <div
                className={
                  isVertical ? scrollableListClasses : horizontalListClasses
                }
              >
                {options.map((opt) => {
                  const isChecked = selectedSet.has(opt.value);
                  return (
                    <DropdownMenuCheckboxItem
                      key={opt.value}
                      checked={isChecked}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={() => {
                        const nextSet = new Set(props.selected);
                        if (nextSet.has(opt.value)) nextSet.delete(opt.value);
                        else nextSet.add(opt.value);
                        props.onSelectedChange(Array.from(nextSet));
                      }}
                      className={cn(
                        itemBaseClasses,
                        isChecked && itemCheckedClasses,
                        checkboxControlClasses,
                      )}
                    >
                      {opt.label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </div>
            ) : !isMulti ? (
              <div className={isVertical ? scrollableListClasses : undefined}>
                <DropdownMenuRadioGroup
                  value={props.value}
                  onValueChange={(v) => props.onValueChange(v)}
                  className={singleListClass}
                >
                  {options.map((opt) => (
                    <DropdownMenuRadioItem
                      key={opt.value}
                      value={opt.value}
                      onSelect={(e) => e.preventDefault()}
                      className={cn(
                        itemBaseClasses,
                        props.value === opt.value && itemCheckedClasses,
                        radioControlClasses,
                      )}
                    >
                      {opt.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </div>
            ) : null}
          </>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
