import type { LevelRecord } from '../save'

export type RatingsValue = Pick<LevelRecord, 'done' | 'allOrbs' | 'parMet'>
export function Ratings({ value, animate = false }: { value?: RatingsValue; animate?: boolean }) {
  const items = [
    { key: 'done', label: '抵达', path: 'M8 3h8M12 3v3M7 7h10v12H7zM9 21h6M10 10v6M14 10v6' },
    {
      key: 'allOrbs',
      label: '集齐全部光点',
      path: 'M12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18',
    },
    { key: 'parMet', label: '最少步数', path: 'M7 3c-3 0-3 9 0 9s3-9 0-9M7 15v5M17 6c-3 0-3 9 0 9s3-9 0-9M17 18v3' },
  ] as const
  return (
    <span className={`ratings${animate ? ' ratings-animate' : ''}`}>
      {items.map((item, index) => (
        <svg
          key={item.key}
          className={value?.[item.key] ? 'rating earned' : 'rating'}
          style={{ animationDelay: `${0.4 + index * 0.2}s` }}
          viewBox="0 0 24 24"
          role="img"
          aria-label={`${item.label}：${value?.[item.key] ? '已获得' : '未获得'}`}
        >
          <path
            d={item.path}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  )
}
