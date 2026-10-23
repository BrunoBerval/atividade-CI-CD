import { useEffect, useState } from "react";
import type { FormEvent } from "react";

const API_URL = "http://localhost:8000";

// ---------- Tipos ----------
interface NameItem {
  id: number;
  name: string;
}

interface AgeItem {
  id: number;
  birth_date: string; // YYYY-MM-DD
  age: number;
}

// ---------- Cliente da API ----------
async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    let message = `Erro ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (Array.isArray(body.detail)) {
        // 422 do FastAPI/Pydantic
        message = body.detail
          .map((d: { msg: string }) => d.msg.replace(/^Value error, /, ""))
          .join("; ");
      }
    } catch {
      /* resposta sem JSON */
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const describeError = (e: unknown) =>
  e instanceof TypeError
    ? "Não foi possível conectar ao backend. Ele está rodando?"
    : (e as Error).message;

const formatDate =(iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const today = () => new Date().toISOString().slice(0, 10);

// ---------- Seção genérica de CRUD ----------
interface CrudSectionProps<T extends { id: number }> {
  title: string;
  endpoint: string;
  inputType: "text" | "date";
  placeholder?: string;
  fieldKey: "name" | "birth_date";
  emptyText: string;
  renderItem: (item: T) => React.ReactNode;
  getValue: (item: T) => string;
}

function CrudSection<T extends { id: number }>({
  title,
  endpoint,
  inputType,
  placeholder,
  fieldKey,
  emptyText,
  renderItem,
  getValue,
}: CrudSectionProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // Carga inicial: setState apenas nos callbacks da promise (nunca direto no corpo do efeito)
  useEffect(() => {
    let active = true;
    api<T[]>(endpoint)
      .then((data) => {
        if (!active) return;
        setItems(data);
        setError(null);
      })
      .catch((e) => {
        if (active) setError(describeError(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [endpoint]);

  // Executa uma mutação e recarrega a lista
  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      setItems(await api<T[]>(endpoint));
      setError(null);
    } catch (e) {
      setError(describeError(e));
    }
  };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      await api(endpoint, {
        method: "POST",
        body: JSON.stringify({ [fieldKey]: newValue }),
      });
      setNewValue("");
    });
  };

  const handleUpdate = (id: number) =>
    run(async () => {
      await api(`${endpoint}/${id}`, {
        method: "PUT",
        body: JSON.stringify({ [fieldKey]: editValue }),
      });
      setEditingId(null);
    });

  const handleDelete = (id: number) => {
    if (!window.confirm("Excluir este registro?")) return;
    run(() => api(`${endpoint}/${id}`, { method: "DELETE" }));
  };

  const startEdit = (item: T) => {
    setEditingId(item.id);
    setEditValue(getValue(item));
    setError(null);
  };

  const dateProps = inputType === "date" ? { max: today() } : {};

  return (
    <section className="card">
      <h2>{title}</h2>

      <form className="row" onSubmit={handleCreate}>
        <input
          type={inputType}
          value={newValue}
          placeholder={placeholder}
          onChange={(e) => setNewValue(e.target.value)}
          required
          {...dateProps}
        />
        <button type="submit" className="primary">
          Cadastrar
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="muted">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="muted">{emptyText}</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              {editingId === item.id ? (
                <>
                  <input
                    type={inputType}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    {...dateProps}
                  />
                  <div className="actions">
                    <button className="primary" onClick={() => handleUpdate(item.id)}>
                      Salvar
                    </button>
                    <button onClick={() => setEditingId(null)}>Cancelar</button>
                  </div>
                </>
              ) : (
                <>
                  <span className="item-text">{renderItem(item)}</span>
                  <div className="actions">
                    <button onClick={() => startEdit(item)}>Editar</button>
                    <button className="danger" onClick={() => handleDelete(item.id)}>
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------- App ----------
export default function App() {
  return (
    <main className="container">
      <style>{css}</style>
      <h1>Nomes e Idades</h1>

      <div className="grid">
        <CrudSection<NameItem>
          title="Nomes"
          endpoint="/names"
          inputType="text"
          fieldKey="name"
          placeholder="Digite um nome"
          emptyText="Nenhum nome cadastrado."
          getValue={(n) => n.name}
          renderItem={(n) => <strong>{n.name}</strong>}
        />

        <CrudSection<AgeItem>
          title="Idades"
          endpoint="/ages"
          inputType="date"
          fieldKey="birth_date"
          emptyText="Nenhuma data de nascimento cadastrada."
          getValue={(a) => a.birth_date}
          renderItem={(a) => (
            <>
              <strong>{a.age} anos</strong>
              <small>nascido(a) em {formatDate(a.birth_date)}</small>
            </>
          )}
        />
      </div>
    </main>
  );
}

// ---------- Estilos ----------
const css = `
  :root { color-scheme: light dark; }
  body { margin: 0; font-family: system-ui, sans-serif; background: #f4f5f7; }
  @media (prefers-color-scheme: dark) { body { background: #16181d; } }

  .container { max-width: 960px; margin: 0 auto; padding: 32px 16px; }
  .container h1 { margin: 0 0 24px; }
  .grid { display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); align-items: start; }

  .card { background: Canvas; color: CanvasText; border: 1px solid #8884; border-radius: 12px; padding: 20px; }
  .card h2 { margin: 0 0 16px; font-size: 1.15rem; }

  .row { display: flex; gap: 8px; margin-bottom: 12px; }
  .row input { flex: 1; }
  input { padding: 8px 10px; border: 1px solid #8887; border-radius: 8px; font: inherit; min-width: 0; background: Field; color: FieldText; }

  button { padding: 8px 12px; border: 1px solid #8887; border-radius: 8px; background: ButtonFace; color: ButtonText; font: inherit; cursor: pointer; }
  button:hover { filter: brightness(0.95); }
  button.primary { background: #2563eb; border-color: #2563eb; color: #fff; }
  button.danger { color: #dc2626; border-color: #dc262666; }

  ul { list-style: none; margin: 0; padding: 0; }
  li { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 0; border-top: 1px solid #8883; }
  li input { flex: 1; }
  .item-text { display: flex; flex-direction: column; gap: 2px; overflow-wrap: anywhere; }
  .item-text small { opacity: 0.65; }
  .actions { display: flex; gap: 6px; flex-shrink: 0; }

  .muted { opacity: 0.6; margin: 8px 0 0; }
  .error { background: #dc262620; color: #dc2626; border-radius: 8px; padding: 8px 10px; margin: 0 0 12px; }
`;