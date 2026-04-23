import * as React from "react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../lib/utils";

export interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectPropsBase {
  options: FilterSelectOption[];
  triggerLabel: string;
  horizontal?: boolean;
  showControls?: boolean;
  "aria-label"?: string;
  className?: string;
}

export type FilterSelectPropsMulti = FilterSelectPropsBase & {
  multiselect: true;
  selected: string[];
  onSelectedChange: (values: string[]) => void;
} & (
    | {
        value: string;
        onValueChange: (value: string) => void;
      }
    | {
        value?: undefined;
        onValueChange?: undefined;
      }
  );

export type FilterSelectPropsSingle = FilterSelectPropsBase & {
  multiselect: false;
  value: string;
  onValueChange: (value: string) => void;
} & (
    | {
        selected: string[];
        onSelectedChange: (values: string[]) => void;
      }
    | {
        selected?: undefined;
        onSelectedChange?: undefined;
      }
  );

export type FilterSelectProps =
  | FilterSelectPropsMulti
  | FilterSelectPropsSingle;

interface NormalizedFilterSelectValue {
  selected: string[];
  value: string;
}

function toggleSelected(values: string[], value: string): string[] {
  const nextSet = new Set(values);
  if (nextSet.has(value)) nextSet.delete(value);
  else nextSet.add(value);
  return Array.from(nextSet);
}

function updateSelection(
  props: FilterSelectProps,
  nextSelected: string[],
): NormalizedFilterSelectValue {
  const nextValue = {
    selected:
      nextSelected[0] == null
        ? nextSelected
        : [
            nextSelected[0],
            ...nextSelected.filter((item) => item !== nextSelected[0]),
          ],
    value: nextSelected[0] ?? "",
  };

  props.onSelectedChange?.(nextValue.selected);
  props.onValueChange?.(nextValue.value);

  return nextValue;
}

export function FilterSelect(props: FilterSelectProps) {
  const {
    options,
    triggerLabel,
    horizontal = false,
    showControls = false,
    "aria-label": ariaLabel,
    className,
  } = props;

  const selected = props.value
    ? [
        props.value,
        ...(props.selected ?? []).filter((item) => item !== props.value),
      ]
    : (props.selected ?? []);
  const value = props.value ?? selected[0] ?? "";
  const selectedSet = new Set(selected);

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="inline-flex items-center justify-center h-auto pt-[5.5px] pb-[9.5px] px-5 rounded-[60px] gap-0 text-center text-base font-normal leading-[1.15] tracking-[0.001em] border border-white bg-transparent text-white cursor-pointer select-none hover:bg-transparent hover:border-[#D9B6FF] hover:text-[#D9B6FF] active:bg-transparent active:border-[#AD61FF] active:text-[#AD61FF] focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-transparent focus-visible:border-[#D9B6FF] focus-visible:text-[#D9B6FF]"
            aria-label={
              props.multiselect
                ? (ariaLabel ??
                  (selected.length
                    ? `${triggerLabel}, ${selected.length} в наборе`
                    : triggerLabel))
                : ariaLabel
            }
          >
            {triggerLabel}
          </Button>
        </DropdownMenuTrigger>
        {props.multiselect && selected.length > 0 && (
          <Badge
            variant="default"
            className="absolute -top-2 -right-2 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#AD61FF] pt-[7px] pb-[10px] px-0 text-[13px] text-white border-0 leading-none"
          >
            {selected.length}
          </Badge>
        )}
        <DropdownMenuContent
          align="start"
          sideOffset={10}
          className="w-auto min-w-[200px] max-w-[300%] bg-[#313131] border-0 shadow-none rounded-[12px] p-[34px]"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <ScrollArea
            className={cn(
              "text-xl leading-[1.2] w-full min-h-0 min-w-0",
              horizontal
                ? "h-[calc(1.2em+1px)]"
                : "h-[calc(5*1.2em+4*28px+1px)]",
            )}
          >
            {React.createElement(
              props.multiselect ? DropdownMenuGroup : DropdownMenuRadioGroup,
              {
                ...(props.multiselect
                  ? {}
                  : {
                      value,
                      onValueChange: (nextValue: string) => {
                        updateSelection(props, nextValue ? [nextValue] : []);
                      },
                    }),
                className: cn(
                  "tracks-filter-list outline-none font-normal text-xl leading-[1.2] text-white m-0 p-0",
                  !horizontal
                    ? "flex flex-col gap-7 pr-5"
                    : "flex flex-row gap-6",
                ),
              },
              options.map((opt) =>
                React.createElement(
                  (props.multiselect
                    ? DropdownMenuCheckboxItem
                    : DropdownMenuRadioItem) as React.ElementType,
                  {
                    key: opt.value,
                    ...(props.multiselect
                      ? {
                          checked: selectedSet.has(opt.value),
                          onCheckedChange: () => {
                            updateSelection(
                              props,
                              toggleSelected(selected, opt.value),
                            );
                          },
                        }
                      : {
                          value: opt.value,
                        }),
                    onSelect: (e: Event) => e.preventDefault(),
                    className: cn(
                      cn(
                        "flex items-center gap-3 cursor-pointer select-text text-xl leading-[1.2] text-white outline-none transition-colors !bg-transparent focus:!bg-transparent hover:!text-[#D9B6FF] data-[highlighted]:!bg-[rgba(182,114,255,0.2)] data-[highlighted]:text-[#D9B6FF] rounded-sm px-0 py-0",
                        selectedSet.has(opt.value) &&
                          "text-[#B672FF] underline underline-offset-[3px] hover:no-underline hover:!text-[#D9B6FF] data-[highlighted]:text-[#D9B6FF]",
                      ),
                      showControls
                        ? cn(
                            "pl-[31px] pr-0 [&>span]:left-0 [&>span]:h-[19px] [&>span]:w-[19px] [&>span]:border [&>span]:border-current",
                            props.multiselect
                              ? "[&>span]:rounded-sm [&_svg]:text-current [&_svg]:size-[15px] [&_svg]:stroke-[3]"
                              : "[&>span]:rounded-full [&_svg]:hidden",
                          )
                        : "[&>span]:hidden pl-0 pr-0",
                    ),
                  },
                  opt.label,
                ),
              ),
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
