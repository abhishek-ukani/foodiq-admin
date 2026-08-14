/** Builds a CSV from rows of plain values and triggers a browser download. Escapes quotes/commas. */
export function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
  const csv = [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))].join(
    '\n',
  )
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
