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
  /** Приоритет драга (карусель): не открывать на pointerdown, только тап без сдвига. */
  preferDrag?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
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
  value?: string;
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
    preferDrag = false,
    hasNextPage = false,
    isFetchingNextPage = false,
    onLoadMore,
    "aria-label": ariaLabel,
    className,
  } = props;

  const [open, setOpen] = React.useState(false);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<{
    id: number;
    x: number;
    y: number;
  } | null>(null);
  const draggedRef = React.useRef(false);

  React.useEffect(() => {
    if (!preferDrag) return;
    const onMove = (event: PointerEvent) => {
      const track = trackRef.current;
      if (!track || event.pointerId !== track.id) return;
      const dx = event.clientX - track.x;
      const dy = event.clientY - track.y;
      if (dx * dx + dy * dy > 64) {
        draggedRef.current = true;
        setOpen(false);
      }
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [preferDrag]);

  const tryLoadMore = React.useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    onLoadMore?.();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  React.useEffect(() => {
    if (!open || !hasNextPage || isFetchingNextPage) return;
    const id = requestAnimationFrame(() => {
      const viewport =
        viewportRef.current ??
        document.querySelector<HTMLElement>(
          "[data-radix-scroll-area-viewport]",
        );
      if (!viewport || viewport.scrollHeight <= viewport.clientHeight + 2) {
        tryLoadMore();
      }
    });
    return () => cancelAnimationFrame(id);
  }, [hasNextPage, isFetchingNextPage, open, options.length, tryLoadMore]);

  const selected = props.value
    ? [
        props.value,
        ...(props.selected ?? []).filter((item) => item !== props.value),
      ]
    : (props.selected ?? []);
  const value = props.value ?? selected[0] ?? "";
  const selectedSet = new Set(selected);
  const triggerAriaLabel = props.multiselect
    ? (ariaLabel ??
      (selected.length
        ? `${triggerLabel}, ${selected.length} в наборе`
        : triggerLabel))
    : ariaLabel;
  const triggerClassName =
    "inline-flex items-center justify-center h-auto pt-[5.5px] pb-[9.5px] px-5 rounded-[60px] gap-0 text-center text-base font-normal leading-[1.15] tracking-[0.001em] border border-border-strong bg-transparent text-fg cursor-pointer select-none hover:bg-transparent hover:border-accent-hover hover:text-accent-hover active:bg-control-active-bg active:border-accent-active active:text-accent-active focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-transparent focus-visible:border-accent-hover focus-visible:text-accent-hover";

  const triggerButton = (
    <Button
      variant="outline"
      className={triggerClassName}
      aria-label={triggerAriaLabel}
      aria-haspopup={preferDrag ? "menu" : undefined}
      aria-expanded={preferDrag ? open : undefined}
      onPointerDown={
        preferDrag
          ? (event) => {
              if (event.button !== 0) return;
              trackRef.current = {
                id: event.pointerId,
                x: event.clientX,
                y: event.clientY,
              };
              draggedRef.current = false;
            }
          : undefined
      }
      onPointerUp={
        preferDrag
          ? (event) => {
              if (event.button !== 0) return;
              const track = trackRef.current;
              if (!track || event.pointerId !== track.id) return;
              trackRef.current = null;
              if (!draggedRef.current) setOpen((was) => !was);
            }
          : undefined
      }
      onPointerCancel={
        preferDrag
          ? () => {
              trackRef.current = null;
              draggedRef.current = false;
            }
          : undefined
      }
      onKeyDown={
        preferDrag
          ? (event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              setOpen((was) => !was);
            }
          : undefined
      }
    >
      {triggerLabel}
    </Button>
  );

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu open={preferDrag ? open : undefined} onOpenChange={setOpen}>
        {preferDrag ? (
          <span className="relative inline-flex">
            {triggerButton}
            {/*
              Триггер Radix только для якоря позиционирования.
              pointer-events-none: иначе pointerdown открывает меню и preventDefault ломает Embla.
            */}
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                tabIndex={-1}
                aria-hidden
                className="pointer-events-none absolute inset-0"
              />
            </DropdownMenuTrigger>
          </span>
        ) : (
          <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
        )}
        {props.multiselect && selected.length > 0 && (
          <Badge
            variant="default"
            className="absolute -top-2 -right-2 flex h-[26px] w-[26px] items-center justify-center rounded-full border-0 bg-badge px-0 pt-[7px] pb-[10px] text-[13px] leading-none text-white"
          >
            {selected.length}
          </Badge>
        )}
        <DropdownMenuContent
          align="start"
          sideOffset={10}
          className="w-auto min-w-[200px] max-w-[300%] rounded-[12px] border-0 bg-cover-bg p-[34px] text-fg shadow-none"
          onCloseAutoFocus={(e: Event) => e.preventDefault()}
        >
          <ScrollArea
            viewportRef={viewportRef}
            onViewportScroll={(event) => {
              if (horizontal) return;
              const viewport = event.currentTarget;
              if (
                viewport.scrollHeight -
                  viewport.scrollTop -
                  viewport.clientHeight <
                40
              ) {
                tryLoadMore();
              }
            }}
            onWheel={(event) => {
              if (horizontal) return;
              const viewport =
                viewportRef.current ??
                (event.currentTarget.querySelector(
                  "[data-radix-scroll-area-viewport]",
                ) as HTMLElement | null);
              if (!viewport) return;
              const atBottom =
                viewport.scrollHeight -
                  viewport.scrollTop -
                  viewport.clientHeight <
                2;
              if (atBottom && event.deltaY > 0) tryLoadMore();
            }}
            className={cn(
              "text-xl leading-[1.2] w-full min-h-0 min-w-0",
              horizontal
                ? "h-[calc(1.2em+1px)]"
                : hasNextPage || options.length > 5
                  ? "h-[calc(5*1.2em+4*28px+1px)]"
                  : "max-h-[calc(5*1.2em+4*28px+1px)]",
            )}
          >
            {React.createElement(
              props.multiselect ? DropdownMenuGroup : DropdownMenuRadioGroup,
              {
                ...(props.multiselect
                  ? {}
                  : {
                      value,
                      onValueChange: (nextValue: string) =>
                        updateSelection(
                          props,
                          nextValue && nextValue !== value ? [nextValue] : [],
                        ),
                    }),
                className: cn(
                  "tracks-filter-list m-0 p-0 text-xl font-normal leading-[1.2] text-fg outline-none",
                  !horizontal
                    ? "flex flex-col gap-7 pr-5"
                    : "flex flex-row gap-6",
                ),
              },
              ...options.map((opt) =>
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
                        "flex cursor-pointer items-center gap-3 rounded-sm px-0 py-0 text-xl leading-[1.2] text-fg outline-none transition-colors select-text !bg-transparent hover:!text-accent-hover focus:!bg-transparent data-[highlighted]:!bg-transparent data-[highlighted]:text-accent-hover",
                        selectedSet.has(opt.value) &&
                          "text-accent-selected underline underline-offset-[3px] hover:no-underline hover:!text-accent-hover data-[highlighted]:text-accent-hover",
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
              hasNextPage || isFetchingNextPage
                ? React.createElement("div", {
                    key: "filter-select-sentinel",
                    "aria-hidden": true,
                    className: "h-4 shrink-0",
                  })
                : null,
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
