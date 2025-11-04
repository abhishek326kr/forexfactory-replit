import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showItemsPerPage?: boolean;
  showJumpToPage?: boolean;
  showTotalCount?: boolean;
  maxPageNumbers?: number;
  itemsPerPageOptions?: number[];
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  showJumpToPage = true,
  showTotalCount = true,
  maxPageNumbers = 7,
  itemsPerPageOptions = [10, 25, 50, 100],
  className,
  size = 'default'
}: PaginationProps) {
  const [jumpToPageValue, setJumpToPageValue] = useState('');

  // Reset jump input when page changes
  useEffect(() => {
    setJumpToPageValue('');
  }, [currentPage]);

  // Generate page numbers to display
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxPageNumbers) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage <= 3) {
        // Near the start
        for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
          pages.push(i);
        }
        if (totalPages > 6) pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push('...');
        for (let i = Math.max(totalPages - 4, 2); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(jumpToPageValue, 10);
    if (page && page >= 1 && page <= totalPages) {
      handlePageChange(page);
    }
    setJumpToPageValue('');
  };

  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value, 10);
    if (onItemsPerPageChange) {
      onItemsPerPageChange(newItemsPerPage);
      // Reset to page 1 when changing items per page
      onPageChange(1);
    }
  };

  const pageNumbers = generatePageNumbers();
  
  // Calculate range of items being displayed
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'default' : 'sm';
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  if (totalPages <= 1 && !showTotalCount) return null;

  return (
    <div className={cn("flex flex-col md:flex-row items-center gap-4", className)}>
      {/* Total Count & Items Per Page */}
      <div className="flex items-center gap-4 text-sm">
        {showTotalCount && (
          <span className="text-muted-foreground" data-testid="pagination-info">
            Showing {startItem}-{endItem} of {totalItems} results
          </span>
        )}
        
        {showItemsPerPage && onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Items per page:</span>
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger 
                className="h-8 w-16" 
                data-testid="select-items-per-page"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {itemsPerPageOptions.map(option => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <Button
          variant="outline"
          size={buttonSize}
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="hidden sm:flex"
          data-testid="button-first-page"
        >
          <ChevronsLeft className={iconSize} />
          <span className="sr-only">First page</span>
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size={buttonSize}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          data-testid="button-previous-page"
        >
          <ChevronLeft className={iconSize} />
          <span className={cn("sr-only", size === 'lg' && "sm:not-sr-only sm:ml-1")}>
            Previous
          </span>
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <div
                  key={`ellipsis-${index}`}
                  className="flex items-center justify-center w-8 h-8"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
              );
            }

            const pageNumber = page as number;
            const isActive = pageNumber === currentPage;

            return (
              <Button
                key={pageNumber}
                variant={isActive ? 'default' : 'outline'}
                size={buttonSize}
                onClick={() => handlePageChange(pageNumber)}
                className={cn(
                  "min-w-[2rem]",
                  isActive && "pointer-events-none"
                )}
                data-testid={`button-page-${pageNumber}`}
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>

        {/* Next Page */}
        <Button
          variant="outline"
          size={buttonSize}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          data-testid="button-next-page"
        >
          <span className={cn("sr-only", size === 'lg' && "sm:not-sr-only sm:mr-1")}>
            Next
          </span>
          <ChevronRight className={iconSize} />
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size={buttonSize}
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="hidden sm:flex"
          data-testid="button-last-page"
        >
          <ChevronsRight className={iconSize} />
          <span className="sr-only">Last page</span>
        </Button>
      </div>

      {/* Jump to Page */}
      {showJumpToPage && totalPages > 10 && (
        <form onSubmit={handleJumpToPage} className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Go to:</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={jumpToPageValue}
            onChange={(e) => setJumpToPageValue(e.target.value)}
            placeholder={currentPage.toString()}
            className="h-8 w-16"
            data-testid="input-jump-to-page"
          />
          <Button 
            type="submit" 
            size="sm" 
            variant="outline"
            disabled={!jumpToPageValue || parseInt(jumpToPageValue) === currentPage}
            data-testid="button-jump-to-page"
          >
            Go
          </Button>
        </form>
      )}
    </div>
  );
}

// Export a simpler version for basic use cases
export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  className
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        data-testid="simple-button-previous"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>
      
      <span className="text-sm text-muted-foreground px-3">
        Page {currentPage} of {totalPages}
      </span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        data-testid="simple-button-next"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}