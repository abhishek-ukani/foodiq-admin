interface SidebarFooterProps {
  onAction?: () => void
}

export function SidebarFooter({ onAction }: SidebarFooterProps = {}) {
  return (
    <div
      onClick={onAction}
      className="border-t p-4 text-xs text-muted-foreground text-center"
    >
      FoodIQ Admin v1.0
    </div>
  )
}
