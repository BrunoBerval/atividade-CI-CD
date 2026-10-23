"""Testes do app principal: as duas rotas devem estar registradas."""


def test_openapi_exposes_both_routers(client):
    paths = client.get("/openapi.json").json()["paths"]
    assert "/names" in paths
    assert "/names/{name_id}" in paths
    assert "/ages" in paths
    assert "/ages/{age_id}" in paths
