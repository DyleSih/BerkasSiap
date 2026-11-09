export type ServiceTemplate = {
  id: string
  title: string
  slug: string
  category: 'government' | 'travel' | 'career' | 'education'
  summary: string
  institution: string
  durationEstimate: string
  icon: 'document' | 'shield' | 'globe' | 'briefcase' | 'passport'
  accent: 'orange' | 'green' | 'blue' | 'purple' | 'yellow'
  featured: boolean
  order: number
  requirements: Array<{
    id: string
    name: string
    description?: string
    recommended?: boolean
  }>
  tips: Array<{
    id: string
    text: string
  }>
}
