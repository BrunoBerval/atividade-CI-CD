"""Testes do CRUD de /ages (escritos antes da implementação).

O usuário cadastra a data de nascimento; o backend calcula a idade.
"""
from datetime import date, timedelta

import pytest

from age_routes import calculate_age


# ---------- calculate_age (função pura, data de referência fixa) ----------
@pytest.mark.parametrize(
    "birth, today, expected",
    [
        (date(2000, 5, 10), date(2025, 5, 10), 25),   # aniversário hoje
        (date(2000, 5, 10), date(2025, 5, 9), 24),    # um dia antes
        (date(2000, 5, 10), date(2025, 5, 11), 25),   # um dia depois
        (date(2000, 12, 31), date(2025, 1, 1), 24),   # virada de ano
        (date(2000, 2, 29), date(2025, 2, 28), 24),   # bissexto, antes
        (date(2000, 2, 29), date(2025, 3, 1), 25),    # bissexto, depois
        (date(2025, 5, 10), date(2025, 5, 10), 0),    # nasceu hoje
    ],
)
def test_calculate_age(birth, today, expected):
    assert calculate_age(birth, today) == expected


def test_calculate_age_defaults_to_today():
    birth = date.today().replace(year=date.today().year - 30)
    assert calculate_age(birth) == 30


# ---------- CREATE ----------
def test_create_birth_date_returns_201_with_age(client):
    birth = date.today() - timedelta(days=365 * 20 + 5)
    response = client.post("/ages", json={"birth_date": birth.isoformat()})
    assert response.status_code == 201
    data = response.json()
    assert data["id"] == 1
    assert data["birth_date"] == birth.isoformat()
    assert data["age"] == calculate_age(birth)


def test_create_birth_date_in_future_returns_422(client):
    future = date.today() + timedelta(days=1)
    response = client.post("/ages", json={"birth_date": future.isoformat()})
    assert response.status_code == 422


def test_create_birth_date_invalid_format_returns_422(client):
    response = client.post("/ages", json={"birth_date": "10/05/2000"})
    assert response.status_code == 422


def test_create_birth_date_missing_returns_422(client):
    assert client.post("/ages", json={}).status_code == 422


def test_client_cannot_send_age_directly(client):
    """A idade é sempre calculada pelo backend, nunca aceita do cliente."""
    response = client.post(
        "/ages", json={"birth_date": "2000-05-10", "age": 99}
    )
    assert response.status_code == 201
    assert response.json()["age"] == calculate_age(date(2000, 5, 10))


# ---------- LIST ----------
def test_list_ages_empty(client):
    response = client.get("/ages")
    assert response.status_code == 200
    assert response.json() == []


def test_list_ages_returns_all_with_age(client):
    client.post("/ages", json={"birth_date": "2000-05-10"})
    client.post("/ages", json={"birth_date": "1990-01-15"})
    response = client.get("/ages")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["age"] == calculate_age(date(2000, 5, 10))
    assert data[1]["age"] == calculate_age(date(1990, 1, 15))


# ---------- GET ONE ----------
def test_get_birth_date_by_id(client):
    created = client.post("/ages", json={"birth_date": "2000-05-10"}).json()
    response = client.get(f"/ages/{created['id']}")
    assert response.status_code == 200
    assert response.json() == created


def test_get_birth_date_not_found_returns_404(client):
    assert client.get("/ages/999").status_code == 404


# ---------- UPDATE ----------
def test_update_birth_date_recalculates_age(client):
    created = client.post("/ages", json={"birth_date": "2000-05-10"}).json()
    response = client.put(
        f"/ages/{created['id']}", json={"birth_date": "1980-03-20"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == created["id"]
    assert data["birth_date"] == "1980-03-20"
    assert data["age"] == calculate_age(date(1980, 3, 20))
    # persistiu
    assert client.get(f"/ages/{created['id']}").json() == data


def test_update_birth_date_not_found_returns_404(client):
    response = client.put("/ages/999", json={"birth_date": "2000-05-10"})
    assert response.status_code == 404


def test_update_birth_date_in_future_returns_422(client):
    created = client.post("/ages", json={"birth_date": "2000-05-10"}).json()
    future = (date.today() + timedelta(days=1)).isoformat()
    response = client.put(f"/ages/{created['id']}", json={"birth_date": future})
    assert response.status_code == 422


# ---------- DELETE ----------
def test_delete_birth_date(client):
    created = client.post("/ages", json={"birth_date": "2000-05-10"}).json()
    response = client.delete(f"/ages/{created['id']}")
    assert response.status_code == 204
    assert client.get(f"/ages/{created['id']}").status_code == 404


def test_delete_birth_date_not_found_returns_404(client):
    assert client.delete("/ages/999").status_code == 404
