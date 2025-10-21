import React, { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface PaginatedSelectOption {
  value: string;
  label: string;
  [key: string]: any;
}

export interface PaginatedSelectProps {
  options: PaginatedSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  onSearch?: (searchTerm: string) => void;
  onLoadMore?: () => void;
  placeholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  hasMore?: boolean;
  className?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
}

export function PaginatedSelect({
  options,
  value,
  onValueChange,
  onSearch,
  onLoadMore,
  placeholder = "Select option...",
  emptyMessage = "No options found.",
  loading = false,
  hasMore = false,
  className,
  disabled = false,
  searchPlaceholder = "Search...",
}: PaginatedSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch && searchTerm !== "") {
        onSearch(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  const handleSearch = useCallback((search: string) => {
    setSearchTerm(search);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (onLoadMore && hasMore && !loading) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, loading]);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !selectedOption && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchTerm}
            onValueChange={handleSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading..." : emptyMessage}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange?.(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
              {hasMore && (
                <CommandItem
                  onSelect={handleLoadMore}
                  disabled={loading}
                  className="justify-center"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Loading more...
                    </div>
                  ) : (
                    "Load more..."
                  )}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Hook for managing paginated data
export function usePaginatedSelect<T extends PaginatedSelectOption>(
  fetchData: (params: { search?: string; page: number; pageSize: number }) => Promise<{
    data: T[];
    totalCount: number;
    hasMore: boolean;
  }>,
  pageSize: number = 20
) {
  const [options, setOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = useCallback(
    async (page: number, search?: string, append: boolean = false) => {
      try {
        setLoading(true);
        const result = await fetchData({
          search,
          page,
          pageSize,
        });

        if (append) {
          setOptions((prev) => [...prev, ...result.data]);
        } else {
          setOptions(result.data);
        }

        setHasMore(result.hasMore);
        setCurrentPage(page);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    },
    [pageSize] // Remove fetchData from dependencies to prevent infinite loop
  );

  const handleSearch = useCallback(
    (search: string) => {
      setSearchTerm(search);
      setCurrentPage(1);
      loadData(1, search, false);
    },
    [] // Remove loadData dependency
  );

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadData(currentPage + 1, searchTerm, true);
    }
  }, [hasMore, loading, currentPage, searchTerm]); // Remove loadData dependency

  const reset = useCallback(() => {
    setOptions([]);
    setCurrentPage(1);
    setHasMore(true);
    setSearchTerm("");
    loadData(1, undefined, false);
  }, []); // Remove loadData dependency

  // Initial load - only run once on mount
  useEffect(() => {
    loadData(1, undefined, false);
  }, []); // Empty dependency array to run only once

  return {
    options,
    loading,
    hasMore,
    search: handleSearch,
    loadMore: handleLoadMore,
    reset,
  };
}
