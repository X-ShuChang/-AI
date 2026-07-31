import { createFileRoute } from '@tanstack/react-router'

import { MyAgent } from '@/features/my-agent'

export const Route = createFileRoute('/_authenticated/my-agent/')({
  component: MyAgent,
})
