import type { Table } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DataTablePagination<TData>({ table }: { table: Table<TData> }) {
  const pageIndex = table.getState().pagination.pageIndex
  const pageCount = table.getPageCount()

  if (pageCount <= 1) return null

  return (
    <div className="flex items-center justify-between">
      <p className="text-muted-foreground text-sm">
        Page {pageIndex + 1} of {pageCount}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
