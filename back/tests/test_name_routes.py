"""Testes do CRUD de /names (escritos antes da implementação)."""


def create_name(client, name="Maria"):
    return client.post("/names", json={"name": name})


# ---------- CREATE ----------
def test_create_name_returns_201_and_body(client):
    response = create_name(client, "Maria")
    assert response.status_code == 201
    data = response.json()
    assert data["id"] == 1
    assert data["name"] == "Maria"


def test_create_name_empty_returns_422(client):
    assert create_name(client, "").status_code == 422


def test_create_name_missing_field_returns_422(client):
    assert client.post("/names", json={}).status_code == 422


def test_create_name_strips_whitespace(client):
    response = create_name(client, "  João  ")
    assert response.status_code == 201
    assert response.json()["name"] == "João"


def test_create_name_blank_spaces_only_returns_422(client):
    assert create_name(client, "   ").status_code == 422


# ---------- LIST ----------
def test_list_names_empty(client):
    response = client.get("/names")
    assert response.status_code == 200
    assert response.json() == []


def test_list_names_returns_all(client):
    create_name(client, "Maria")
    create_name(client, "João")
    response = client.get("/names")
    assert response.status_code == 200
    assert [n["name"] for n in response.json()] == ["Maria", "João"]


# ---------- GET ONE ----------
def test_get_name_by_id(client):
    created = create_name(client, "Maria").json()
    response = client.get(f"/names/{created['id']}")
    assert response.status_code == 200
    assert response.json() == {"id": created["id"], "name": "Maria"}


def test_get_name_not_found_returns_404(client):
    response = client.get("/names/999")
    assert response.status_code == 404


# ---------- UPDATE ----------
def test_update_name(client):
    created = create_name(client, "Maria").json()
    response = client.put(f"/names/{created['id']}", json={"name": "Mariana"})
    assert response.status_code == 200
    assert response.json() == {"id": created["id"], "name": "Mariana"}
    # persistiu
    assert client.get(f"/names/{created['id']}").json()["name"] == "Mariana"


def test_update_name_not_found_returns_404(client):
    response = client.put("/names/999", json={"name": "Ninguém"})
    assert response.status_code == 404


def test_update_name_invalid_returns_422(client):
    created = create_name(client, "Maria").json()
    response = client.put(f"/names/{created['id']}", json={"name": ""})
    assert response.status_code == 422


# ---------- DELETE ----------
def test_delete_name(client):
    created = create_name(client, "Maria").json()
    response = client.delete(f"/names/{created['id']}")
    assert response.status_code == 204
    assert client.get(f"/names/{created['id']}").status_code == 404


def test_delete_name_not_found_returns_404(client):
    assert client.delete("/names/999").status_code == 404


def test_delete_name_does_not_affect_others(client):
    a = create_name(client, "Maria").json()
    b = create_name(client, "João").json()
    client.delete(f"/names/{a['id']}")
    assert client.get(f"/names/{b['id']}").status_code == 200
