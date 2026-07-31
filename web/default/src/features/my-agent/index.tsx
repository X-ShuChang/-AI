import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Bot, Cloud, Download, MessageSquare, BrainCircuit, RefreshCw } from 'lucide-react'

import { SectionPageLayout } from '@/components/layout'
import { api } from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────────────────

interface Conversation {
  id: string
  title: string
  preview: string
  messageCount: number
  updatedAt: string
  deletedAt: string | null
}

interface Memory {
  id: string
  content: string
  category: string
  updatedAt: string
}

interface AgentOverview {
  conversations: Conversation[]
  memories: Memory[]
  conversationCount: number
  memoryCount: number
  error: string | null
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

// ── Main component ─────────────────────────────────────────────────────────

export function MyAgent() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<AgentOverview>({
    conversations: [],
    memories: [],
    conversationCount: 0,
    memoryCount: 0,
    error: null,
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [convRes, memRes] = await Promise.all([
        api.get('/api/desktop/conversations?after_seq=0&limit=10'),
        api.get('/api/desktop/memory?after_seq=0&limit=20'),
      ])
      const conversations: Conversation[] = convRes.data ?? []
      const memories: Memory[] = memRes.data ?? []
      setOverview({
        conversations: conversations.filter((c) => !c.deletedAt),
        memories,
        conversationCount: conversations.filter((c) => !c.deletedAt).length,
        memoryCount: memories.length,
        error: null,
      })
    } catch (err) {
      setOverview((prev) => ({
        ...prev,
        error: t('Failed to load Agent data. Please try again.'),
      }))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        <div className='flex items-center justify-between'>
          <span>{t('My Agent')}</span>
          <button
            onClick={() => void fetchData()}
            className='flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('Refresh')}
          </button>
        </div>
      </SectionPageLayout.Title>

      <SectionPageLayout.Content>
        <div className='mx-auto flex w-full max-w-4xl flex-col gap-5'>

          {/* Error */}
          {overview.error && (
            <div className='rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
              {overview.error}
            </div>
          )}

          {/* Stats */}
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
            <div className='rounded-xl border border-border bg-card p-5'>
              <div className='flex items-center gap-2 text-muted-foreground'>
                <MessageSquare className='h-4 w-4' />
                <span className='text-sm'>{t('Synced Conversations')}</span>
              </div>
              <p className='mt-2 text-3xl font-bold tracking-tight'>
                {loading ? '—' : overview.conversationCount}
              </p>
            </div>
            <div className='rounded-xl border border-border bg-card p-5'>
              <div className='flex items-center gap-2 text-muted-foreground'>
                <BrainCircuit className='h-4 w-4' />
                <span className='text-sm'>{t('Memories')}</span>
              </div>
              <p className='mt-2 text-3xl font-bold tracking-tight'>
                {loading ? '—' : overview.memoryCount}
              </p>
            </div>
            <div className='col-span-2 sm:col-span-1 rounded-xl border border-border bg-card p-5'>
              <div className='flex items-center gap-2 text-muted-foreground'>
                <Cloud className='h-4 w-4' />
                <span className='text-sm'>{t('Sync Service')}</span>
              </div>
              <p className='mt-2 text-sm font-medium text-green-600 dark:text-green-400'>
                {loading ? '—' : overview.error ? t('Unavailable') : t('Online')}
              </p>
            </div>
          </div>

          {/* Recent conversations */}
          <div className='rounded-xl border border-border bg-card'>
            <div className='flex items-center gap-2 border-b border-border px-5 py-4'>
              <MessageSquare className='h-4 w-4 text-muted-foreground' />
              <h2 className='font-semibold'>{t('Recent Conversations')}</h2>
            </div>
            {loading ? (
              <div className='flex items-center justify-center py-12 text-sm text-muted-foreground'>
                {t('Loading...')}
              </div>
            ) : overview.conversations.length === 0 ? (
              <div className='flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground'>
                <Bot className='h-8 w-8 opacity-30' />
                <p>{t('No synced conversations yet. Install LocoPal Agent and start chatting.')}</p>
              </div>
            ) : (
              <ul className='divide-y divide-border'>
                {overview.conversations.map((conv) => (
                  <li key={conv.id} className='flex items-start justify-between gap-4 px-5 py-4'>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate font-medium text-sm'>
                        {conv.title || t('Untitled Conversation')}
                      </p>
                      {conv.preview && (
                        <p className='mt-0.5 truncate text-xs text-muted-foreground'>
                          {conv.preview.slice(0, 80)}
                        </p>
                      )}
                    </div>
                    <div className='flex shrink-0 flex-col items-end gap-1'>
                      <span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
                        {conv.messageCount} {t('messages')}
                      </span>
                      <span className='text-xs text-muted-foreground'>
                        {formatDate(conv.updatedAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Memories */}
          {!loading && overview.memories.length > 0 && (
            <div className='rounded-xl border border-border bg-card'>
              <div className='flex items-center gap-2 border-b border-border px-5 py-4'>
                <BrainCircuit className='h-4 w-4 text-muted-foreground' />
                <h2 className='font-semibold'>{t('Loco Remembers')}</h2>
                <span className='ml-auto text-xs text-muted-foreground'>{t('User confirmed')}</span>
              </div>
              <ul className='divide-y divide-border'>
                {overview.memories.slice(0, 10).map((mem) => (
                  <li key={mem.id} className='flex items-center gap-4 px-5 py-3'>
                    <span className='shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
                      {mem.category}
                    </span>
                    <p className='flex-1 truncate text-sm'>{mem.content}</p>
                    <span className='shrink-0 text-xs text-muted-foreground'>
                      {formatDate(mem.updatedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Download */}
          <div className='rounded-xl border border-border bg-card'>
            <div className='flex items-center gap-2 border-b border-border px-5 py-4'>
              <Download className='h-4 w-4 text-muted-foreground' />
              <h2 className='font-semibold'>{t('Download LocoPal Agent')}</h2>
            </div>
            <div className='px-5 py-5'>
              <p className='mb-4 text-sm text-muted-foreground'>
                {t('Install the desktop app to chat with AI, sync conversations and memories across all your devices.')}
              </p>
              <a
                href='/api/desktop/console'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90'
              >
                <Download className='h-4 w-4' />
                {t('View Downloads')}
              </a>
            </div>
          </div>

        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
