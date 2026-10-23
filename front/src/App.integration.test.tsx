/**
 * Testes de integração do front-end.
 *
 * Renderizam o <App /> inteiro e exercitam o fluxo real do usuário
 * (digitar, clicar, ver a lista atualizar). Só a rede é simulada: o MSW
 * intercepta o fetch e responde como o backend FastAPI responderia.
 */
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { API_URL, birthDateYearsAgo, localISODate, resetDb, server } from './test/server'

const namesSection = () => screen.getByRole('region', { name: 'Nomes' })
const agesSection = () => screen.getByRole('region', { name: 'Idades' })

beforeEach(() => {
  resetDb()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})
afterEach(() => vi.restoreAllMocks())

describe('carga inicial', () => {
  it('mostra o estado vazio das duas listas', async () => {
    render(<App />)
    expect(await within(namesSection()).findByText('Nenhum nome cadastrado.')).toBeInTheDocument()
    expect(
      await within(agesSection()).findByText('Nenhuma data de nascimento cadastrada.'),
    ).toBeInTheDocument()
  })

  it('lista nomes e idades já cadastrados no backend', async () => {
    resetDb({ names: ['Maria', 'João'], agesYears: [30] })
    render(<App />)

    expect(await within(namesSection()).findByText('Maria')).toBeInTheDocument()
    expect(within(namesSection()).getByText('João')).toBeInTheDocument()
    // a idade vem calculada do backend e a data é exibida em dd/mm/aaaa
    expect(await within(agesSection()).findByText('30 anos')).toBeInTheDocument()
    const [y, m, d] = birthDateYearsAgo(30).split('-')
    expect(within(agesSection()).getByText(`nascido(a) em ${d}/${m}/${y}`)).toBeInTheDocument()
  })
})

describe('nomes (CRUD)', () => {
  it('cadastra um nome, mostra na lista e limpa o campo', async () => {
    const user = userEvent.setup()
    render(<App />)
    await within(namesSection()).findByText('Nenhum nome cadastrado.')

    const input = within(namesSection()).getByLabelText('Novo valor')
    await user.type(input, 'Maria')
    await user.click(within(namesSection()).getByRole('button', { name: 'Cadastrar' }))

    expect(await within(namesSection()).findByText('Maria')).toBeInTheDocument()
    expect(input).toHaveValue('')
    expect(within(namesSection()).queryByText('Nenhum nome cadastrado.')).not.toBeInTheDocument()
  })

  it('edita um nome', async () => {
    resetDb({ names: ['Maria'] })
    const user = userEvent.setup()
    render(<App />)
    await within(namesSection()).findByText('Maria')

    await user.click(within(namesSection()).getByRole('button', { name: 'Editar' }))
    const edit = within(namesSection()).getByLabelText('Editar valor')
    expect(edit).toHaveValue('Maria')
    await user.clear(edit)
    await user.type(edit, 'Mariana')
    await user.click(within(namesSection()).getByRole('button', { name: 'Salvar' }))

    expect(await within(namesSection()).findByText('Mariana')).toBeInTheDocument()
    expect(within(namesSection()).queryByText('Maria')).not.toBeInTheDocument()
    expect(within(namesSection()).queryByLabelText('Editar valor')).not.toBeInTheDocument()
  })

  it('cancelar a edição mantém o valor original', async () => {
    resetDb({ names: ['Maria'] })
    const user = userEvent.setup()
    render(<App />)
    await within(namesSection()).findByText('Maria')

    await user.click(within(namesSection()).getByRole('button', { name: 'Editar' }))
    await user.type(within(namesSection()).getByLabelText('Editar valor'), 'XYZ')
    await user.click(within(namesSection()).getByRole('button', { name: 'Cancelar' }))

    expect(within(namesSection()).getByText('Maria')).toBeInTheDocument()
  })

  it('exclui um nome depois de confirmar', async () => {
    resetDb({ names: ['Maria', 'João'] })
    const user = userEvent.setup()
    render(<App />)
    await within(namesSection()).findByText('Maria')

    await user.click(within(namesSection()).getAllByRole('button', { name: 'Excluir' })[0])

    expect(window.confirm).toHaveBeenCalledOnce()
    await vi.waitFor(() =>
      expect(within(namesSection()).queryByText('Maria')).not.toBeInTheDocument(),
    )
    expect(within(namesSection()).getByText('João')).toBeInTheDocument()
  })

  it('não exclui se o usuário cancelar a confirmação', async () => {
    resetDb({ names: ['Maria'] })
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    render(<App />)
    await within(namesSection()).findByText('Maria')

    await user.click(within(namesSection()).getByRole('button', { name: 'Excluir' }))

    expect(within(namesSection()).getByText('Maria')).toBeInTheDocument()
  })
})

describe('idades (CRUD)', () => {
  it('cadastra uma data de nascimento e mostra a idade calculada pelo backend', async () => {
    render(<App />)
    await within(agesSection()).findByText('Nenhuma data de nascimento cadastrada.')

    fireEvent.change(within(agesSection()).getByLabelText('Novo valor'), {
      target: { value: birthDateYearsAgo(25) },
    })
    await userEvent.click(within(agesSection()).getByRole('button', { name: 'Cadastrar' }))

    expect(await within(agesSection()).findByText('25 anos')).toBeInTheDocument()
  })

  it('atualiza a data de nascimento e recalcula a idade', async () => {
    resetDb({ agesYears: [30] })
    render(<App />)
    await within(agesSection()).findByText('30 anos')

    await userEvent.click(within(agesSection()).getByRole('button', { name: 'Editar' }))
    const edit = within(agesSection()).getByLabelText('Editar valor')
    expect(edit).toHaveValue(birthDateYearsAgo(30))
    fireEvent.change(edit, { target: { value: birthDateYearsAgo(40) } })
    await userEvent.click(within(agesSection()).getByRole('button', { name: 'Salvar' }))

    expect(await within(agesSection()).findByText('40 anos')).toBeInTheDocument()
    expect(within(agesSection()).queryByText('30 anos')).not.toBeInTheDocument()
  })

  it('exclui uma data de nascimento', async () => {
    resetDb({ agesYears: [30] })
    render(<App />)
    await within(agesSection()).findByText('30 anos')

    await userEvent.click(within(agesSection()).getByRole('button', { name: 'Excluir' }))

    expect(
      await within(agesSection()).findByText('Nenhuma data de nascimento cadastrada.'),
    ).toBeInTheDocument()
  })

  it('não permite escolher datas futuras (atributo max)', async () => {
    render(<App />)
    await within(agesSection()).findByText('Nenhuma data de nascimento cadastrada.')
    const input = within(agesSection()).getByLabelText('Novo valor')
    expect(input).toHaveAttribute('max', localISODate(new Date()))
  })
})

describe('tratamento de erros', () => {
  it('exibe a mensagem de validação (422) devolvida pelo backend', async () => {
    const user = userEvent.setup()
    render(<App />)
    await within(namesSection()).findByText('Nenhum nome cadastrado.')

    // só espaços passa pelo "required" do navegador, mas o backend rejeita
    await user.type(within(namesSection()).getByLabelText('Novo valor'), '   ')
    await user.click(within(namesSection()).getByRole('button', { name: 'Cadastrar' }))

    expect(await within(namesSection()).findByRole('alert')).toHaveTextContent(
      'O nome não pode ser vazio',
    )
    // o erro fica restrito à seção de nomes
    expect(within(agesSection()).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('exibe a mensagem de 404 ao editar um registro que já foi removido', async () => {
    resetDb({ names: ['Maria'] })
    const user = userEvent.setup()
    render(<App />)
    await within(namesSection()).findByText('Maria')

    // outro usuário apaga o registro enquanto a tela está aberta
    server.use(
      http.put(`${API_URL}/names/:id`, () =>
        HttpResponse.json({ detail: 'Nome não encontrado' }, { status: 404 }),
      ),
    )
    await user.click(within(namesSection()).getByRole('button', { name: 'Editar' }))
    await user.click(within(namesSection()).getByRole('button', { name: 'Salvar' }))

    expect(await within(namesSection()).findByRole('alert')).toHaveTextContent(
      'Nome não encontrado',
    )
  })

  it('avisa que o backend está fora do ar sem derrubar a outra seção', async () => {
    resetDb({ agesYears: [30] })
    server.use(http.get(`${API_URL}/names`, () => HttpResponse.error()))
    render(<App />)

    expect(await within(namesSection()).findByRole('alert')).toHaveTextContent(
      'Não foi possível conectar ao backend',
    )
    // a seção de idades continua funcionando
    expect(await within(agesSection()).findByText('30 anos')).toBeInTheDocument()
  })
})
