import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

export const API_URL = 'http://localhost:8000'

interface NameRow {
  id: number
  name: string
}
interface AgeRow {
  id: number
  birth_date: string
  age: number
}

/** Data de nascimento de alguém que hoje tem exatamente `years` anos. */
export function birthDateYearsAgo(years: number): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return localISODate(d)
}

/** YYYY-MM-DD na data local (toISOString usaria UTC e causaria erros perto da meia-noite). */
export function localISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const validationError = (msg: string) =>
  HttpResponse.json({ detail: [{ msg: `Value error, ${msg}` }] }, { status: 422 })

// ---------- Backend falso, em memória, que imita as regras do FastAPI ----------
let names: NameRow[] = []
let ages: AgeRow[] = []
let nextId = 1

export function resetDb(seed?: { names?: string[]; agesYears?: number[] }) {
  nextId = 1
  names = (seed?.names ?? []).map((name) => ({ id: nextId++, name }))
  ages = (seed?.agesYears ?? []).map((years) => ({
    id: nextId++,
    birth_date: birthDateYearsAgo(years),
    age: years,
  }))
}

const notFound = (what: string) =>
  HttpResponse.json({ detail: `${what} não encontrado` }, { status: 404 })

export const handlers = [
  // ----- /names -----
  http.get(`${API_URL}/names`, () => HttpResponse.json(names)),
  http.post(`${API_URL}/names`, async ({ request }) => {
    const { name } = (await request.json()) as { name: string }
    const clean = name.trim()
    if (!clean) return validationError('O nome não pode ser vazio')
    const row = { id: nextId++, name: clean }
    names.push(row)
    return HttpResponse.json(row, { status: 201 })
  }),
  http.put(`${API_URL}/names/:id`, async ({ request, params }) => {
    const row = names.find((n) => n.id === Number(params.id))
    if (!row) return notFound('Nome')
    const { name } = (await request.json()) as { name: string }
    const clean = name.trim()
    if (!clean) return validationError('O nome não pode ser vazio')
    row.name = clean
    return HttpResponse.json(row)
  }),
  http.delete(`${API_URL}/names/:id`, ({ params }) => {
    const before = names.length
    names = names.filter((n) => n.id !== Number(params.id))
    return names.length === before ? notFound('Nome') : new HttpResponse(null, { status: 204 })
  }),

  // ----- /ages -----
  http.get(`${API_URL}/ages`, () => HttpResponse.json(ages)),
  http.post(`${API_URL}/ages`, async ({ request }) => {
    const { birth_date } = (await request.json()) as { birth_date: string }
    const row = { id: nextId++, birth_date, age: ageFrom(birth_date) }
    ages.push(row)
    return HttpResponse.json(row, { status: 201 })
  }),
  http.put(`${API_URL}/ages/:id`, async ({ request, params }) => {
    const row = ages.find((a) => a.id === Number(params.id))
    if (!row) return notFound('Registro')
    const { birth_date } = (await request.json()) as { birth_date: string }
    row.birth_date = birth_date
    row.age = ageFrom(birth_date)
    return HttpResponse.json(row)
  }),
  http.delete(`${API_URL}/ages/:id`, ({ params }) => {
    const before = ages.length
    ages = ages.filter((a) => a.id !== Number(params.id))
    return ages.length === before ? notFound('Registro') : new HttpResponse(null, { status: 204 })
  }),
]

function ageFrom(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const now = new Date()
  const had = now.getMonth() + 1 > m || (now.getMonth() + 1 === m && now.getDate() >= d)
  return now.getFullYear() - y - (had ? 0 : 1)
}

export const server = setupServer(...handlers)
