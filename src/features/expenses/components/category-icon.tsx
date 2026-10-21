import { ICON_MAP } from './category-constants'
import { Tag } from 'lucide-react'

interface CategoryIconProps {
  name: string
  className?: string
}

export function CategoryIcon({ name, className = 'size-4' }: CategoryIconProps) {
  const IconComponent = ICON_MAP[name] || Tag
  return <IconComponent className={className} aria-hidden />
}
